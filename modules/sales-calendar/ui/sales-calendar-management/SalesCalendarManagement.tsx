import type { AdminSalesCalendar } from "../../application/admin-sales-calendar";
import {
  saveDeliverySlotAction,
  saveSalesCalendarAction,
} from "../../server/sales-calendar-actions";
import styles from "./sales-calendar-management.module.css";

export function SalesCalendarManagement({
  snapshot,
}: {
  snapshot: AdminSalesCalendar;
}) {
  return (
    <section className={styles.section} id="horarios">
      <div className={styles.heading}>
        <div>
          <p>Agenda de vendas</p>
          <h2>Próximo domingo e faixas de horário</h2>
        </div>
        <span>{snapshot.menu.published ? "Publicado" : "Oculto"}</span>
      </div>
      <form action={saveSalesCalendarAction} className={styles.menuForm}>
        <input type="hidden" name="id" value={snapshot.menu.id} />
        <label>Data da venda<input name="salesDate" type="date" defaultValue={snapshot.menu.salesDate} required /></label>
        <label>Abertura<input name="orderingOpensAt" type="datetime-local" defaultValue={localInput(snapshot.menu.orderingOpensAt)} required /></label>
        <label>Encerramento<input name="orderingClosesAt" type="datetime-local" defaultValue={localInput(snapshot.menu.orderingClosesAt)} required /></label>
        <label>Limite total<input name="totalCapacity" type="number" min="1" defaultValue={snapshot.menu.totalCapacity ?? ""} /></label>
        <label className={styles.check}><input name="published" type="checkbox" defaultChecked={snapshot.menu.published} />Cardápio publicado</label>
        <label className={styles.check}><input name="closedManually" type="checkbox" defaultChecked={snapshot.menu.closedManually} />Encerrar vendas manualmente</label>
        <button type="submit">Salvar agenda</button>
      </form>
      <div className={styles.slots}>
        {snapshot.slots.map((slot) => (
          <form action={saveDeliverySlotAction} key={slot.id}>
            <input type="hidden" name="id" value={slot.id} />
            <label>Início<input name="startsAt" type="time" defaultValue={slot.startsAt} required /></label>
            <label>Fim<input name="endsAt" type="time" defaultValue={slot.endsAt} required /></label>
            <label>Capacidade<input name="capacity" type="number" min={Math.max(1, slot.reservedCount)} defaultValue={slot.capacity} required /></label>
            <label className={styles.check}><input name="active" type="checkbox" defaultChecked={slot.active} />Ativa</label>
            <small>{slot.reservedCount} reserva(s)</small>
            <button type="submit">Salvar faixa</button>
          </form>
        ))}
      </div>
    </section>
  );
}

function localInput(value: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(value))
    .replace(" ", "T");
}
