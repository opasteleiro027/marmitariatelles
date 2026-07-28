import { notFound } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/modules/storefront/domain/format-money";
import { getTrackedOrder } from "@/modules/ordering/application/get-tracked-order";
import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/modules/ordering/application/order-status";
import styles from "./tracking.module.css";

export const dynamic = "force-dynamic";

const activeSteps: OrderStatus[] = [
  "awaiting_confirmation",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await getTrackedOrder(token);
  if (!order) notFound();

  const isPickup = order.fulfillment === "pickup";
  const steps = isPickup
    ? activeSteps.map((status) =>
        status === "out_for_delivery" ? "ready_for_pickup" : status,
      )
    : activeSteps;
  const currentIndex = steps.indexOf(order.status);

  return (
    <main className={styles.page}>
      <Link className={styles.brand} href="/">
        <span>MT</span>
        Marmitaria Telles
      </Link>
      <section className={styles.card}>
        <header>
          <p>Pedido nº {order.orderNumber}</p>
          <h1>{ORDER_STATUS_LABELS[order.status]}</h1>
          <span>
            Recebido em{" "}
            {new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
              timeZone: "America/Sao_Paulo",
            }).format(new Date(order.createdAt))}
          </span>
        </header>

        {order.status === "cancelled" ? (
          <div className={styles.cancelled}>
            Este pedido foi cancelado. Fale conosco se precisar de ajuda.
          </div>
        ) : (
          <ol className={styles.timeline}>
            {steps.map((status, index) => (
              <li
                className={index <= currentIndex ? styles.complete : undefined}
                key={status}
              >
                <span>{index < currentIndex ? "✓" : index + 1}</span>
                <small>{ORDER_STATUS_LABELS[status]}</small>
              </li>
            ))}
          </ol>
        )}

        <div className={styles.columns}>
          <section>
            <h2>Itens</h2>
            <ul className={styles.items}>
              {order.items.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.quantity}× {item.name}
                  </span>
                  <strong>{formatMoney(item.lineTotalInCents)}</strong>
                </li>
              ))}
            </ul>
            <div className={styles.total}>
              <span>Subtotal <strong>{formatMoney(order.subtotalInCents)}</strong></span>
              <span>Taxa <strong>{formatMoney(order.deliveryFeeInCents)}</strong></span>
              <span>Total <strong>{formatMoney(order.totalInCents)}</strong></span>
            </div>
          </section>
          <aside>
            <h2>{isPickup ? "Retirada" : "Entrega"}</h2>
            <p>
              {isPickup
                ? "Av. Bartolomeu de Las Casa, nº 16, Quadra 17, Cidade Continental, Setor América, Serra - ES"
                : order.address}
            </p>
            <h2>Pagamento</h2>
            <p>{order.paymentLabel}</p>
          </aside>
        </div>
      </section>
      <p className={styles.security}>
        Este endereço é privado. Não compartilhe o link do pedido.
      </p>
    </main>
  );
}
