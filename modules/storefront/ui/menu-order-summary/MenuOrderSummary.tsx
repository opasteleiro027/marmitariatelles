"use client";

import {
  cartItemUnitPrice,
  type CartItem,
} from "@/modules/ordering/ui/ordering-drawer/ordering.types";
import { formatMoney } from "../../domain/format-money";
import styles from "./menu-order-summary.module.css";

export function MenuOrderSummary({
  items,
  minimumOrderInCents,
  orderingEnabled,
  onCheckout,
}: {
  items: CartItem[];
  minimumOrderInCents: number;
  orderingEnabled: boolean;
  onCheckout: () => void;
}) {
  const subtotal = items.reduce((total, item) => {
    return total + cartItemUnitPrice(item) * item.quantity;
  }, 0);
  const missingMinimum = Math.max(0, minimumOrderInCents - subtotal);

  return (
    <aside className={styles.summary} aria-label="Resumo do pedido">
      <header>
        <div>
          <h2>Sua marmita</h2>
          <p>Resumo atualizado em tempo real</p>
        </div>
        <span>{items.reduce((total, item) => total + item.quantity, 0)}</span>
      </header>

      {items.length ? (
        <div className={styles.items}>
          {items.map((item) => (
            <div key={item.lineId}>
              <span>{item.quantity}× {item.product.name}</span>
              <strong>
                {formatMoney(cartItemUnitPrice(item) * item.quantity)}
              </strong>
              {item.selections.length ? (
                <small>
                  {item.selections
                    .map((selection) => selection.optionName)
                    .join(", ")}
                </small>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <span aria-hidden="true">+</span>
          <p>Escolha os itens ao lado para começar seu pedido.</p>
        </div>
      )}

      <div className={styles.total}>
        <span>Subtotal</span>
        <strong>{formatMoney(subtotal)}</strong>
      </div>

      {missingMinimum > 0 && items.length ? (
        <p className={styles.minimum}>
          Faltam {formatMoney(missingMinimum)} para o pedido mínimo.
        </p>
      ) : null}

      <button
        disabled={!items.length || !orderingEnabled || missingMinimum > 0}
        onClick={onCheckout}
        type="button"
      >
        {!orderingEnabled
          ? "Site desligado"
          : missingMinimum > 0
            ? "Complete o pedido mínimo"
            : "Continuar para entrega"}
      </button>
      <small>A taxa de entrega é calculada no próximo passo.</small>
    </aside>
  );
}
