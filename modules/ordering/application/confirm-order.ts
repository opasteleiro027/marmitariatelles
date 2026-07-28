import { createHash, createHmac, randomUUID } from "node:crypto";
import type postgres from "postgres";
import { withTransaction } from "@/db";
import { addressBelongsToDeliveryArea } from "@/modules/address-location/domain/match-delivery-area";
import {
  calculateOrderTotal,
  validateChangeAmount,
} from "../domain/calculate-order-total";
import {
  OrderRequestError,
  type ConfirmOrderRequest,
} from "../domain/order-request";
import {
  priceOrderItems,
  type OrderProductRow,
} from "./price-order-items";

type MenuRow = {
  id: string;
  sales_date: string;
};

export type ConfirmedOrder = {
  orderNumber: number;
  trackingToken: string;
  totalInCents: number;
};

export async function confirmOrder(
  request: ConfirmOrderRequest,
): Promise<ConfirmedOrder> {
  const secret = process.env.ORDER_TOKEN_SECRET ?? process.env.SESSION_SECRET;
  if (!secret) {
    throw new OrderRequestError(
      "O serviço de pedidos ainda não foi configurado.",
      503,
    );
  }

  const keyHash = hash(request.idempotencyKey);
  const requestHash = hash(JSON.stringify(request));
  const trackingToken = createHmac("sha256", secret)
    .update(`tracking:${request.idempotencyKey}`)
    .digest("base64url");
  const trackingTokenHash = hash(trackingToken);

  return withTransaction(async (sql) => {
    await sql.unsafe("SELECT pg_advisory_xact_lock(hashtext($1))", [keyHash]);

    const existing = await sql.unsafe<
      Array<{
        request_hash: string;
        friendly_number: number;
        total_cents: number;
      }>
    >(
      `SELECT i.request_hash, o.friendly_number, o.total_cents
       FROM order_idempotency_keys i
       JOIN orders o ON o.id = i.order_id
       WHERE i.key_hash = $1`,
      [keyHash],
    );
    if (existing[0]) {
      if (existing[0].request_hash !== requestHash) {
        throw new OrderRequestError(
          "Esta tentativa já foi usada para outro pedido.",
          409,
        );
      }
      return {
        orderNumber: existing[0].friendly_number,
        trackingToken,
        totalInCents: existing[0].total_cents,
      };
    }

    const menuRows = await sql.unsafe<MenuRow[]>(
      `SELECT id, sales_date
       FROM sales_menus
       WHERE operational = TRUE
       LIMIT 1
       FOR UPDATE`,
    );
    const menu = menuRows[0];
    if (!menu) {
      throw new OrderRequestError(
        "O cardápio interno está temporariamente indisponível.",
        503,
      );
    }

    const settingsRows = await sql.unsafe<
      Array<{ minimum_order_cents: number; orders_paused: boolean }>
    >(
      `SELECT minimum_order_cents, orders_paused
       FROM business_settings
       ORDER BY updated_at DESC
       LIMIT 1`,
    );
    const settings = settingsRows[0];
    if (!settings || settings.orders_paused) {
      throw new OrderRequestError(
        "O site está desligado para novos pedidos.",
        409,
      );
    }

    const productIds = Array.from(
      new Set(request.items.map((item) => item.productId)),
    );
    const productRows = await sql.unsafe<OrderProductRow[]>(
      `SELECT p.id AS product_id, p.name,
              p.price_cents, p.promotional_price_cents,
              p.stock_quantity, p.order_limit,
              p.active AS product_active, p.sold_out
       FROM products p
       WHERE p.id = ANY($1::TEXT[]) AND p.deleted_at IS NULL
       FOR UPDATE OF p`,
      [productIds],
    );
    if (productRows.length !== productIds.length) {
      throw new OrderRequestError(
        "Um dos produtos não pertence mais ao cardápio.",
        409,
      );
    }

    const pricedItems = await priceOrderItems(sql, request.items, productRows);

    const delivery = await validateFulfillment(sql, request, menu.sales_date);
    const paymentRows = await sql.unsafe<
      Array<{ id: string; code: string }>
    >(
      `SELECT id, code FROM payment_methods
       WHERE id = $1 AND active = TRUE
       FOR UPDATE`,
      [request.paymentMethodId],
    );
    const paymentMethod = paymentRows[0];
    if (!paymentMethod) {
      throw new OrderRequestError(
        "A forma de pagamento não está disponível.",
        409,
      );
    }

    const total = calculateOrderTotal(
      pricedItems.map((item) => ({
        unitPriceInCents: item.unitPriceInCents,
        quantity: item.quantity,
        addonTotalInCents: item.addonTotalInCents,
      })),
      delivery.feeInCents,
    );
    const minimum = Math.max(
      settings.minimum_order_cents,
      delivery.minimumOrderInCents,
    );
    if (total.subtotalInCents < minimum) {
      throw new OrderRequestError(
        `O pedido mínimo é de ${formatMoney(minimum)}.`,
        409,
      );
    }
    if (
      request.changeForInCents !== null &&
      paymentMethod.code !== "cash"
    ) {
      throw new OrderRequestError("Troco só pode ser informado para dinheiro.");
    }
    if (!validateChangeAmount(total.totalInCents, request.changeForInCents)) {
      throw new OrderRequestError(
        "O valor para troco precisa ser maior ou igual ao total.",
      );
    }

    const timestamp = new Date().toISOString();
    const customerId = await saveCustomer(sql, request, timestamp);
    const addressId = await saveAddress(sql, request, customerId, timestamp);
    const orderId = randomUUID();
    const numberRows = await sql.unsafe<Array<{ next_number: number }>>(
      "SELECT COALESCE(MAX(friendly_number), 0)::INT + 1 AS next_number FROM orders",
    );
    const orderNumber = numberRows[0]?.next_number ?? 1;

    await sql.unsafe(
      `INSERT INTO orders
        (id, friendly_number, tracking_token_hash, customer_id, address_id,
         menu_id, delivery_area_id, delivery_slot_id, fulfillment_type, status,
         customer_name_snapshot, customer_phone_snapshot, address_snapshot,
         subtotal_cents, delivery_fee_cents, discount_cents, total_cents,
         created_at, updated_at)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'awaiting_confirmation',
         $10, $11, $12, $13, $14, 0, $15, $16, $16)`,
      [
        orderId,
        orderNumber,
        trackingTokenHash,
        customerId,
        addressId,
        menu.id,
        request.deliveryAreaId,
        request.deliverySlotId,
        request.fulfillment,
        request.customer.name,
        request.customer.phone,
        addressSnapshot(request),
        total.subtotalInCents,
        total.deliveryFeeInCents,
        total.totalInCents,
        timestamp,
      ],
    );

    for (const [itemIndex, item] of pricedItems.entries()) {
      const orderItemId = randomUUID();
      await sql.unsafe(
        `INSERT INTO order_items
          (id, order_id, product_id, product_name_snapshot,
           unit_price_cents_snapshot, quantity, notes, line_total_cents)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          orderItemId,
          orderId,
          item.product_id,
          item.name,
          item.unitPriceInCents,
          item.quantity,
          item.notes ?? (itemIndex === 0 ? request.notes : null),
          (item.unitPriceInCents + item.addonTotalInCents) * item.quantity,
        ],
      );
      for (const addon of item.addons) {
        await sql.unsafe(
          `INSERT INTO order_item_addons
            (id, order_item_id, addon_option_id, group_name_snapshot,
             addon_name_snapshot, unit_price_cents_snapshot, quantity)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            randomUUID(),
            orderItemId,
            addon.optionId,
            addon.groupName,
            addon.name,
            addon.unitPriceInCents,
            addon.quantity,
          ],
        );
      }
      await sql.unsafe(
        `UPDATE products
         SET stock_quantity = stock_quantity - $1, updated_at = $2
         WHERE id = $3 AND stock_quantity IS NOT NULL`,
        [item.quantity, timestamp, item.product_id],
      );
    }

    await sql.unsafe(
      `INSERT INTO payments
        (id, order_id, payment_method_id, status, amount_cents,
         change_for_cents, created_at)
       VALUES ($1, $2, $3, 'pending', $4, $5, $6)`,
      [
        randomUUID(),
        orderId,
        request.paymentMethodId,
        total.totalInCents,
        request.changeForInCents,
        timestamp,
      ],
    );
    await sql.unsafe(
      `INSERT INTO order_status_history
        (id, order_id, new_status, created_at)
       VALUES ($1, $2, 'awaiting_confirmation', $3)`,
      [randomUUID(), orderId, timestamp],
    );
    await sql.unsafe(
      `INSERT INTO order_idempotency_keys
        (key_hash, order_id, request_hash, created_at, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        keyHash,
        orderId,
        requestHash,
        timestamp,
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      ],
    );

    return { orderNumber, trackingToken, totalInCents: total.totalInCents };
  });
}

async function validateFulfillment(
  sql: postgres.TransactionSql,
  request: ConfirmOrderRequest,
  salesDate: string,
) {
  const slotRows = await sql.unsafe<
    Array<{ id: string }>
  >(
    `SELECT id
     FROM delivery_slots
     WHERE id = $1 AND sales_date = $2 AND active = TRUE
     FOR UPDATE`,
    [request.deliverySlotId, salesDate],
  );
  const slot = slotRows[0];
  if (!slot) {
    throw new OrderRequestError(
      "O horário escolhido não está mais disponível.",
      409,
    );
  }
  if (request.fulfillment === "pickup") {
    return { feeInCents: 0, minimumOrderInCents: 0 };
  }
  const areaRows = await sql.unsafe<
    Array<{
      id: string;
      neighborhood: string;
      city: string;
      delivery_fee_cents: number;
      minimum_order_cents: number;
    }>
  >(
    `SELECT id, neighborhood, city, delivery_fee_cents, minimum_order_cents
     FROM delivery_areas
     WHERE id = $1 AND active = TRUE
     FOR UPDATE`,
    [request.deliveryAreaId],
  );
  const area = areaRows[0];
  if (!area) {
    throw new OrderRequestError(
      "A área escolhida não está disponível para entrega.",
      409,
    );
  }
  if (
    !request.address ||
    !addressBelongsToDeliveryArea(request.address, area)
  ) {
    throw new OrderRequestError(
      "O bairro informado não corresponde à área de entrega escolhida.",
      409,
    );
  }
  return {
    feeInCents: area.delivery_fee_cents,
    minimumOrderInCents: area.minimum_order_cents,
  };
}

async function saveCustomer(
  sql: postgres.TransactionSql,
  request: ConfirmOrderRequest,
  timestamp: string,
) {
  const existing = await sql.unsafe<Array<{ id: string }>>(
    `SELECT id FROM customers
     WHERE phone = $1
     ORDER BY updated_at DESC
     LIMIT 1
     FOR UPDATE`,
    [request.customer.phone],
  );
  const customerId = existing[0]?.id ?? randomUUID();
  if (existing[0]) {
    await sql.unsafe(
      `UPDATE customers
       SET full_name = $1, email = $2, updated_at = $3
       WHERE id = $4`,
      [request.customer.name, request.customer.email, timestamp, customerId],
    );
  } else {
    await sql.unsafe(
      `INSERT INTO customers
        (id, full_name, phone, email, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $5)`,
      [
        customerId,
        request.customer.name,
        request.customer.phone,
        request.customer.email,
        timestamp,
      ],
    );
  }
  return customerId;
}

async function saveAddress(
  sql: postgres.TransactionSql,
  request: ConfirmOrderRequest,
  customerId: string,
  timestamp: string,
) {
  if (!request.address) return null;
  const id = randomUUID();
  await sql.unsafe(
    `INSERT INTO customer_addresses
      (id, customer_id, postal_code, street, number, complement,
       neighborhood, city, state, reference_point, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id,
      customerId,
      request.address.postalCode,
      request.address.street,
      request.address.number,
      request.address.complement,
      request.address.neighborhood,
      request.address.city,
      request.address.state,
      request.address.referencePoint,
      timestamp,
    ],
  );
  return id;
}

function addressSnapshot(request: ConfirmOrderRequest) {
  if (!request.address) return null;
  return [
    `${request.address.street}, ${request.address.number}`,
    request.address.complement,
    request.address.neighborhood,
    `${request.address.city} - ${request.address.state}`,
    `CEP ${request.address.postalCode}`,
    request.address.referencePoint
      ? `Referência: ${request.address.referencePoint}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}
