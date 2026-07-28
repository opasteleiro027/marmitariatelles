import { createHash, createHmac, randomUUID } from "node:crypto";
import type postgres from "postgres";
import { withTransaction } from "@/db";
import {
  calculateOrderTotal,
  validateChangeAmount,
} from "../domain/calculate-order-total";
import {
  OrderRequestError,
  type ConfirmOrderRequest,
} from "../domain/order-request";

type MenuRow = {
  id: string;
  sales_date: string;
  ordering_opens_at: string;
  ordering_closes_at: string;
  total_capacity: number | null;
  closed_manually: boolean;
};

type ProductRow = {
  menu_item_id: string;
  product_id: string;
  name: string;
  price_cents: number;
  promotional_price_cents: number | null;
  override_price_cents: number | null;
  stock_quantity: number | null;
  order_limit: number | null;
  available_quantity: number | null;
  sold_quantity: number;
  product_active: boolean;
  sold_out: boolean;
  menu_item_active: boolean;
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
      `SELECT id, sales_date, ordering_opens_at, ordering_closes_at,
              total_capacity, closed_manually
       FROM sales_menus
       WHERE published = TRUE
         AND ordering_opens_at <= $1
         AND ordering_closes_at >= $1
       ORDER BY sales_date ASC
       LIMIT 1
       FOR UPDATE`,
      [new Date().toISOString()],
    );
    const menu = menuRows[0];
    if (!menu || menu.closed_manually) {
      throw new OrderRequestError(
        "Os pedidos estão fechados neste momento.",
        409,
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
        "Os pedidos estão pausados neste momento.",
        409,
      );
    }

    if (menu.total_capacity !== null) {
      const countRows = await sql.unsafe<Array<{ count: number }>>(
        `SELECT COUNT(*)::INT AS count
         FROM orders
         WHERE menu_id = $1 AND status <> 'cancelled'`,
        [menu.id],
      );
      if ((countRows[0]?.count ?? 0) >= menu.total_capacity) {
        throw new OrderRequestError(
          "A capacidade desta venda foi preenchida.",
          409,
        );
      }
    }

    const productIds = request.items.map((item) => item.productId);
    const productRows = await sql.unsafe<ProductRow[]>(
      `SELECT smi.id AS menu_item_id, p.id AS product_id, p.name,
              p.price_cents, p.promotional_price_cents,
              smi.override_price_cents, p.stock_quantity, p.order_limit,
              smi.available_quantity, smi.sold_quantity,
              p.active AS product_active, p.sold_out,
              smi.active AS menu_item_active
       FROM sales_menu_items smi
       JOIN products p ON p.id = smi.product_id
       WHERE smi.menu_id = $1 AND p.id = ANY($2::TEXT[])
       FOR UPDATE OF smi, p`,
      [menu.id, productIds],
    );
    if (productRows.length !== productIds.length) {
      throw new OrderRequestError(
        "Um dos produtos não pertence mais ao cardápio.",
        409,
      );
    }

    const requestedByProduct = new Map(
      request.items.map((item) => [item.productId, item.quantity]),
    );
    const pricedItems = productRows.map((product) => {
      const quantity = requestedByProduct.get(product.product_id) ?? 0;
      if (!product.product_active || !product.menu_item_active || product.sold_out) {
        throw new OrderRequestError(
          `${product.name} está indisponível no momento.`,
          409,
        );
      }
      if (product.order_limit !== null && quantity > product.order_limit) {
        throw new OrderRequestError(
          `O limite de ${product.name} é ${product.order_limit} por pedido.`,
          409,
        );
      }
      if (product.stock_quantity !== null && quantity > product.stock_quantity) {
        throw new OrderRequestError(
          `Não há quantidade suficiente de ${product.name}.`,
          409,
        );
      }
      if (
        product.available_quantity !== null &&
        product.sold_quantity + quantity > product.available_quantity
      ) {
        throw new OrderRequestError(
          `Não há quantidade suficiente de ${product.name}.`,
          409,
        );
      }
      return {
        ...product,
        quantity,
        unitPriceInCents:
          product.override_price_cents ??
          product.promotional_price_cents ??
          product.price_cents,
      };
    });

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

    for (const item of pricedItems) {
      await sql.unsafe(
        `INSERT INTO order_items
          (id, order_id, product_id, product_name_snapshot,
           unit_price_cents_snapshot, quantity, line_total_cents)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          randomUUID(),
          orderId,
          item.product_id,
          item.name,
          item.unitPriceInCents,
          item.quantity,
          item.unitPriceInCents * item.quantity,
        ],
      );
      await sql.unsafe(
        `UPDATE sales_menu_items
         SET sold_quantity = sold_quantity + $1
         WHERE id = $2`,
        [item.quantity, item.menu_item_id],
      );
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
      `UPDATE delivery_slots
       SET reserved_count = reserved_count + 1
       WHERE id = $1`,
      [request.deliverySlotId],
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
    Array<{ id: string; capacity: number; reserved_count: number }>
  >(
    `SELECT id, capacity, reserved_count
     FROM delivery_slots
     WHERE id = $1 AND sales_date = $2 AND active = TRUE
     FOR UPDATE`,
    [request.deliverySlotId, salesDate],
  );
  const slot = slotRows[0];
  if (!slot || slot.reserved_count >= slot.capacity) {
    throw new OrderRequestError(
      "O horário escolhido não está mais disponível.",
      409,
    );
  }
  if (request.fulfillment === "pickup") {
    return { feeInCents: 0, minimumOrderInCents: 0 };
  }
  const areaRows = await sql.unsafe<
    Array<{ delivery_fee_cents: number; minimum_order_cents: number }>
  >(
    `SELECT delivery_fee_cents, minimum_order_cents
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
