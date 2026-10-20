"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { CartItem } from "@/modules/ordering/ui/ordering-drawer/ordering.types";
import { formatMoney } from "../../domain/format-money";
import type { StorefrontProduct } from "../../domain/storefront.types";
import styles from "./product-customizer.module.css";

export function ProductCustomizer({
  product,
  onAdd,
  onClose,
}: {
  product: StorefrontProduct;
  onAdd: (item: CartItem) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const selections = useMemo(
    () =>
      product.customizationGroups.flatMap((group) =>
        group.options.flatMap((option) =>
          selected[option.id]
            ? [{
                groupId: group.id,
                groupName: group.name,
                optionId: option.id,
                optionName: option.name,
                additionalPriceInCents: option.additionalPriceInCents,
                quantity: 1,
              }]
            : [],
        ),
      ),
    [product.customizationGroups, selected],
  );
  const complete = product.customizationGroups.every((group) => {
    const count = group.options.filter((option) => selected[option.id]).length;
    return count >= group.minimumSelections && count <= group.maximumSelections;
  });
  const total =
    (product.promotionalPriceInCents ?? product.priceInCents) +
    selections.reduce(
      (sum, selection) => sum + selection.additionalPriceInCents,
      0,
    );

  function toggle(groupId: string, optionId: string) {
    const group = product.customizationGroups.find((item) => item.id === groupId);
    if (!group) return;
    setSelected((current) => {
      const next = { ...current };
      if (group.selectionType === "single") {
        for (const option of group.options) delete next[option.id];
        if (!current[optionId]) next[optionId] = true;
        return next;
      }
      const count = group.options.filter((option) => current[option.id]).length;
      if (!current[optionId] && count >= group.maximumSelections) return current;
      next[optionId] = !current[optionId];
      return next;
    });
  }

  function add() {
    if (!complete) return;
    onAdd({
      lineId: crypto.randomUUID(),
      product,
      quantity: 1,
      selections,
      notes: notes.trim(),
    });
  }

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section
        aria-label={`Personalizar ${product.name}`}
        aria-modal="true"
        className={styles.dialog}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button className={styles.close} onClick={onClose} type="button" aria-label="Fechar">
          ×
        </button>
        {product.imageUrl ? (
          <Image
            alt={product.name}
            className={styles.image}
            height={640}
            src={product.imageUrl}
            width={960}
          />
        ) : null}
        <div className={styles.content}>
          <p className={styles.eyebrow}>Personalize seu pedido</p>
          <h2>{product.name}</h2>
          <p className={styles.description}>{product.description}</p>

          {product.customizationGroups.map((group) => {
            const count = group.options.filter((option) => selected[option.id]).length;
            return (
              <fieldset key={group.id}>
                <legend>{group.name}</legend>
                <small>
                  {group.minimumSelections === 0
                    ? `Opcional · até ${group.maximumSelections}`
                    : `Escolha de ${group.minimumSelections} a ${group.maximumSelections}`}
                </small>
                <div className={styles.options}>
                  {group.options.map((option) => {
                    const active = Boolean(selected[option.id]);
                    return (
                      <button
                        className={active ? styles.selected : ""}
                        disabled={!option.available}
                        key={option.id}
                        onClick={() => toggle(group.id, option.id)}
                        type="button"
                      >
                        <span>{active ? "✓" : "+"} {option.name}</span>
                        <strong>
                          {option.available
                            ? option.additionalPriceInCents
                              ? `+ ${formatMoney(option.additionalPriceInCents)}`
                              : "Incluído"
                            : "Esgotado"}
                        </strong>
                      </button>
                    );
                  })}
                </div>
                {count > group.maximumSelections ? <em>Revise as escolhas.</em> : null}
              </fieldset>
            );
          })}

          <label className={styles.notes}>
            Observação <small>(opcional)</small>
            <textarea
              maxLength={150}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ex.: sem cebola, molho separado..."
              value={notes}
            />
          </label>
          <button className={styles.add} disabled={!complete} onClick={add} type="button">
            <span>Adicionar ao pedido</span>
            <strong>{formatMoney(total)}</strong>
          </button>
        </div>
      </section>
    </div>
  );
}
