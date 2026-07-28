import { getPostgresClient, withTransaction } from "@/db";

export type AdminSalesCalendar = {
  menu: {
    id: string;
    salesDate: string;
    orderingOpensAt: string;
    orderingClosesAt: string;
    totalCapacity: number | null;
    published: boolean;
    closedManually: boolean;
  };
  slots: Array<{
    id: string;
    startsAt: string;
    endsAt: string;
    capacity: number;
    reservedCount: number;
    active: boolean;
  }>;
};

export async function getAdminSalesCalendar(): Promise<AdminSalesCalendar> {
  const sql = getPostgresClient();
  const menuRows = await sql.unsafe<
    Array<{
      id: string;
      sales_date: string;
      ordering_opens_at: string;
      ordering_closes_at: string;
      total_capacity: number | null;
      published: boolean;
      closed_manually: boolean;
    }>
  >(
    `SELECT id, sales_date, ordering_opens_at, ordering_closes_at,
            total_capacity, published, closed_manually
     FROM sales_menus
     ORDER BY sales_date DESC
     LIMIT 1`,
  );
  const menu = menuRows[0];
  if (!menu) throw new Error("Cardápio de vendas não configurado.");
  const slots = await sql.unsafe<
    Array<{
      id: string;
      starts_at: string;
      ends_at: string;
      capacity: number;
      reserved_count: number;
      active: boolean;
    }>
  >(
    `SELECT id, starts_at, ends_at, capacity, reserved_count, active
     FROM delivery_slots
     WHERE sales_date = $1
     ORDER BY starts_at`,
    [menu.sales_date],
  );
  return {
    menu: {
      id: menu.id,
      salesDate: menu.sales_date,
      orderingOpensAt: menu.ordering_opens_at,
      orderingClosesAt: menu.ordering_closes_at,
      totalCapacity: menu.total_capacity,
      published: menu.published,
      closedManually: menu.closed_manually,
    },
    slots: slots.map((slot) => ({
      id: slot.id,
      startsAt: slot.starts_at,
      endsAt: slot.ends_at,
      capacity: slot.capacity,
      reservedCount: slot.reserved_count,
      active: slot.active,
    })),
  };
}

export async function saveSalesCalendar(input: {
  id: string;
  salesDate: string;
  orderingOpensAt: string;
  orderingClosesAt: string;
  totalCapacity: number | null;
  published: boolean;
  closedManually: boolean;
}) {
  if (new Date(input.orderingOpensAt) >= new Date(input.orderingClosesAt)) {
    throw new Error("A abertura precisa acontecer antes do encerramento.");
  }
  await withTransaction(async (sql) => {
    const currentRows = await sql.unsafe<Array<{ sales_date: string }>>(
      "SELECT sales_date FROM sales_menus WHERE id = $1 FOR UPDATE",
      [input.id],
    );
    if (!currentRows[0]) throw new Error("Cardápio de vendas não encontrado.");
    await sql.unsafe(
      `UPDATE sales_menus
       SET sales_date = $1, ordering_opens_at = $2, ordering_closes_at = $3,
           total_capacity = $4, published = $5, closed_manually = $6,
           updated_at = $7
       WHERE id = $8`,
      [
        input.salesDate,
        input.orderingOpensAt,
        input.orderingClosesAt,
        input.totalCapacity,
        input.published,
        input.closedManually,
        new Date().toISOString(),
        input.id,
      ],
    );
    if (currentRows[0].sales_date !== input.salesDate) {
      await sql.unsafe(
        "UPDATE delivery_slots SET sales_date = $1 WHERE sales_date = $2",
        [input.salesDate, currentRows[0].sales_date],
      );
    }
  });
}

export async function saveDeliverySlot(input: {
  id: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  active: boolean;
}) {
  if (input.startsAt >= input.endsAt) {
    throw new Error("O início da faixa precisa ser anterior ao fim.");
  }
  const sql = getPostgresClient();
  await sql.unsafe(
    `UPDATE delivery_slots
     SET starts_at = $1, ends_at = $2, capacity = $3, active = $4
     WHERE id = $5`,
    [
      input.startsAt,
      input.endsAt,
      input.capacity,
      input.active,
      input.id,
    ],
  );
}
