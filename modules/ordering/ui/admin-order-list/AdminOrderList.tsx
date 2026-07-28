import { formatMoney } from "@/modules/storefront/domain/format-money";
import type { AdminOrderSnapshot } from "../../application/admin-orders";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
} from "../../application/order-status";
import { updateOrderStatusAction } from "../../server/admin-order-actions";
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
            const nextStatuses = ORDER_STATUS_TRANSITIONS[order.status];
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
                    {order.fulfillment === "delivery"
                      ? "Entrega"
                      : "Retirada"}{" "}
                    · {order.itemCount} itens
                  </small>
                  <strong>{formatMoney(order.totalInCents)}</strong>
                </div>
                <span className={styles.status}>
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
                <details className={styles.orderItems}>
                  <summary>Ver marmitas e escolhas</summary>
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
                          {ORDER_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                    <button type="submit">Atualizar</button>
                  </form>
                ) : (
                  <small className={styles.finished}>Fluxo encerrado</small>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
