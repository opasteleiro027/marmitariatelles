"use client";

import { useState } from "react";
import styles from "./catalog-delete-control.module.css";

type DeleteAction = (formData: FormData) => Promise<void>;

export function CatalogDeleteControl({
  action,
  id,
  itemName,
  itemType,
}: {
  action: DeleteAction;
  id: string;
  itemName: string;
  itemType: "produto" | "tamanho" | "ingrediente";
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        className={styles.deleteButton}
        type="button"
        onClick={() => setConfirming(true)}
      >
        Excluir {itemType}
      </button>
    );
  }

  return (
    <form action={action} className={styles.confirmation}>
      <input type="hidden" name="id" value={id} />
      <p>
        Excluir <strong>{itemName}</strong>? O item sairá do cardápio e desta
        tela de edição. Os pedidos antigos serão preservados.
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
