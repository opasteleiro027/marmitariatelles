import type { StorefrontMarmitaGroup } from "./storefront.types";

export function changeMarmitaOptionQuantity({
  current,
  delta,
  group,
  maximum,
  optionId,
}: {
  current: Record<string, number>;
  delta: number;
  group: StorefrontMarmitaGroup;
  maximum: number;
  optionId: string;
}) {
  if (group.selectionType === "single") {
    const next = { ...current };
    for (const option of group.options) delete next[option.id];
    next[optionId] = 1;
    return next;
  }

  const groupTotal = marmitaSelectionCount(group, current);
  const currentValue = current[optionId] ?? 0;
  const nextValue = Math.max(0, currentValue + delta);
  if (delta > 0 && groupTotal >= maximum) return current;
  return { ...current, [optionId]: nextValue };
}

export function shouldAdvanceMarmitaStep({
  changed,
  delta,
  group,
  maximum,
  quantities,
}: {
  changed: boolean;
  delta: number;
  group: StorefrontMarmitaGroup;
  maximum: number;
  quantities: Record<string, number>;
}) {
  if (!changed || delta <= 0) return false;
  if (group.selectionType === "single") return true;
  return marmitaSelectionCount(group, quantities) >= maximum;
}

export function marmitaSelectionCount(
  group: StorefrontMarmitaGroup,
  quantities: Record<string, number>,
) {
  return group.options.reduce(
    (total, option) => total + (quantities[option.id] ?? 0),
    0,
  );
}
