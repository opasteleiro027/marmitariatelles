import { randomUUID } from "node:crypto";
import { getPostgresClient, withTransaction } from "@/db";

export type CashPaymentMethod = { id: string; code: string; label: string };
export type CashMovement = {
  id: string;
  kind: "sale" | "cash_in" | "cash_out" | "refund" | "adjustment";
  amountInCents: number;
  methodLabel: string | null;
  description: string;
  orderNumber: number | null;
  createdAt: string;
};
export type CashRegisterSession = {
  id: string;
  openedAt: string;
  openedBy: string;
  openingFloatInCents: number;
  countedCashInCents: number | null;
  cashDifferenceInCents: number | null;
  status: "open" | "closed";
  closedAt: string | null;
  closedBy: string | null;
  notes: string | null;
  salesInCents: number;
  refundsInCents: number;
  cashInInCents: number;
  cashOutInCents: number;
  expectedCashInCents: number;
  byMethod: Array<{ code: string; label: string; salesInCents: number; refundsInCents: number }>;
  movements: CashMovement[];
};
export type CashRegisterSnapshot = {
  current: CashRegisterSession | null;
  history: CashRegisterSession[];
  paymentMethods: CashPaymentMethod[];
  pendingPayments: number;
};

export async function getCashRegisterSnapshot(): Promise<CashRegisterSnapshot> {
  const sql = getPostgresClient();
  const [currentRows, historyRows, methods, pendingRows] = await Promise.all([
    sql.unsafe<SessionRow[]>(`${SESSION_QUERY} WHERE s.status = 'open' GROUP BY s.id, opener.email, closer.email LIMIT 1`),
    sql.unsafe<SessionRow[]>(`${SESSION_QUERY} WHERE s.status = 'closed' GROUP BY s.id, opener.email, closer.email ORDER BY s.closed_at DESC LIMIT 20`),
    sql.unsafe<CashPaymentMethod[]>(
      `SELECT id, code, label FROM payment_methods WHERE active = TRUE AND code <> 'pay_on_pickup' ORDER BY display_order, label`,
    ),
    sql.unsafe<Array<{ count: number }>>(
      `SELECT COUNT(*)::INT AS count FROM payments py JOIN orders o ON o.id = py.order_id WHERE py.status = 'pending' AND o.status <> 'cancelled'`,
    ),
  ]);
  const current = currentRows[0] ? await enrichSession(sql, currentRows[0]) : null;
  const history = await Promise.all(historyRows.map((row) => enrichSession(sql, row)));
  return {
    current,
    history,
    paymentMethods: methods,
    pendingPayments: pendingRows[0]?.count ?? 0,
  };
}

type SessionRow = {
  id: string;
  status: "open" | "closed";
  opening_float_cents: number;
  counted_cash_cents: number | null;
  cash_difference_cents: number | null;
  notes: string | null;
  opened_at: string;
  closed_at: string | null;
  opened_by: string;
  closed_by: string | null;
  sales_cents: number;
  refunds_cents: number;
  cash_in_cents: number;
  cash_out_cents: number;
  cash_sales_cents: number;
  cash_refunds_cents: number;
};

const SESSION_QUERY = `
  SELECT s.id, s.status, s.opening_float_cents, s.counted_cash_cents,
         s.cash_difference_cents, s.notes, s.opened_at, s.closed_at,
         opener.email AS opened_by, closer.email AS closed_by,
         COALESCE(SUM(m.amount_cents) FILTER (WHERE m.kind = 'sale'), 0)::INT AS sales_cents,
         COALESCE(SUM(m.amount_cents) FILTER (WHERE m.kind = 'refund'), 0)::INT AS refunds_cents,
         COALESCE(SUM(m.amount_cents) FILTER (WHERE m.kind = 'cash_in'), 0)::INT AS cash_in_cents,
         COALESCE(SUM(m.amount_cents) FILTER (WHERE m.kind = 'cash_out'), 0)::INT AS cash_out_cents,
         COALESCE(SUM(m.amount_cents) FILTER (WHERE m.kind = 'sale' AND pm.code = 'cash'), 0)::INT AS cash_sales_cents,
         COALESCE(SUM(m.amount_cents) FILTER (WHERE m.kind = 'refund' AND pm.code = 'cash'), 0)::INT AS cash_refunds_cents
  FROM cash_register_sessions s
  JOIN admin_users opener ON opener.id = s.opened_by_admin_id
  LEFT JOIN admin_users closer ON closer.id = s.closed_by_admin_id
  LEFT JOIN cash_register_movements m ON m.session_id = s.id
  LEFT JOIN payment_methods pm ON pm.id = m.payment_method_id
`;

async function enrichSession(sql: ReturnType<typeof getPostgresClient>, row: SessionRow): Promise<CashRegisterSession> {
  const [methods, movements] = await Promise.all([
    sql.unsafe<Array<{ code: string; label: string; sales_cents: number; refunds_cents: number }>>(
      `SELECT pm.code, pm.label,
              COALESCE(SUM(m.amount_cents) FILTER (WHERE m.kind = 'sale'), 0)::INT AS sales_cents,
              COALESCE(SUM(m.amount_cents) FILTER (WHERE m.kind = 'refund'), 0)::INT AS refunds_cents
       FROM cash_register_movements m JOIN payment_methods pm ON pm.id = m.payment_method_id
       WHERE m.session_id = $1 AND m.kind IN ('sale', 'refund')
       GROUP BY pm.code, pm.label ORDER BY pm.label`,
      [row.id],
    ),
    sql.unsafe<Array<{
      id: string; kind: CashMovement["kind"]; amount_cents: number;
      method_label: string | null; description: string; friendly_number: number | null; created_at: string;
    }>>(
      `SELECT m.id, m.kind, m.amount_cents, pm.label AS method_label,
              m.description, o.friendly_number, m.created_at
       FROM cash_register_movements m
       LEFT JOIN payment_methods pm ON pm.id = m.payment_method_id
       LEFT JOIN orders o ON o.id = m.order_id
       WHERE m.session_id = $1 ORDER BY m.created_at DESC`,
      [row.id],
    ),
  ]);
  return {
    id: row.id,
    openedAt: row.opened_at,
    openedBy: row.opened_by,
    openingFloatInCents: row.opening_float_cents,
    countedCashInCents: row.counted_cash_cents,
    cashDifferenceInCents: row.cash_difference_cents,
    status: row.status,
    closedAt: row.closed_at,
    closedBy: row.closed_by,
    notes: row.notes,
    salesInCents: row.sales_cents,
    refundsInCents: row.refunds_cents,
    cashInInCents: row.cash_in_cents,
    cashOutInCents: row.cash_out_cents,
    expectedCashInCents: row.opening_float_cents + row.cash_sales_cents + row.cash_in_cents - row.cash_out_cents - row.cash_refunds_cents,
    byMethod: methods.map((method) => ({ code: method.code, label: method.label, salesInCents: method.sales_cents, refundsInCents: method.refunds_cents })),
    movements: movements.map((movement) => ({
      id: movement.id,
      kind: movement.kind,
      amountInCents: movement.amount_cents,
      methodLabel: movement.method_label,
      description: movement.description,
      orderNumber: movement.friendly_number,
      createdAt: movement.created_at,
    })),
  };
}

export async function openCashRegister(openingFloatInCents: number, adminEmail: string, notes: string | null = null) {
  assertAmount(openingFloatInCents);
  await withTransaction(async (sql) => {
    const admin = await findAdmin(sql, adminEmail);
    const timestamp = new Date().toISOString();
    await sql.unsafe(
      `INSERT INTO cash_register_sessions (id, status, opening_float_cents, notes, opened_by_admin_id, opened_at)
       VALUES ($1, 'open', $2, $3, $4, $5)`,
      [randomUUID(), openingFloatInCents, cleanNote(notes), admin.id, timestamp],
    );
  });
}

export async function recordCashMovement(input: {
  kind: "cash_in" | "cash_out";
  amountInCents: number;
  description: string;
  adminEmail: string;
}) {
  assertAmount(input.amountInCents, false);
  const description = input.description.trim();
  if (!description || description.length > 160) throw new Error("Informe o motivo da movimentação (até 160 caracteres).");
  await withTransaction(async (sql) => {
    const session = await getOpenSessionForUpdate(sql);
    const admin = await findAdmin(sql, input.adminEmail);
    await sql.unsafe(
      `INSERT INTO cash_register_movements
        (id, session_id, kind, amount_cents, description, created_by_admin_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [randomUUID(), session.id, input.kind, input.amountInCents, description, admin.id, new Date().toISOString()],
    );
  });
}

export async function closeCashRegister(countedCashInCents: number, adminEmail: string, notes: string | null = null) {
  assertAmount(countedCashInCents);
  await withTransaction(async (sql) => {
    const session = await getOpenSessionForUpdate(sql);
    const admin = await findAdmin(sql, adminEmail);
    const rows = await sql.unsafe<Array<{ expected_cents: number }>>(
      `SELECT ($1::INT
        + COALESCE(SUM(m.amount_cents) FILTER (WHERE m.kind = 'sale' AND pm.code = 'cash'), 0)
        + COALESCE(SUM(m.amount_cents) FILTER (WHERE m.kind = 'cash_in'), 0)
        - COALESCE(SUM(m.amount_cents) FILTER (WHERE m.kind = 'cash_out'), 0)
        - COALESCE(SUM(m.amount_cents) FILTER (WHERE m.kind = 'refund' AND pm.code = 'cash'), 0))::INT AS expected_cents
       FROM cash_register_movements m LEFT JOIN payment_methods pm ON pm.id = m.payment_method_id
       WHERE m.session_id = $2`,
      [session.opening_float_cents, session.id],
    );
    const difference = countedCashInCents - (rows[0]?.expected_cents ?? session.opening_float_cents);
    await sql.unsafe(
      `UPDATE cash_register_sessions
       SET status = 'closed', counted_cash_cents = $1, cash_difference_cents = $2,
           notes = COALESCE($3, notes), closed_by_admin_id = $4, closed_at = $5
       WHERE id = $6 AND status = 'open'`,
      [countedCashInCents, difference, cleanNote(notes), admin.id, new Date().toISOString(), session.id],
    );
  });
}

export async function confirmOrderPayment(orderId: string, adminEmail: string, paymentMethodId: string) {
  if (!orderId || !paymentMethodId) throw new Error("Selecione o pedido e a forma de pagamento.");
  await withTransaction(async (sql) => {
    const rows = await sql.unsafe<Array<{
      order_id: string; order_status: string; payment_id: string; payment_status: string;
      amount_cents: number; friendly_number: number;
    }>>(
      `SELECT o.id AS order_id, o.status AS order_status, o.friendly_number,
              py.id AS payment_id, py.status AS payment_status, py.amount_cents
       FROM orders o JOIN payments py ON py.order_id = o.id
       WHERE o.id = $1 FOR UPDATE OF o, py`, [orderId],
    );
    const payment = rows[0];
    if (!payment || payment.order_status === "cancelled") throw new Error("Pedido não encontrado ou cancelado.");
    if (payment.payment_status !== "pending") throw new Error("Este pedido já teve o pagamento processado.");
    await registerConfirmedPayment(sql, {
      paymentId: payment.payment_id,
      orderId: payment.order_id,
      orderNumber: payment.friendly_number,
      amountCents: payment.amount_cents,
      paymentMethodId,
      adminEmail,
    });
  });
}

export async function registerConfirmedPayment(
  sql: Parameters<Parameters<typeof withTransaction>[0]>[0],
  input: { paymentId: string; orderId: string; orderNumber: number; amountCents: number; paymentMethodId: string; adminEmail: string },
) {
  const session = await getOpenSessionForUpdate(sql);
  const admin = await findAdmin(sql, input.adminEmail);
  const methodRows = await sql.unsafe<Array<{ id: string }>>(
    `SELECT id FROM payment_methods WHERE id = $1 AND active = TRUE`, [input.paymentMethodId],
  );
  if (!methodRows[0]) throw new Error("A forma de pagamento selecionada não está disponível.");
  await sql.unsafe(
    `UPDATE payments SET status = 'confirmed', payment_method_id = $1 WHERE id = $2`,
    [input.paymentMethodId, input.paymentId],
  );
  await sql.unsafe(
    `INSERT INTO cash_register_movements
      (id, session_id, kind, amount_cents, payment_method_id, order_id, payment_id,
       description, created_by_admin_id, created_at)
     VALUES ($1, $2, 'sale', $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT DO NOTHING`,
    [randomUUID(), session.id, input.amountCents, input.paymentMethodId, input.orderId,
      input.paymentId, `Pedido #${input.orderNumber}`, admin.id, new Date().toISOString()],
  );
}

export async function registerRefundForPaidOrder(
  sql: Parameters<Parameters<typeof withTransaction>[0]>[0],
  input: { orderId: string; orderNumber: number; paymentId: string; paymentMethodId: string; amountCents: number; adminEmail: string },
) {
  const existingSale = await sql.unsafe<Array<{ id: string }>>(
    `SELECT id FROM cash_register_movements WHERE payment_id = $1 AND kind = 'sale' LIMIT 1`,
    [input.paymentId],
  );
  if (!existingSale[0]) return;
  const session = await getOpenSessionForUpdate(sql);
  const admin = await findAdmin(sql, input.adminEmail);
  await sql.unsafe(
    `INSERT INTO cash_register_movements
      (id, session_id, kind, amount_cents, payment_method_id, order_id, payment_id,
       description, created_by_admin_id, created_at)
     VALUES ($1, $2, 'refund', $3, $4, $5, $6, $7, $8, $9)`,
    [randomUUID(), session.id, input.amountCents, input.paymentMethodId, input.orderId,
      input.paymentId, `Estorno do pedido #${input.orderNumber}`, admin.id, new Date().toISOString()],
  );
}

async function getOpenSessionForUpdate(sql: Parameters<Parameters<typeof withTransaction>[0]>[0]) {
  const rows = await sql.unsafe<Array<{ id: string; opening_float_cents: number }>>(
    `SELECT id, opening_float_cents FROM cash_register_sessions WHERE status = 'open' FOR UPDATE`,
  );
  if (!rows[0]) throw new Error("Abra o caixa antes de registrar pagamentos ou movimentações.");
  return rows[0];
}

async function findAdmin(sql: Parameters<Parameters<typeof withTransaction>[0]>[0], email: string) {
  const rows = await sql.unsafe<Array<{ id: string }>>(
    `SELECT id FROM admin_users WHERE LOWER(email) = LOWER($1) AND active = TRUE LIMIT 1`, [email],
  );
  if (!rows[0]) throw new Error("Administrador ativo não encontrado.");
  return rows[0];
}

function assertAmount(value: number, allowZero = true) {
  if (!Number.isInteger(value) || value < (allowZero ? 0 : 1) || value > 100_000_000) {
    throw new Error("Informe um valor válido para o caixa.");
  }
}

function cleanNote(value: string | null) {
  const note = value?.trim() ?? "";
  if (note.length > 500) throw new Error("A observação deve ter no máximo 500 caracteres.");
  return note || null;
}
