import { getPostgresClient } from "@/db";
import {
  getOrderReportDateRange,
  type OrderReportPeriod,
} from "../domain/order-report-period";

export type AdminOrderReport = {
  period: OrderReportPeriod;
  periodLabel: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  totals: {
    orders: number;
    revenueInCents: number;
    averageOrderTicketInCents: number;
    uniqueCustomers: number;
    averageRevenuePerCustomerInCents: number;
    returningCustomers: number;
    repeatRatePercentage: number;
    items: number;
    deliveries: number;
    pickups: number;
    cancelled: number;
  };
  topCustomers: Array<{
    customerId: string;
    name: string;
    phone: string;
    orders: number;
    totalInCents: number;
    averageTicketInCents: number;
    lastOrderAt: string;
  }>;
  neighborhoods: Array<{
    neighborhood: string;
    city: string;
    orders: number;
    customers: number;
    revenueInCents: number;
    averageTicketInCents: number;
  }>;
  topItems: Array<{
    name: string;
    quantity: number;
    orders: number;
    revenueInCents: number;
  }>;
  paymentMethods: Array<{
    label: string;
    orders: number;
    revenueInCents: number;
    percentage: number;
  }>;
};

type TotalsRow = {
  orders: number;
  revenue_cents: number;
  unique_customers: number;
  returning_customers: number;
  items: number;
  deliveries: number;
  pickups: number;
  cancelled: number;
};

const PERIOD_PREDICATE = `
  (o.created_at::timestamptz AT TIME ZONE 'America/Sao_Paulo') >= $1::date
  AND (o.created_at::timestamptz AT TIME ZONE 'America/Sao_Paulo') < $2::date
`;

export async function getAdminOrderReport(
  period: OrderReportPeriod,
): Promise<AdminOrderReport> {
  const sql = getPostgresClient();
  const range = getOrderReportDateRange(period);
  const parameters = [range.startDate, range.endDate];

  const [totalRows, customerRows, neighborhoodRows, itemRows, paymentRows] =
    await Promise.all([
      sql.unsafe<TotalsRow[]>(
        `WITH period_orders AS (
           SELECT o.id, o.customer_id, o.fulfillment_type, o.status,
                  o.total_cents
           FROM orders o
           WHERE ${PERIOD_PREDICATE}
         ),
         valid_orders AS (
           SELECT * FROM period_orders WHERE status <> 'cancelled'
         ),
         customer_counts AS (
           SELECT customer_id, COUNT(*)::INT AS orders
           FROM valid_orders
           GROUP BY customer_id
         )
         SELECT
           (SELECT COUNT(*)::INT FROM valid_orders) AS orders,
           (SELECT COALESCE(SUM(total_cents), 0)::INT FROM valid_orders)
             AS revenue_cents,
           (SELECT COUNT(DISTINCT customer_id)::INT FROM valid_orders)
             AS unique_customers,
           (SELECT COUNT(*)::INT FROM customer_counts WHERE orders > 1)
             AS returning_customers,
           (
             SELECT COALESCE(SUM(oi.quantity), 0)::INT
             FROM order_items oi
             JOIN valid_orders vo ON vo.id = oi.order_id
           ) AS items,
           (
             SELECT COUNT(*)::INT FROM valid_orders
             WHERE fulfillment_type = 'delivery'
           ) AS deliveries,
           (
             SELECT COUNT(*)::INT FROM valid_orders
             WHERE fulfillment_type = 'pickup'
           ) AS pickups,
           (
             SELECT COUNT(*)::INT FROM period_orders
             WHERE status = 'cancelled'
           ) AS cancelled`,
        parameters,
      ),
      sql.unsafe<
        Array<{
          customer_id: string;
          customer_name: string;
          customer_phone: string;
          orders: number;
          total_cents: number;
          last_order_at: string;
        }>
      >(
        `SELECT
           o.customer_id,
           (ARRAY_AGG(
             o.customer_name_snapshot
             ORDER BY o.created_at DESC
           ))[1] AS customer_name,
           (ARRAY_AGG(
             o.customer_phone_snapshot
             ORDER BY o.created_at DESC
           ))[1] AS customer_phone,
           COUNT(*)::INT AS orders,
           COALESCE(SUM(o.total_cents), 0)::INT AS total_cents,
           MAX(o.created_at) AS last_order_at
         FROM orders o
         WHERE ${PERIOD_PREDICATE}
           AND o.status <> 'cancelled'
         GROUP BY o.customer_id
         ORDER BY orders DESC, total_cents DESC, last_order_at DESC
         LIMIT 10`,
        parameters,
      ),
      sql.unsafe<
        Array<{
          neighborhood: string;
          city: string;
          orders: number;
          customers: number;
          revenue_cents: number;
        }>
      >(
        `SELECT
           COALESCE(ca.neighborhood, da.neighborhood, 'Não informado')
             AS neighborhood,
           COALESCE(ca.city, da.city, 'Não informada') AS city,
           COUNT(*)::INT AS orders,
           COUNT(DISTINCT o.customer_id)::INT AS customers,
           COALESCE(SUM(o.total_cents), 0)::INT AS revenue_cents
         FROM orders o
         LEFT JOIN customer_addresses ca ON ca.id = o.address_id
         LEFT JOIN delivery_areas da ON da.id = o.delivery_area_id
         WHERE ${PERIOD_PREDICATE}
           AND o.status <> 'cancelled'
           AND o.fulfillment_type = 'delivery'
         GROUP BY
           COALESCE(ca.neighborhood, da.neighborhood, 'Não informado'),
           COALESCE(ca.city, da.city, 'Não informada')
         ORDER BY orders DESC, revenue_cents DESC
         LIMIT 10`,
        parameters,
      ),
      sql.unsafe<
        Array<{
          name: string;
          quantity: number;
          orders: number;
          revenue_cents: number;
        }>
      >(
        `SELECT
           oi.product_name_snapshot AS name,
           COALESCE(SUM(oi.quantity), 0)::INT AS quantity,
           COUNT(DISTINCT o.id)::INT AS orders,
           COALESCE(SUM(oi.line_total_cents), 0)::INT AS revenue_cents
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         WHERE ${PERIOD_PREDICATE}
           AND o.status <> 'cancelled'
         GROUP BY oi.product_name_snapshot
         ORDER BY quantity DESC, revenue_cents DESC
         LIMIT 10`,
        parameters,
      ),
      sql.unsafe<
        Array<{
          label: string;
          orders: number;
          revenue_cents: number;
        }>
      >(
        `SELECT
           pm.label,
           COUNT(DISTINCT o.id)::INT AS orders,
           COALESCE(SUM(py.amount_cents), 0)::INT AS revenue_cents
         FROM orders o
         JOIN payments py ON py.order_id = o.id
         JOIN payment_methods pm ON pm.id = py.payment_method_id
         WHERE ${PERIOD_PREDICATE}
           AND o.status <> 'cancelled'
           AND py.status <> 'cancelled'
         GROUP BY pm.id, pm.label
         ORDER BY orders DESC, revenue_cents DESC`,
        parameters,
      ),
    ]);

  const totals = totalRows[0] ?? emptyTotals();

  return {
    period,
    periodLabel: range.label,
    startDate: range.startDate,
    endDate: range.endDate,
    generatedAt: new Date().toISOString(),
    totals: {
      orders: totals.orders,
      revenueInCents: totals.revenue_cents,
      averageOrderTicketInCents: average(
        totals.revenue_cents,
        totals.orders,
      ),
      uniqueCustomers: totals.unique_customers,
      averageRevenuePerCustomerInCents: average(
        totals.revenue_cents,
        totals.unique_customers,
      ),
      returningCustomers: totals.returning_customers,
      repeatRatePercentage: percentage(
        totals.returning_customers,
        totals.unique_customers,
      ),
      items: totals.items,
      deliveries: totals.deliveries,
      pickups: totals.pickups,
      cancelled: totals.cancelled,
    },
    topCustomers: customerRows.map((customer) => ({
      customerId: customer.customer_id,
      name: customer.customer_name,
      phone: customer.customer_phone,
      orders: customer.orders,
      totalInCents: customer.total_cents,
      averageTicketInCents: average(
        customer.total_cents,
        customer.orders,
      ),
      lastOrderAt: customer.last_order_at,
    })),
    neighborhoods: neighborhoodRows.map((neighborhood) => ({
      neighborhood: neighborhood.neighborhood,
      city: neighborhood.city,
      orders: neighborhood.orders,
      customers: neighborhood.customers,
      revenueInCents: neighborhood.revenue_cents,
      averageTicketInCents: average(
        neighborhood.revenue_cents,
        neighborhood.orders,
      ),
    })),
    topItems: itemRows.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      orders: item.orders,
      revenueInCents: item.revenue_cents,
    })),
    paymentMethods: paymentRows.map((method) => ({
      label: method.label,
      orders: method.orders,
      revenueInCents: method.revenue_cents,
      percentage: percentage(method.orders, totals.orders),
    })),
  };
}

function average(total: number, count: number) {
  return count > 0 ? Math.round(total / count) : 0;
}

function percentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function emptyTotals(): TotalsRow {
  return {
    orders: 0,
    revenue_cents: 0,
    unique_customers: 0,
    returning_customers: 0,
    items: 0,
    deliveries: 0,
    pickups: 0,
    cancelled: 0,
  };
}
