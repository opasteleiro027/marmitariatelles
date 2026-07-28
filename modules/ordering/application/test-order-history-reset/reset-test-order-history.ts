import { withTransaction } from "@/db";

export const TEST_ORDER_RESET_CONFIRMATION = "ZERAR PEDIDOS TESTE";

export type TestOrderHistoryResetResult = {
  ordersDeleted: number;
  customersDeleted: number;
  addressesDeleted: number;
};

export function assertTestOrderResetConfirmation(value: string) {
  if (value.trim() !== TEST_ORDER_RESET_CONFIRMATION) {
    throw new Error("Digite a confirmação exatamente como solicitado.");
  }
}

export async function resetTestOrderHistory(
  confirmation: string,
): Promise<TestOrderHistoryResetResult> {
  assertTestOrderResetConfirmation(confirmation);

  return withTransaction(async (sql) => {
    await sql.unsafe("LOCK TABLE orders IN ACCESS EXCLUSIVE MODE");

    const timestamp = new Date().toISOString();
    await sql.unsafe(
      `WITH quantities_to_restore AS (
         SELECT oi.product_id, SUM(oi.quantity)::INT AS quantity
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE oi.product_id IS NOT NULL
           AND o.status <> 'cancelled'
         GROUP BY oi.product_id
       )
       UPDATE products p
       SET stock_quantity = p.stock_quantity + r.quantity,
           updated_at = $1
       FROM quantities_to_restore r
       WHERE p.id = r.product_id
         AND p.stock_quantity IS NOT NULL`,
      [timestamp],
    );

    await sql.unsafe("DELETE FROM internal_order_notes");
    await sql.unsafe("DELETE FROM order_status_history");
    await sql.unsafe("DELETE FROM payments");
    await sql.unsafe("DELETE FROM order_item_addons");
    await sql.unsafe("DELETE FROM order_items");
    await sql.unsafe("DELETE FROM order_idempotency_keys");

    const deletedOrders = await sql.unsafe<Array<{ id: string }>>(
      "DELETE FROM orders RETURNING id",
    );
    const deletedAddresses = await sql.unsafe<Array<{ id: string }>>(
      "DELETE FROM customer_addresses RETURNING id",
    );
    const deletedCustomers = await sql.unsafe<Array<{ id: string }>>(
      "DELETE FROM customers RETURNING id",
    );

    return {
      ordersDeleted: deletedOrders.length,
      customersDeleted: deletedCustomers.length,
      addressesDeleted: deletedAddresses.length,
    };
  });
}
