export const FULFILLMENT_TYPES = ["dine_in", "pickup", "delivery"] as const;

export type FulfillmentType = (typeof FULFILLMENT_TYPES)[number];

export const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  dine_in: "Comer na loja",
  pickup: "Retirada",
  delivery: "Receber em casa",
};

export function isFulfillmentType(value: unknown): value is FulfillmentType {
  return FULFILLMENT_TYPES.includes(value as FulfillmentType);
}

export function fulfillmentNeedsDeliverySlot(
  fulfillment: FulfillmentType,
) {
  return fulfillment !== "dine_in";
}
