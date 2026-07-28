import type { AdminSalesCalendar } from "../../application/admin-sales-calendar";
import { saveDeliverySlotAction } from "../../server/sales-calendar-actions";
import { SalesCalendarForm } from "../sales-calendar-form/SalesCalendarForm";
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
      <SalesCalendarForm menu={snapshot.menu} />
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
