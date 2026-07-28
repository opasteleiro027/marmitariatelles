import { randomUUID } from "node:crypto";
import { getPostgresClient, withTransaction } from "@/db";
import {
  ORDER_STATUS_TRANSITIONS,
  isOrderStatus,
  type OrderStatus,
} from "./order-status";

export type AdminOrder = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  fulfillment: "pickup" | "delivery";
  totalInCents: number;
  createdAt: string;
  itemCount: number;
  paymentLabel: string;
};

export type AdminOrderSnapshot = {
  orders: AdminOrder[];
  metrics: {
    received: number;
    active: number;
    completed: number;
    projectedRevenueInCents: number;
  };
};

export async function getAdminOrders(): Promise<AdminOrderSnapshot> {
  const sql = getPostgresClient();
  const [orders, metrics] = await Promise.all([
    sql.unsafe<
      Array<{
        id: string;
        friendly_number: number;
        status: OrderStatus;
        customer_name_snapshot: string;
        customer_phone_snapshot: string;
        fulfillment_type: "pickup" | "delivery";
        total_cents: number;
        created_at: string;
        item_count: number;
        payment_label: string;
      }>
    >(
      `SELECT o.id, o.friendly_number, o.status,
              o.customer_name_snapshot, o.customer_phone_snapshot,
              o.fulfillment_type, o.total_cents, o.created_at,
              COALESCE(SUM(oi.quantity), 0)::INT AS item_count,
              pm.label AS payment_label
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN payments py ON py.order_id = o.id
       JOIN payment_methods pm ON pm.id = py.payment_method_id
       GROUP BY o.id, pm.label
       ORDER BY o.created_at DESC
       LIMIT 100`,
    ),
    sql.unsafe<
      Array<{
        received: number;
        active: number;
        completed: number;
        projected_revenue_cents: number;
      }>
    >(
      `SELECT
         COUNT(*)::INT AS received,
         COUNT(*) FILTER (
           WHERE status NOT IN ('delivered', 'cancelled')
         )::INT AS active,
         COUNT(*) FILTER (WHERE status = 'delivered')::INT AS completed,
         COALESCE(SUM(total_cents) FILTER (WHERE status <> 'cancelled'), 0)::INT
           AS projected_revenue_cents
       FROM orders`,
    ),
  ]);
  const totals = metrics[0] ?? {
    received: 0,
    active: 0,
    completed: 0,
    projected_revenue_cents: 0,
  };
  return {
    orders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.friendly_number,
      status: order.status,
      customerName: order.customer_name_snapshot,
      customerPhone: order.customer_phone_snapshot,
      fulfillment: order.fulfillment_type,
      totalInCents: order.total_cents,
      createdAt: order.created_at,
      itemCount: order.item_count,
      paymentLabel: order.payment_label,
    })),
    metrics: {
      received: totals.received,
      active: totals.active,
      completed: totals.completed,
      projectedRevenueInCents: totals.projected_revenue_cents,
    },
  };
}

export async function updateOrderStatus(
  orderId: string,
  nextStatusValue: string,
  adminEmail: string,
) {
  if (!orderId || !isOrderStatus(nextStatusValue)) {
    throw new Error("Atualização de pedido inválida.");
  }
  await withTransaction(async (sql) => {
    const orderRows = await sql.unsafe<
      Array<{
        id: string;
        status: OrderStatus;
        delivery_slot_id: string | null;
      }>
    >(
      `SELECT id, status, delivery_slot_id
       FROM orders
       WHERE id = $1
       FOR UPDATE`,
      [orderId],
    );
    const order = orderRows[0];
    if (!order) throw new Error("Pedido não encontrado.");
    if (!ORDER_STATUS_TRANSITIONS[order.status].includes(nextStatusValue)) {
      throw new Error("Esta mudança de status não é permitida.");
    }

    const adminRows = await sql.unsafe<Array<{ id: string }>>(
      `SELECT id FROM admin_users
       WHERE LOWER(email) = LOWER($1) AND active = TRUE
       LIMIT 1`,
      [adminEmail],
    );
    const timestamp = new Date().toISOString();

    if (nextStatusValue === "cancelled") {
      const items = await sql.unsafe<
        Array<{ product_id: string | null; quantity: number }>
      >(
        `SELECT product_id, quantity
         FROM order_items
         WHERE order_id = $1`,
        [orderId],
      );
      for (const item of items) {
        if (!item.product_id) continue;
        await sql.unsafe(
          `UPDATE sales_menu_items smi
           SET sold_quantity = GREATEST(0, smi.sold_quantity - $1)
           FROM orders o
           WHERE o.id = $2
             AND smi.menu_id = o.menu_id
             AND smi.product_id = $3`,
          [item.quantity, orderId, item.product_id],
        );
        await sql.unsafe(
          `UPDATE products
           SET stock_quantity = stock_quantity + $1, updated_at = $2
           WHERE id = $3 AND stock_quantity IS NOT NULL`,
          [item.quantity, timestamp, item.product_id],
        );
      }
      if (order.delivery_slot_id) {
        await sql.unsafe(
          `UPDATE delivery_slots
           SET reserved_count = GREATEST(0, reserved_count - 1)
           WHERE id = $1`,
          [order.delivery_slot_id],
        );
      }
      await sql.unsafe(
        `UPDATE payments SET status = 'cancelled' WHERE order_id = $1`,
        [orderId],
      );
    }
    if (nextStatusValue === "confirmed") {
      await sql.unsafe(
        `UPDATE payments SET status = 'confirmed' WHERE order_id = $1`,
        [orderId],
      );
    }

    await sql.unsafe(
      `UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3`,
      [nextStatusValue, timestamp, orderId],
    );
    await sql.unsafe(
      `INSERT INTO order_status_history
        (id, order_id, previous_status, new_status, changed_by_admin_id,
         created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        randomUUID(),
        orderId,
        order.status,
        nextStatusValue,
        adminRows[0]?.id ?? null,
        timestamp,
      ],
    );
  });
}
