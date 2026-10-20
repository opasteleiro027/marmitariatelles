import { formatMoney } from "@/modules/storefront/domain/format-money";
import type { AdminOrderSnapshot } from "../../application/admin-orders";
import {
  getOrderStatusLabel,
  getOrderStatusTransitions,
} from "../../application/order-status";
import { FULFILLMENT_LABELS } from "../../domain/fulfillment";
import { updateOrderStatusAction } from "../../server/admin-order-actions";
import { OrderPrintButton } from "../order-print-button/OrderPrintButton";
import styles from "./admin-order-list.module.css";

export function AdminOrderList({
  snapshot,
}: {
  snapshot: AdminOrderSnapshot;
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.heading}>
        <div>
          <p>Operação em tempo real</p>
          <h2>Pedidos recebidos</h2>
        </div>
        <span>{snapshot.orders.length} exibidos</span>
      </div>
      {!snapshot.orders.length ? (
        <div className={styles.empty}>
          <span aria-hidden="true">🍽️</span>
          <strong>Nenhum pedido ainda</strong>
          <p>Os novos pedidos aparecerão aqui automaticamente.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {snapshot.orders.map((order) => {
            const nextStatuses = getOrderStatusTransitions(
              order.status,
              order.fulfillment,
            );
            return (
              <article key={order.id}>
                <div className={styles.orderNumber}>
                  <small>Pedido</small>
                  <strong>#{order.orderNumber}</strong>
                </div>
                <div>
                  <strong>{order.customerName}</strong>
                  <a href={`tel:+55${order.customerPhone}`}>
                    {order.customerPhone}
                  </a>
                </div>
                <div>
                  <small>
                    {FULFILLMENT_LABELS[order.fulfillment]}{" "}
                    · {order.itemCount} itens
                  </small>
                  <strong>{formatMoney(order.totalInCents)}</strong>
                </div>
                <span className={styles.status}>
                  {getOrderStatusLabel(order.status, order.fulfillment)}
                </span>
                <details className={styles.orderItems}>
                  <summary>Ver itens e escolhas</summary>
                  <div>
                    {order.items.map((item) => (
                      <section key={item.id}>
                        <header>
                          <strong>{item.quantity}× {item.name}</strong>
                          <b>{formatMoney(item.lineTotalInCents)}</b>
                        </header>
                        {item.addons.length ? (
                          <ul>
                            {item.addons.map((addon, index) => (
                              <li key={`${addon.groupName}-${addon.name}-${index}`}>
                                <span>{addon.groupName}</span>
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
                  </div>
                </details>
                <div className={styles.orderActions}>
                  <OrderPrintButton order={order} />
                  {nextStatuses.length ? (
                    <form action={updateOrderStatusAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <select
                        aria-label={`Atualizar pedido ${order.orderNumber}`}
                        name="status"
                        defaultValue={nextStatuses[0]}
                      >
                        {nextStatuses.map((status) => (
                          <option key={status} value={status}>
                            {getOrderStatusLabel(status, order.fulfillment)}
                          </option>
                        ))}
                      </select>
                      <button type="submit">Atualizar</button>
                    </form>
                  ) : (
                    <small className={styles.finished}>Fluxo encerrado</small>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
