"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/modules/storefront/domain/format-money";
import type {
  AdminOrder,
  AdminOrderSnapshot,
} from "../../application/admin-orders";
import {
  getOrderStatusLabel,
  getOrderStatusTransitions,
  type OrderStatus,
} from "../../application/order-status";
import { FULFILLMENT_LABELS } from "../../domain/fulfillment";
import { updateOrderStatusInlineAction } from "../../server/admin-order-actions";
import {
  OrderPrintButton,
  printPreparedOrderWindow,
  type OrderPrintButtonHandle,
} from "../order-print-button/OrderPrintButton";
import styles from "./admin-order-list.module.css";

const PRINT_ON_ACCEPT_STORAGE_KEY = "pote-mix:print-on-accept";

const ORDER_BOARD_COLUMNS: Array<{
  id: string;
  title: string;
  description: string;
  tone: "new" | "preparing" | "ready" | "delivery" | "finished";
  statuses: OrderStatus[];
}> = [
  {
    id: "new",
    title: "Novos pedidos",
    description: "Aguardando aceite",
    tone: "new",
    statuses: ["received", "awaiting_confirmation"],
  },
  {
    id: "preparing",
    title: "Em preparo",
    description: "Confirmados na cozinha",
    tone: "preparing",
    statuses: ["confirmed", "preparing"],
  },
  {
    id: "ready",
    title: "Prontos",
    description: "Aguardando retirada",
    tone: "ready",
    statuses: ["ready_for_pickup"],
  },
  {
    id: "delivery",
    title: "Em entrega",
    description: "A caminho do cliente",
    tone: "delivery",
    statuses: ["out_for_delivery"],
  },
  {
    id: "finished",
    title: "Finalizados",
    description: "Concluídos e cancelados",
    tone: "finished",
    statuses: ["delivered", "cancelled"],
  },
];

type Feedback = {
  type: "success" | "error";
  message: string;
};

export function AdminOrderList({
  snapshot,
}: {
  snapshot: AdminOrderSnapshot;
}) {
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

  const groupedOrders = useMemo(
    () =>
      ORDER_BOARD_COLUMNS.map((column) => {
        const orders = snapshot.orders
          .filter((order) => column.statuses.includes(order.status))
          .sort((left, right) => {
            const difference =
              new Date(left.createdAt).getTime() -
              new Date(right.createdAt).getTime();
            return column.tone === "finished" ? -difference : difference;
          });
        return { ...column, orders };
      }),
    [snapshot.orders],
  );

  function changePrintPreference(enabled: boolean) {
    setPrintOnAccept(enabled);
    window.localStorage.setItem(
      PRINT_ON_ACCEPT_STORAGE_KEY,
      String(enabled),
    );
    setFeedback({
      type: "success",
      message: enabled
        ? "Impressão automática ao aceitar ativada neste computador."
        : "Impressão automática ao aceitar desativada neste computador.",
    });
  }

  async function changeOrderStatus(
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
      setPendingOrderId(null);
      setFeedback({ type: "error", message: result.message });
      return;
    }

    let message = result.message;
    if (shouldPrint && preparedPrintWindow) {
      printPreparedOrderWindow(preparedPrintWindow);
      message = "Pedido aceito e comanda enviada para impressão.";
    } else if (shouldPrint) {
      message =
        "Pedido aceito, mas a janela de impressão foi bloqueada. Permita pop-ups e use “Imprimir comanda”.";
    }

    setPendingOrderId(null);
    setFeedback({ type: "success", message });
    router.refresh();
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
          <button
            aria-label="Fechar aviso"
            onClick={() => setFeedback(null)}
            type="button"
          >
            ×
          </button>
        </div>
      ) : null}

      <div className={styles.heading}>
        <div>
          <p>Operação em tempo real</p>
          <h2>Gestor de pedidos</h2>
          <span>
            Os pedidos mudam de coluna conforme cada etapa do atendimento.
          </span>
        </div>
        <label className={styles.printSetting}>
          <input
            checked={printOnAccept}
            onChange={(event) => changePrintPreference(event.target.checked)}
            type="checkbox"
          />
          <span className={styles.switch} aria-hidden="true" />
          <span>
            <strong>Imprimir comanda ao aceitar</strong>
            <small>Preferência salva somente neste computador.</small>
          </span>
        </label>
      </div>

      <p className={styles.printHint}>
        No navegador comum, o sistema abre a tela de impressão. Para imprimir
        sem confirmação, use o computador da operação no modo de impressão
        automática do navegador.
      </p>

      {!snapshot.orders.length ? (
        <div className={styles.empty}>
          <span aria-hidden="true">🍽️</span>
          <strong>Nenhum pedido ainda</strong>
          <p>Os novos pedidos aparecerão aqui automaticamente.</p>
        </div>
      ) : (
        <div className={styles.board}>
          {groupedOrders.map((column) => {
            const total = column.orders.reduce(
              (sum, order) =>
                order.status === "cancelled"
                  ? sum
                  : sum + order.totalInCents,
              0,
            );

            return (
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
                  <strong>{formatMoney(total)}</strong>
                </header>

                <div className={styles.cards}>
                  {column.orders.length ? (
                    column.orders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        pending={pendingOrderId === order.id}
                        onStatusChange={changeOrderStatus}
                      />
                    ))
                  ) : (
                    <div className={styles.emptyColumn}>
                      <span aria-hidden="true">✓</span>
                      Nenhum pedido nesta etapa
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}

function OrderCard({
  order,
  pending,
  onStatusChange,
}: {
  order: AdminOrder;
  pending: boolean;
  onStatusChange: (
    order: AdminOrder,
    status: OrderStatus,
    printControl: OrderPrintButtonHandle | null,
  ) => Promise<void>;
}) {
  const printControl = useRef<OrderPrintButtonHandle>(null);
  const nextStatuses = getOrderStatusTransitions(
    order.status,
    order.fulfillment,
  );
  const primaryStatus = getPrimaryStatus(order, nextStatuses);
  const canCancel = nextStatuses.includes("cancelled");

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <div>
          <small>Pedido</small>
          <strong>#{order.orderNumber}</strong>
        </div>
        <div>
          <time dateTime={order.createdAt}>
            {formatOrderTime(order.createdAt)}
          </time>
          <span>{getOrderStatusLabel(order.status, order.fulfillment)}</span>
        </div>
      </header>

      <div className={styles.customer}>
        <strong>{order.customerName}</strong>
        <a href={`tel:+55${order.customerPhone}`}>{order.customerPhone}</a>
      </div>

      <div className={styles.cardMeta}>
        <span>{FULFILLMENT_LABELS[order.fulfillment]}</span>
        <span>
          {order.itemCount} {order.itemCount === 1 ? "item" : "itens"}
        </span>
      </div>

      {order.fulfillment === "delivery" && order.address ? (
        <p className={styles.address}>
          <span aria-hidden="true">⌖</span>
          {order.address}
        </p>
      ) : null}

      <div className={styles.total}>
        <small>{order.paymentLabel}</small>
        <strong>{formatMoney(order.totalInCents)}</strong>
      </div>

      <details className={styles.orderItems}>
        <summary>Ver itens e escolhas</summary>
        <div>
          {order.items.map((item) => (
            <section key={item.id}>
              <header>
                <strong>
                  {item.quantity}× {item.name}
                </strong>
                <b>{formatMoney(item.lineTotalInCents)}</b>
              </header>
              {item.addons.length ? (
                <ul>
                  {item.addons.map((addon, index) => (
                    <li key={`${addon.groupName}-${addon.name}-${index}`}>
                      <span aria-hidden="true">•</span>
                      <strong>
                        {addon.quantity > 1 ? `${addon.quantity}× ` : ""}
                        {addon.name}
                      </strong>
                    </li>
                  ))}
                </ul>
              ) : null}
              {item.notes ? <p>Obs.: {item.notes}</p> : null}
            </section>
          ))}
          <section>
            <header>
              <strong>Bebidas</strong>
            </header>
            <p>{order.beverages ?? "Sem bebida"}</p>
          </section>
        </div>
      </details>

      <div className={styles.actions}>
        {primaryStatus ? (
          <button
            className={styles.primaryAction}
            disabled={pending}
            onClick={() =>
              onStatusChange(order, primaryStatus, printControl.current)
            }
            type="button"
          >
            {pending ? "Atualizando..." : getActionLabel(primaryStatus, order)}
          </button>
        ) : null}
        {canCancel ? (
          <button
            className={styles.cancelAction}
            disabled={pending}
            onClick={() =>
              onStatusChange(order, "cancelled", printControl.current)
            }
            type="button"
          >
            {order.status === "received" ||
            order.status === "awaiting_confirmation"
              ? "Recusar"
              : "Cancelar"}
          </button>
        ) : null}
        <OrderPrintButton order={order} ref={printControl} />
        {!nextStatuses.length ? (
          <small className={styles.finishedLabel}>Fluxo encerrado</small>
        ) : null}
      </div>
    </article>
  );
}

function getPrimaryStatus(order: AdminOrder, nextStatuses: OrderStatus[]) {
  if (
    order.status === "received" ||
    order.status === "awaiting_confirmation"
  ) {
    return nextStatuses.includes("confirmed") ? "confirmed" : null;
  }
  return nextStatuses.find((status) => status !== "cancelled") ?? null;
}

function getActionLabel(status: OrderStatus, order: AdminOrder) {
  if (status === "confirmed") return "Aceitar pedido";
  if (status === "preparing") return "Iniciar preparo";
  if (status === "out_for_delivery") return "Saiu para entrega";
  if (status === "ready_for_pickup") {
    return order.fulfillment === "dine_in"
      ? "Pronto para servir"
      : "Pronto para retirada";
  }
  if (status === "delivered") {
    if (order.fulfillment === "delivery") return "Marcar como entregue";
    if (order.fulfillment === "pickup") return "Marcar como retirado";
    return "Finalizar atendimento";
  }
  return getOrderStatusLabel(status, order.fulfillment);
}

function formatOrderTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
