export type OrderPulse = {
  totalOrders: number;
  latestOrderId: string | null;
  version: string;
};

export type OrderPulseChange = "new-order" | "changed" | "unchanged";

export function classifyOrderPulse(
  previous: OrderPulse,
  next: OrderPulse,
): OrderPulseChange {
  if (
    next.totalOrders > previous.totalOrders &&
    next.latestOrderId !== previous.latestOrderId
  ) {
    return "new-order";
  }
  return next.version !== previous.version ? "changed" : "unchanged";
}
