"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/modules/storefront/domain/format-money";
import type {
  AdminOrder,
  AdminOrderSnapshot,
} from "../../application/admin-orders";
import {
  getOrderStatusLabel,
  type OrderStatus,
} from "../../application/order-status";
import {
  addTableConsumptionInlineAction,
  closeTableTabInlineAction,
  updateOrderStatusInlineAction,
} from "../../server/admin-order-actions";
import {
  OrderPrintButton,
  printPreparedOrderWindow,
  type OrderPrintButtonHandle,
} from "../order-print-button/OrderPrintButton";
import styles from "./table-tabs.module.css";

const PRINT_ON_ACCEPT_STORAGE_KEY = "pote-mix:print-on-accept";

const COLUMNS: Array<{
  id: string;
  title: string;
  description: string;
  statuses: OrderStatus[];
  tone: "new" | "preparing" | "payment" | "closed";
}> = [
  {
    id: "new",
    title: "Novas comandas",
    description: "Aguardando aceite",
    statuses: ["received", "awaiting_confirmation"],
    tone: "new",
  },
  {
    id: "preparing",
    title: "Em preparo",
    description: "Pedidos aceitos pela cozinha",
    statuses: ["confirmed", "preparing"],
    tone: "preparing",
  },
  {
    id: "payment",
    title: "Aguardando pagamento",
    description: "Pedido servido e comanda aberta",
    statuses: ["ready_for_pickup"],
    tone: "payment",
  },
  {
    id: "closed",
    title: "Fechadas",
    description: "Pagas ou canceladas",
    statuses: ["delivered", "cancelled"],
    tone: "closed",
  },
];

type Feedback = { type: "success" | "error"; message: string };

export function TableTabs({ snapshot }: { snapshot: AdminOrderSnapshot }) {
  const router = useRouter();
  const [printOnAccept, setPrintOnAccept] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPrintOnAccept(
        window.localStorage.getItem(PRINT_ON_ACCEPT_STORAGE_KEY) === "true",
      );
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const columns = useMemo(
    () =>
      COLUMNS.map((column) => ({
        ...column,
        orders: snapshot.orders
          .filter((order) => column.statuses.includes(order.status))
          .sort((left, right) =>
            column.tone === "closed"
              ? new Date(right.createdAt).getTime() -
                new Date(left.createdAt).getTime()
              : new Date(left.createdAt).getTime() -
                new Date(right.createdAt).getTime(),
          ),
      })),
    [snapshot.orders],
  );

  function showResult(result: Feedback) {
    setPendingOrderId(null);
    setFeedback(result);
    if (result.type === "success") router.refresh();
  }

  async function changeStatus(
    order: AdminOrder,
    nextStatus: OrderStatus,
    printControl: OrderPrintButtonHandle | null,
  ) {
    const shouldPrint = nextStatus === "confirmed" && printOnAccept;
    const preparedPrintWindow = shouldPrint
      ? printControl?.preparePrint() ?? null
      : null;
    setPendingOrderId(order.id);
    setFeedback(null);
    const result = await updateOrderStatusInlineAction(order.id, nextStatus);
    if (!result.ok) {
      preparedPrintWindow?.close();
      showResult({ type: "error", message: result.message });
      return;
    }
    if (shouldPrint && preparedPrintWindow) {
      printPreparedOrderWindow(preparedPrintWindow);
    }
    showResult({
      type: "success",
      message:
        shouldPrint && preparedPrintWindow
          ? "Pedido aceito e comanda enviada para impressão."
          : result.message,
    });
  }

  async function addConsumption(
    event: FormEvent<HTMLFormElement>,
    orderId: string,
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const unitPriceInCents = parseMoneyToCents(
      String(data.get("unitPrice") ?? ""),
    );
    if (unitPriceInCents === null) {
      setFeedback({ type: "error", message: "Informe um valor válido." });
      return;
    }
    setPendingOrderId(orderId);
    setFeedback(null);
    const result = await addTableConsumptionInlineAction({
      orderId,
      name: String(data.get("name") ?? ""),
      quantity: Number(data.get("quantity") ?? 1),
      unitPriceInCents,
      notes: String(data.get("notes") ?? "") || null,
    });
    if (result.ok) form.reset();
    showResult({
      type: result.ok ? "success" : "error",
      message: result.message,
    });
  }

  async function closeTab(orderId: string, paymentMethodId: string) {
    setPendingOrderId(orderId);
    setFeedback(null);
    const result = await closeTableTabInlineAction(orderId, paymentMethodId);
    showResult({
      type: result.ok ? "success" : "error",
      message: result.message,
    });
  }

  function changePrintPreference(enabled: boolean) {
    setPrintOnAccept(enabled);
    window.localStorage.setItem(PRINT_ON_ACCEPT_STORAGE_KEY, String(enabled));
    setFeedback({
      type: "success",
      message: enabled
        ? "Impressão automática ao aceitar ativada neste computador."
        : "Impressão automática ao aceitar desativada neste computador.",
    });
  }

  return (
    <section className={styles.panel}>
      {feedback ? (
        <div
          className={`${styles.feedback} ${styles[feedback.type]}`}
          role={feedback.type === "error" ? "alert" : "status"}
        >
          <span aria-hidden="true">
            {feedback.type === "success" ? "✓" : "!"}
          </span>
          <p>{feedback.message}</p>
          <button onClick={() => setFeedback(null)} type="button">×</button>
        </div>
      ) : null}

      <div className={styles.heading}>
        <div>
          <p>Consumo no local</p>
          <h2>Comandas em atendimento</h2>
          <span>
            O pedido servido continua aberto até a confirmação do pagamento.
          </span>
        </div>
        <label className={styles.printSetting}>
          <input
            checked={printOnAccept}
            onChange={(event) => changePrintPreference(event.target.checked)}
            type="checkbox"
          />
          <span aria-hidden="true" />
          <span>
            <strong>Imprimir ao aceitar</strong>
            <small>Preferência deste computador.</small>
          </span>
        </label>
      </div>

      {!snapshot.orders.length ? (
        <div className={styles.empty}>
          <span aria-hidden="true">▦</span>
          <strong>Nenhuma comanda de mesa</strong>
          <p>Os pedidos feitos na loja aparecerão aqui automaticamente.</p>
        </div>
      ) : (
        <div className={styles.board}>
          {columns.map((column) => (
            <section
              className={`${styles.column} ${styles[column.tone]}`}
              key={column.id}
            >
              <header className={styles.columnHeader}>
                <div>
                  <h3>{column.title}</h3>
                  <span>{column.orders.length}</span>
                </div>
                <p>{column.description}</p>
                <strong>
                  {formatMoney(
                    column.orders.reduce(
                      (total, order) =>
                        order.status === "cancelled"
                          ? total
                          : total + order.totalInCents,
                      0,
                    ),
                  )}
                </strong>
              </header>
              <div className={styles.cards}>
                {column.orders.length ? (
                  column.orders.map((order) => (
                    <TableTabCard
                      key={order.id}
                      order={order}
                      paymentMethods={snapshot.paymentMethods}
                      pending={pendingOrderId === order.id}
                      onAddConsumption={addConsumption}
                      onCloseTab={closeTab}
                      onStatusChange={changeStatus}
                    />
                  ))
                ) : (
                  <div className={styles.emptyColumn}>Nenhuma comanda</div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function TableTabCard({
  order,
  paymentMethods,
  pending,
  onStatusChange,
  onAddConsumption,
  onCloseTab,
}: {
  order: AdminOrder;
  paymentMethods: AdminOrderSnapshot["paymentMethods"];
  pending: boolean;
  onStatusChange: (
    order: AdminOrder,
    status: OrderStatus,
    printControl: OrderPrintButtonHandle | null,
  ) => Promise<void>;
  onAddConsumption: (
    event: FormEvent<HTMLFormElement>,
    orderId: string,
  ) => Promise<void>;
  onCloseTab: (orderId: string, paymentMethodId: string) => Promise<void>;
}) {
  const printControl = useRef<OrderPrintButtonHandle>(null);
  const [paymentMethodId, setPaymentMethodId] = useState(
    paymentMethods.some((method) => method.id === order.paymentMethodId)
      ? order.paymentMethodId
      : paymentMethods[0]?.id ?? "",
  );
  const primaryStatus = getPrimaryTableStatus(order.status);
  const canCancel = !["delivered", "cancelled"].includes(order.status);
  const canAddConsumption =
    order.paymentStatus === "pending" &&
    !["received", "awaiting_confirmation", "delivered", "cancelled"].includes(
      order.status,
    );
  const waitingForPayment =
    order.status === "ready_for_pickup" && order.paymentStatus === "pending";

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <div>
          <small>Comanda</small>
          <strong>#{order.orderNumber}</strong>
        </div>
        <div>
          <time dateTime={order.createdAt}>{formatOrderTime(order.createdAt)}</time>
          <span>{getTableStatusLabel(order)}</span>
        </div>
      </header>

      <div className={styles.customer}>
        <strong>{order.customerName}</strong>
        <a href={`tel:+55${order.customerPhone}`}>{order.customerPhone}</a>
      </div>

      <div className={styles.total}>
        <small>
          {order.paymentStatus === "confirmed"
            ? "Pagamento confirmado"
            : order.paymentStatus === "cancelled"
              ? "Pagamento cancelado"
              : `Pagamento pendente · ${order.paymentLabel}`}
        </small>
        <strong>{formatMoney(order.totalInCents)}</strong>
      </div>

      <details className={styles.items} open={waitingForPayment}>
        <summary>Itens consumidos</summary>
        <div>
          {order.items.map((item) => (
            <section key={item.id}>
              <header>
                <strong>{item.quantity}× {item.name}</strong>
                <b>{formatMoney(item.lineTotalInCents)}</b>
              </header>
              {item.addons.map((addon, index) => (
                <p key={`${addon.name}-${index}`}>
                  • {addon.quantity > 1 ? `${addon.quantity}× ` : ""}
                  {addon.name}
                </p>
              ))}
              {item.notes ? <p>Obs.: {item.notes}</p> : null}
            </section>
          ))}
          <section>
            <header><strong>Bebidas solicitadas</strong></header>
            <p>{order.beverages ?? "Sem bebida"}</p>
          </section>
        </div>
      </details>

      {canAddConsumption ? (
        <details className={styles.addConsumption}>
          <summary>+ Adicionar consumo</summary>
          <form onSubmit={(event) => void onAddConsumption(event, order.id)}>
            <label>
              Item
              <input
                maxLength={120}
                name="name"
                placeholder="Ex.: Refrigerante lata"
                required
              />
            </label>
            <div>
              <label>
                Quantidade
                <input defaultValue="1" max="99" min="1" name="quantity" type="number" required />
              </label>
              <label>
                Valor unitário
                <input inputMode="decimal" name="unitPrice" placeholder="6,00" required />
              </label>
            </div>
            <label>
              Observação <small>(opcional)</small>
              <input maxLength={150} name="notes" placeholder="Ex.: sem gelo" />
            </label>
            <button disabled={pending} type="submit">
              {pending ? "Adicionando..." : "Adicionar à comanda"}
            </button>
          </form>
        </details>
      ) : null}

      <div className={styles.actions}>
        {primaryStatus ? (
          <button
            className={styles.primaryAction}
            disabled={pending}
            onClick={() =>
              void onStatusChange(order, primaryStatus, printControl.current)
            }
            type="button"
          >
            {pending ? "Atualizando..." : getPrimaryActionLabel(primaryStatus)}
          </button>
        ) : null}
        {waitingForPayment ? (
          <div className={styles.paymentForm}>
            <label>Forma recebida
              <select value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)}>
                {paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.label}</option>)}
              </select>
            </label>
            <button
              className={styles.closeAction}
              disabled={pending || !paymentMethods.length}
              onClick={() => void onCloseTab(order.id, paymentMethodId)}
              type="button"
            >
              {pending ? "Fechando..." : "Confirmar pagamento e fechar"}
            </button>
          </div>
        ) : null}
        {canCancel ? (
          <button
            className={styles.cancelAction}
            disabled={pending}
            onClick={() =>
              void onStatusChange(order, "cancelled", printControl.current)
            }
            type="button"
          >
            {order.status === "received" || order.status === "awaiting_confirmation"
              ? "Recusar"
              : "Cancelar comanda"}
          </button>
        ) : null}
        <OrderPrintButton order={order} ref={printControl} />
      </div>
    </article>
  );
}

function getPrimaryTableStatus(status: OrderStatus): OrderStatus | null {
  if (status === "received" || status === "awaiting_confirmation") {
    return "confirmed";
  }
  if (status === "confirmed") return "preparing";
  if (status === "preparing") return "ready_for_pickup";
  return null;
}

function getPrimaryActionLabel(status: OrderStatus) {
  if (status === "confirmed") return "Aceitar pedido";
  if (status === "preparing") return "Iniciar preparo";
  if (status === "ready_for_pickup") return "Marcar como servido";
  return "Atualizar comanda";
}

function getTableStatusLabel(order: AdminOrder) {
  if (order.status === "ready_for_pickup" && order.paymentStatus === "pending") {
    return "Aguardando pagamento";
  }
  if (order.status === "delivered" && order.paymentStatus === "confirmed") {
    return "Paga e fechada";
  }
  return getOrderStatusLabel(order.status, order.fulfillment);
}

function parseMoneyToCents(value: string) {
  const normalized = value
    .trim()
    .replace(/[R$\s]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  if (!normalized) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

function formatOrderTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
