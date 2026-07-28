"use client";

import { useActionState } from "react";
import type { AdminSalesCalendar } from "../../application/admin-sales-calendar";
import {
  saveSalesCalendarAction,
  type SalesCalendarActionState,
} from "../../server/sales-calendar-actions";
import styles from "./sales-calendar-form.module.css";

const INITIAL_STATE: SalesCalendarActionState = {
  status: "idle",
  message: "",
};

export function SalesCalendarForm({
  menu,
}: {
  menu: AdminSalesCalendar["menu"];
}) {
  const [state, action, pending] = useActionState(
    saveSalesCalendarAction,
    INITIAL_STATE,
  );

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="id" value={menu.id} />
      <label>
        Data da venda
        <input name="salesDate" type="date" defaultValue={menu.salesDate} required />
      </label>
      <label>
        Abertura
        <input
          name="orderingOpensAt"
          type="datetime-local"
          defaultValue={localInput(menu.orderingOpensAt)}
          required
        />
      </label>
      <label>
        Encerramento
        <input
          name="orderingClosesAt"
          type="datetime-local"
          defaultValue={localInput(menu.orderingClosesAt)}
          required
        />
      </label>
      <label>
        Limite total
        <input
          name="totalCapacity"
          type="number"
          min="1"
          defaultValue={menu.totalCapacity ?? ""}
        />
      </label>
      <label className={styles.check}>
        <input name="published" type="checkbox" defaultChecked={menu.published} />
        Cardápio publicado
      </label>
      <label className={styles.check}>
        <input
          name="closedManually"
          type="checkbox"
          defaultChecked={menu.closedManually}
        />
        Encerrar vendas manualmente
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar agenda"}
      </button>
      {state.message ? (
        <p
          className={state.status === "error" ? styles.error : styles.success}
          role="status"
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}
    </form>
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
