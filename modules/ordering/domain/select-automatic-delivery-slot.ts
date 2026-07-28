export function selectAutomaticDeliverySlot(
  slots: Array<{ id: string; available: boolean }>,
): string {
  return slots.find((slot) => slot.available)?.id ?? "";
}
