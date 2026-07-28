import { createHash } from "node:crypto";
import { getPostgresClient } from "@/db";
import type { OrderStatus } from "./order-status";

export type TrackedOrder = {
  orderNumber: number;
  status: OrderStatus;
  customerName: string;
  fulfillment: "pickup" | "delivery";
  address: string | null;
  subtotalInCents: number;
  deliveryFeeInCents: number;
  totalInCents: number;
  createdAt: string;
  paymentLabel: string;
  items: Array<{
    id: string;
    name: string;
    unitPriceInCents: number;
    quantity: number;
    lineTotalInCents: number;
  }>;
  history: Array<{ status: OrderStatus; createdAt: string }>;
};

export async function getTrackedOrder(
  trackingToken: string,
): Promise<TrackedOrder | null> {
  if (!/^[A-Za-z0-9_-]{40,100}$/.test(trackingToken)) return null;
  const sql = getPostgresClient();
  const tokenHash = createHash("sha256").update(trackingToken).digest("hex");
  const orderRows = await sql.unsafe<
    Array<{
      id: string;
      friendly_number: number;
      status: OrderStatus;
      customer_name_snapshot: string;
      fulfillment_type: "pickup" | "delivery";
      address_snapshot: string | null;
      subtotal_cents: number;
      delivery_fee_cents: number;
      total_cents: number;
      created_at: string;
      payment_label: string;
    }>
  >(
    `SELECT o.id, o.friendly_number, o.status, o.customer_name_snapshot,
            o.fulfillment_type, o.address_snapshot, o.subtotal_cents,
            o.delivery_fee_cents, o.total_cents, o.created_at,
            pm.label AS payment_label
     FROM orders o
     JOIN payments py ON py.order_id = o.id
     JOIN payment_methods pm ON pm.id = py.payment_method_id
     WHERE o.tracking_token_hash = $1
     LIMIT 1`,
    [tokenHash],
  );
  const order = orderRows[0];
  if (!order) return null;

  const [items, history] = await Promise.all([
    sql.unsafe<
      Array<{
        id: string;
        product_name_snapshot: string;
        unit_price_cents_snapshot: number;
        quantity: number;
        line_total_cents: number;
      }>
    >(
      `SELECT id, product_name_snapshot, unit_price_cents_snapshot,
              quantity, line_total_cents
       FROM order_items
       WHERE order_id = $1
       ORDER BY id`,
      [order.id],
    ),
    sql.unsafe<Array<{ new_status: OrderStatus; created_at: string }>>(
      `SELECT new_status, created_at
       FROM order_status_history
       WHERE order_id = $1
       ORDER BY created_at ASC`,
      [order.id],
    ),
  ]);

  return {
    orderNumber: order.friendly_number,
    status: order.status,
    customerName: order.customer_name_snapshot,
    fulfillment: order.fulfillment_type,
    address: order.address_snapshot,
    subtotalInCents: order.subtotal_cents,
    deliveryFeeInCents: order.delivery_fee_cents,
    totalInCents: order.total_cents,
    createdAt: order.created_at,
    paymentLabel: order.payment_label,
    items: items.map((item) => ({
      id: item.id,
      name: item.product_name_snapshot,
      unitPriceInCents: item.unit_price_cents_snapshot,
      quantity: item.quantity,
      lineTotalInCents: item.line_total_cents,
    })),
    history: history.map((entry) => ({
      status: entry.new_status,
      createdAt: entry.created_at,
    })),
  };
}
