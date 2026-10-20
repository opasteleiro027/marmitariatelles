import type { FulfillmentType } from "../domain/fulfillment";

export const ORDER_STATUSES = [
  "received",
  "awaiting_confirmation",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "ready_for_pickup",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Recebido",
  awaiting_confirmation: "Aguardando confirmação",
  confirmed: "Confirmado",
  preparing: "Em preparo",
  out_for_delivery: "Saiu para entrega",
  ready_for_pickup: "Pronto para retirada",
  delivered: "Concluído",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  received: ["awaiting_confirmation", "confirmed", "cancelled"],
  awaiting_confirmation: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["out_for_delivery", "ready_for_pickup", "cancelled"],
  out_for_delivery: ["delivered"],
  ready_for_pickup: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

export function getOrderStatusLabel(
  status: OrderStatus,
  fulfillment: FulfillmentType,
) {
  if (status === "ready_for_pickup" && fulfillment === "dine_in") {
    return "Pronto para servir";
  }
  if (status === "delivered") {
    if (fulfillment === "delivery") return "Entregue";
    if (fulfillment === "pickup") return "Retirado";
    return "Finalizado";
  }
  return ORDER_STATUS_LABELS[status];
}

export function getOrderStatusTransitions(
  status: OrderStatus,
  fulfillment: FulfillmentType,
) {
  if (status !== "preparing") return ORDER_STATUS_TRANSITIONS[status];
  return fulfillment === "delivery"
    ? (["out_for_delivery", "cancelled"] as OrderStatus[])
    : (["ready_for_pickup", "cancelled"] as OrderStatus[]);
}
