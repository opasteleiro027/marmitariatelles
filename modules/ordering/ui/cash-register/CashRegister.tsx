import type { CashMovement, CashRegisterSnapshot } from "../../application/cash-register";
import {
  closeCashRegisterAction,
  openCashRegisterAction,
  registerCashMovementAction,
} from "../../server/cash-register-actions";
import { formatMoney } from "@/modules/storefront/domain/format-money";
import { CashRegisterPrintButton } from "./CashRegisterPrintButton";
import styles from "./cash-register.module.css";

export function CashRegister({ snapshot }: { snapshot: CashRegisterSnapshot }) {
  const session = snapshot.current;
  if (!session) {
    return (
      <section className={styles.panel}>
        <div className={styles.statusBanner}>
          <span>Caixa fechado</span>
          <p>Informe o valor que ficará disponível para troco e abra o expediente.</p>
        </div>
        <form action={openCashRegisterAction} className={styles.openForm}>
          <label>
            Fundo inicial do caixa
            <span className={styles.moneyInput}><b>R$</b><input name="openingFloat" inputMode="decimal" placeholder="0,00" required /></span>
            <small>Dinheiro que já está na gaveta antes das vendas.</small>
          </label>
          <label>
            Observação <small>(opcional)</small>
            <input name="notes" maxLength={500} placeholder="Ex.: troco conferido" />
          </label>
          <button className={styles.primaryButton} type="submit">Abrir caixa</button>
        </form>
        <SessionHistory sessions={snapshot.history} />
      </section>
    );
  }

  const netSales = session.salesInCents - session.refundsInCents;
  return (
    <section className={styles.panel}>
      <div className={styles.statusBanner}>
        <div><span className={styles.openDot} />Caixa aberto</div>
        <p>Aberto às {formatDateTime(session.openedAt)} por {session.openedBy}</p>
      </div>

      {snapshot.pendingPayments > 0 ? (
        <div className={styles.pendingNotice}>
          Existem {snapshot.pendingPayments} pedido(s) aguardando pagamento. Eles entram no caixa quando forem confirmados.
        </div>
      ) : null}

      <div className={styles.summary}>
        <SummaryCard label="Vendas recebidas" value={formatMoney(netSales)} detail={`${formatMoney(session.salesInCents)} recebido · ${formatMoney(session.refundsInCents)} estornado`} />
        <SummaryCard label="Dinheiro esperado na gaveta" value={formatMoney(session.expectedCashInCents)} detail={`Fundo inicial ${formatMoney(session.openingFloatInCents)}`} />
        <SummaryCard label="Suprimentos" value={formatMoney(session.cashInInCents)} detail="Entradas manuais em dinheiro" />
        <SummaryCard label="Sangrias" value={formatMoney(session.cashOutInCents)} detail="Retiradas manuais em dinheiro" />
      </div>

      <div className={styles.columns}>
        <section className={styles.block}>
          <h2>Vendas por forma de pagamento</h2>
          {session.byMethod.length ? (
            <div className={styles.methodList}>
              {session.byMethod.map((method) => (
                <div key={method.code}>
                  <span>{method.label}<small>{method.refundsInCents ? `Estornos: ${formatMoney(method.refundsInCents)}` : ""}</small></span>
                  <strong>{formatMoney(method.salesInCents - method.refundsInCents)}</strong>
                </div>
              ))}
            </div>
          ) : <p className={styles.empty}>As vendas confirmadas aparecerão aqui.</p>}
        </section>

        <section className={styles.block}>
          <h2>Movimentação manual</h2>
          <p className={styles.help}>Registre qualquer entrada ou retirada de dinheiro da gaveta.</p>
          <form action={registerCashMovementAction} className={styles.movementForm}>
            <label>Tipo
              <select name="kind" defaultValue="cash_in">
                <option value="cash_in">Suprimento · entrada</option>
                <option value="cash_out">Sangria · retirada</option>
              </select>
            </label>
            <label>Valor
              <span className={styles.moneyInput}><b>R$</b><input name="amount" inputMode="decimal" placeholder="0,00" required /></span>
            </label>
            <label>Motivo
              <input name="description" maxLength={160} placeholder="Ex.: reforço de troco" required />
            </label>
            <button className={styles.secondaryButton} type="submit">Registrar movimentação</button>
          </form>
        </section>
      </div>

      <section className={styles.block}>
        <div className={styles.blockHeading}><div><h2>Movimentações do expediente</h2><p className={styles.help}>Pagamentos e ajustes registrados neste caixa.</p></div><CashRegisterPrintButton className={styles.printButton} /></div>
        <MovementList movements={session.movements} />
      </section>

      <section className={`${styles.block} ${styles.closeBlock}`}>
        <h2>Conferir e fechar caixa</h2>
        <p className={styles.help}>Conte o dinheiro físico da gaveta. PIX e cartão já aparecem nos totais do sistema.</p>
        <div className={styles.expectedLine}><span>Dinheiro esperado</span><strong>{formatMoney(session.expectedCashInCents)}</strong></div>
        <form action={closeCashRegisterAction} className={styles.closeForm}>
          <label>Dinheiro contado
            <span className={styles.moneyInput}><b>R$</b><input name="countedCash" inputMode="decimal" placeholder="0,00" required /></span>
          </label>
          <label>Observação <small>(opcional)</small>
            <input name="notes" maxLength={500} placeholder="Explique eventual diferença" />
          </label>
          <button className={styles.dangerButton} type="submit">Fechar caixa</button>
        </form>
      </section>
      <SessionHistory sessions={snapshot.history} />
    </section>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className={styles.summaryCard}><small>{label}</small><strong>{value}</strong><span>{detail}</span></article>;
}

function MovementList({ movements }: { movements: CashMovement[] }) {
  if (!movements.length) return <p className={styles.empty}>Nenhuma movimentação registrada ainda.</p>;
  return <div className={styles.movementList}>{movements.map((movement) => (
    <article key={movement.id}>
      <div><strong>{movement.description}</strong><small>{formatDateTime(movement.createdAt)}{movement.orderNumber ? ` · Pedido #${movement.orderNumber}` : ""}{movement.methodLabel ? ` · ${movement.methodLabel}` : ""}</small></div>
      <span className={movement.kind === "cash_out" || movement.kind === "refund" ? styles.negative : styles.positive}>
        {movement.kind === "cash_out" || movement.kind === "refund" ? "− " : "+ "}{formatMoney(movement.amountInCents)}
      </span>
    </article>
  ))}</div>;
}

function SessionHistory({ sessions }: { sessions: CashRegisterSnapshot["history"] }) {
  return <section className={styles.history}>
    <h2>Fechamentos anteriores</h2>
    {!sessions.length ? <p className={styles.empty}>Os caixas fechados aparecerão aqui.</p> : sessions.map((session) => (
      <details key={session.id} className={styles.historyItem}>
        <summary><span>{formatDate(session.openedAt)} · {formatTime(session.openedAt)}–{session.closedAt ? formatTime(session.closedAt) : "—"}</span><strong>{formatMoney(session.salesInCents - session.refundsInCents)}</strong><em className={session.cashDifferenceInCents === 0 ? styles.balanced : styles.difference}>{session.cashDifferenceInCents === null ? "" : session.cashDifferenceInCents === 0 ? "Conferido" : formatDifference(session.cashDifferenceInCents)}</em></summary>
        <div className={styles.historyDetails}>
          <span>Responsáveis: {session.openedBy}{session.closedBy ? ` / ${session.closedBy}` : ""}</span>
          <span>Fundo inicial: {formatMoney(session.openingFloatInCents)}</span>
          <span>Dinheiro esperado: {formatMoney(session.expectedCashInCents)}</span>
          <span>Dinheiro contado: {session.countedCashInCents === null ? "—" : formatMoney(session.countedCashInCents)}</span>
          <span>Vendas brutas: {formatMoney(session.salesInCents)} · Estornos: {formatMoney(session.refundsInCents)}</span>
          {session.byMethod.map((method) => <span key={method.code}>{method.label}: {formatMoney(method.salesInCents - method.refundsInCents)}</span>)}
          {session.notes ? <p>Observação: {session.notes}</p> : null}
          <MovementList movements={session.movements} />
        </div>
      </details>
    ))}
  </section>;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value));
}
function formatDate(value: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(new Date(value)); }
function formatTime(value: string) { return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date(value)); }
function formatDifference(value: number) { return `${value > 0 ? "Sobra" : "Falta"} ${formatMoney(Math.abs(value))}`; }
