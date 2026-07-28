import { TEST_ORDER_RESET_CONFIRMATION } from "../../application/test-order-history-reset/reset-test-order-history";
import { resetTestOrderHistoryAction } from "../../server/admin-order-actions";
import styles from "./order-history-reset.module.css";

export function OrderHistoryReset({ orderCount }: { orderCount: number }) {
  return (
    <section className={styles.panel} aria-labelledby="reset-history-title">
      <div>
        <p>Área de manutenção</p>
        <h2 id="reset-history-title">Zerar pedidos de teste</h2>
        <span>
          Exclui pedidos, pagamentos, itens, clientes e endereços de teste.
          Cardápio e configurações serão preservados.
        </span>
      </div>

      {orderCount > 0 ? (
        <form action={resetTestOrderHistoryAction}>
          <label htmlFor="test-order-reset-confirmation">
            Para excluir {orderCount} {orderCount === 1 ? "pedido" : "pedidos"},
            digite <strong>{TEST_ORDER_RESET_CONFIRMATION}</strong>
          </label>
          <div>
            <input
              id="test-order-reset-confirmation"
              name="confirmation"
              autoComplete="off"
              required
              pattern={TEST_ORDER_RESET_CONFIRMATION}
            />
            <button type="submit">
              Excluir {orderCount} {orderCount === 1 ? "pedido" : "pedidos"}
            </button>
          </div>
        </form>
      ) : (
        <strong className={styles.empty}>O histórico de testes está zerado.</strong>
      )}
    </section>
  );
}
