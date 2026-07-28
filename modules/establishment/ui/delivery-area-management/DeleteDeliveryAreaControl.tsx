"use client";

import { useState } from "react";
import { deleteDeliveryAreaAction } from "../../server/establishment-actions";
import styles from "./delivery-area-management.module.css";

export function DeleteDeliveryAreaControl({
  id,
  neighborhood,
}: {
  id: string;
  neighborhood: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        className={styles.deleteButton}
        type="button"
        onClick={() => setConfirming(true)}
      >
        Excluir bairro
      </button>
    );
  }

  return (
    <form action={deleteDeliveryAreaAction} className={styles.deleteConfirmation}>
      <input type="hidden" name="id" value={id} />
      <p>
        Excluir <strong>{neighborhood}</strong>? O bairro deixará de aparecer
        para novos pedidos.
      </p>
      <div>
        <button type="button" onClick={() => setConfirming(false)}>
          Cancelar
        </button>
        <button className={styles.confirmDelete} type="submit">
          Confirmar exclusão
        </button>
      </div>
    </form>
  );
}
