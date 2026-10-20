import { randomUUID } from "node:crypto";
import { withTransaction } from "@/db";
import type { FulfillmentType } from "../domain/fulfillment";
import type { OrderStatus } from "./order-status";
import { registerConfirmedPayment } from "./cash-register";

export async function addTableConsumption({
  orderId,
  name,
  quantity,
  unitPriceInCents,
  notes,
}: {
  orderId: string;
  name: string;
  quantity: number;
  unitPriceInCents: number;
  notes: string | null;
}) {
  const normalizedName = name.trim();
  const normalizedNotes = notes?.trim() || null;
  if (!orderId || !normalizedName || normalizedName.length > 120) {
    throw new Error("Informe o item que será adicionado à comanda.");
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new Error("Informe uma quantidade válida.");
  }
  if (
    !Number.isInteger(unitPriceInCents) ||
    unitPriceInCents < 0 ||
    unitPriceInCents > 1_000_000
  ) {
    throw new Error("Informe um valor válido para o item.");
  }
  if (normalizedNotes && normalizedNotes.length > 150) {
    throw new Error("A observação deve ter no máximo 150 caracteres.");
  }

  await withTransaction(async (sql) => {
    const rows = await sql.unsafe<
      Array<{
        id: string;
        status: OrderStatus;
        fulfillment_type: FulfillmentType;
        payment_status: "pending" | "confirmed" | "cancelled";
      }>
    >(
      `SELECT o.id, o.status, o.fulfillment_type,
              py.status AS payment_status
       FROM orders o
       JOIN payments py ON py.order_id = o.id
       WHERE o.id = $1
       FOR UPDATE OF o, py`,
      [orderId],
    );
    const order = rows[0];
    if (!order || order.fulfillment_type !== "dine_in") {
      throw new Error("Comanda de mesa não encontrada.");
    }
    if (
      order.status === "received" ||
      order.status === "awaiting_confirmation"
    ) {
      throw new Error("Aceite o pedido antes de adicionar novos consumos.");
    }
    if (
      order.status === "cancelled" ||
      order.payment_status !== "pending"
    ) {
      throw new Error("Esta comanda já foi encerrada.");
    }

    const timestamp = new Date().toISOString();
    const lineTotalInCents = quantity * unitPriceInCents;
    await sql.unsafe(
      `INSERT INTO order_items
        (id, order_id, product_id, product_name_snapshot,
         unit_price_cents_snapshot, quantity, notes, line_total_cents)
       VALUES ($1, $2, NULL, $3, $4, $5, $6, $7)`,
      [
        randomUUID(),
        orderId,
        normalizedName,
        unitPriceInCents,
        quantity,
        normalizedNotes,
        lineTotalInCents,
      ],
    );
    await sql.unsafe(
      `UPDATE orders
       SET subtotal_cents = subtotal_cents + $1,
           total_cents = total_cents + $1,
           updated_at = $2
       WHERE id = $3`,
      [lineTotalInCents, timestamp, orderId],
    );
    await sql.unsafe(
      `UPDATE payments
       SET amount_cents = amount_cents + $1
       WHERE order_id = $2`,
      [lineTotalInCents, orderId],
    );
  });
}

export async function closeTableTab(
  orderId: string,
  adminEmail: string,
  paymentMethodId: string,
) {
  if (!orderId || !paymentMethodId) throw new Error("Comanda ou forma de pagamento inválida.");

  await withTransaction(async (sql) => {
    const rows = await sql.unsafe<
      Array<{
        id: string;
        status: OrderStatus;
        fulfillment_type: FulfillmentType;
        payment_status: "pending" | "confirmed" | "cancelled";
        payment_id: string;
        amount_cents: number;
        friendly_number: number;
      }>
    >(
      `SELECT o.id, o.status, o.fulfillment_type, o.friendly_number,
              py.id AS payment_id, py.amount_cents, py.status AS payment_status
       FROM orders o
       JOIN payments py ON py.order_id = o.id
       WHERE o.id = $1
       FOR UPDATE OF o, py`,
      [orderId],
    );
    const order = rows[0];
    if (!order || order.fulfillment_type !== "dine_in") {
      throw new Error("Comanda de mesa não encontrada.");
    }
    if (order.status !== "ready_for_pickup") {
      throw new Error("Marque o pedido como servido antes de fechar a comanda.");
    }
    if (order.payment_status !== "pending") {
      throw new Error("Esta comanda já foi paga ou cancelada.");
    }

    const timestamp = new Date().toISOString();
    await registerConfirmedPayment(sql, {
      paymentId: order.payment_id,
      orderId,
      orderNumber: order.friendly_number,
      amountCents: order.amount_cents,
      paymentMethodId,
      adminEmail,
    });
    await sql.unsafe(
      `UPDATE orders SET status = 'delivered', updated_at = $1 WHERE id = $2`,
      [timestamp, orderId],
    );
    await sql.unsafe(
      `INSERT INTO order_status_history
        (id, order_id, previous_status, new_status, changed_by_admin_id,
         created_at)
       VALUES ($1, $2, $3, 'delivered', $4, $5)`,
      [
        randomUUID(),
        orderId,
        order.status,
        (await sql.unsafe<Array<{ id: string }>>(
          `SELECT id FROM admin_users WHERE LOWER(email) = LOWER($1) AND active = TRUE LIMIT 1`,
          [adminEmail],
        ))[0]?.id ?? null,
        timestamp,
      ],
    );
  });
}
