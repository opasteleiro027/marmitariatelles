"use client";

import { useMemo, useState } from "react";
import type { CartItem } from "@/modules/ordering/ui/ordering-drawer/ordering.types";
import { formatMoney } from "../../domain/format-money";
import type {
  StorefrontMarmitaGroup,
  StorefrontSnapshot,
} from "../../domain/storefront.types";
import {
  MarmitaGroupStep,
  MarmitaSummary,
  StepTitle,
  selectionCount,
} from "./MarmitaConfiguratorParts";
import styles from "./marmita-configurator.module.css";

export function MarmitaConfigurator({
  builder,
  orderingEnabled,
  onAdd,
}: {
  builder: StorefrontSnapshot["marmitaBuilder"];
  orderingEnabled: boolean;
  onAdd: (item: CartItem) => void;
}) {
  const [sizeId, setSizeId] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [addedToCart, setAddedToCart] = useState(false);
  const size = builder.sizes.find((candidate) => candidate.id === sizeId);

  const selections = useMemo(
    () =>
      builder.groups.flatMap((group) =>
        group.options.flatMap((option) => {
          const quantity = quantities[option.id] ?? 0;
          return quantity > 0
            ? [
                {
                  groupId: group.id,
                  groupName: group.name,
                  optionId: option.id,
                  optionName: option.name,
                  additionalPriceInCents: option.additionalPriceInCents,
                  quantity,
                },
              ]
            : [];
        }),
      ),
    [builder.groups, quantities],
  );

  const additionTotal = selections.reduce(
    (total, option) =>
      total + option.additionalPriceInCents * option.quantity,
    0,
  );
  const basePrice = size
    ? size.promotionalPriceInCents ?? size.priceInCents
    : 0;
  const total = basePrice + additionTotal;
  const complete =
    Boolean(size?.available) &&
    builder.groups.every((group) => {
      const count = selectionCount(group, quantities);
      const limit = size?.limits[group.id];
      return count >= (limit?.minimum ?? 0) && count <= (limit?.maximum ?? 99);
    });

  function selectSize(nextSizeId: string) {
    if (addedToCart) return;
    const nextSize = builder.sizes.find((candidate) => candidate.id === nextSizeId);
    if (!nextSize?.available) return;
    setSizeId(nextSizeId);
    setQuantities((current) =>
      clampSelections(current, builder.groups, nextSize.limits),
    );
  }

  function changeOption(
    group: StorefrontMarmitaGroup,
    optionId: string,
    delta: number,
  ) {
    if (!size || addedToCart) return;
    const option = group.options.find((candidate) => candidate.id === optionId);
    if (!option?.available) return;
    const maximum = size.limits[group.id]?.maximum ?? 99;
    setQuantities((current) => {
      if (group.selectionType === "single") {
        const cleared = { ...current };
        for (const candidate of group.options) delete cleared[candidate.id];
        return { ...cleared, [optionId]: 1 };
      }
      const groupTotal = selectionCount(group, current);
      const currentValue = current[optionId] ?? 0;
      const nextValue = Math.max(0, currentValue + delta);
      if (delta > 0 && groupTotal >= maximum) return current;
      return { ...current, [optionId]: nextValue };
    });
  }

  function addToCart() {
    if (!size || !complete || !orderingEnabled) return;
    onAdd({
      lineId: crypto.randomUUID(),
      product: size,
      quantity: 1,
      selections,
      notes: notes.trim(),
    });
    setAddedToCart(true);
  }

  function continueShopping() {
    setSizeId("");
    setQuantities({});
    setNotes("");
    setAddedToCart(false);
  }

  if (!builder.sizes.length || !builder.groups.length) {
    return (
      <div className={styles.unavailable}>
        <strong>A montagem ainda não foi configurada.</strong>
        <p>Assim que os tamanhos e ingredientes forem cadastrados, eles aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <div className={styles.steps}>
        <section className={styles.step}>
          <StepTitle number={1} title="Escolha o tamanho" />
          <div className={styles.sizeGrid}>
            {builder.sizes.map((candidate) => (
              <label
                className={`${styles.sizeCard} ${
                  sizeId === candidate.id ? styles.selected : ""
                } ${!candidate.available ? styles.disabled : ""}`}
                key={candidate.id}
              >
                <input
                  checked={sizeId === candidate.id}
                  disabled={!candidate.available || addedToCart}
                  name="marmita-size"
                  onChange={() => selectSize(candidate.id)}
                  type="radio"
                />
                <span aria-hidden="true">
                  {sizeId === candidate.id ? "✔️" : "▤"}
                </span>
                <strong>{candidate.name}</strong>
                <small>{candidate.description}</small>
                <b>
                  {candidate.available
                    ? formatMoney(
                        candidate.promotionalPriceInCents ??
                          candidate.priceInCents,
                      )
                    : "Esgotada"}
                </b>
              </label>
            ))}
          </div>
        </section>

        {builder.groups.map((group, index) => (
          <MarmitaGroupStep
            group={group}
            key={group.id}
            locked={addedToCart}
            number={index + 2}
            onChange={changeOption}
            orderingEnabled={orderingEnabled}
            quantities={quantities}
            size={size}
          />
        ))}

        <section className={styles.step}>
          <StepTitle number={builder.groups.length + 2} title="Alguma observação?" />
          <div className={styles.notes}>
            <textarea
              disabled={addedToCart}
              maxLength={150}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ex.: Tirar a cebola, arroz bem soltinho..."
              value={notes}
            />
            <small>{notes.length}/150</small>
          </div>
        </section>
      </div>

      <MarmitaSummary
        addedToCart={addedToCart}
        builder={builder}
        complete={complete}
        onAdd={addToCart}
        onContinue={continueShopping}
        orderingEnabled={orderingEnabled}
        selections={selections}
        size={size}
        total={total}
      />
    </div>
  );
}

function clampSelections(
  current: Record<string, number>,
  groups: StorefrontMarmitaGroup[],
  limits: Record<string, { minimum: number; maximum: number }>,
) {
  const next = { ...current };
  for (const group of groups) {
    let remaining = limits[group.id]?.maximum ?? 99;
    for (const option of group.options) {
      const value = Math.min(next[option.id] ?? 0, remaining);
      next[option.id] = value;
      remaining -= value;
    }
  }
  return next;
}
