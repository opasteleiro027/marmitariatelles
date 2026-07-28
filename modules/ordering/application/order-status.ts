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
