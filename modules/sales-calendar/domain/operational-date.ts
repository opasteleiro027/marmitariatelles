const OPERATIONAL_TIME_ZONE = "America/Sao_Paulo";

export function dateKeyInSaoPaulo(reference = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: OPERATIONAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(reference);
}

export function formatSalesDateLabel(dateKey: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new Error("Data de venda inválida.");
  }
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  if (Number.isNaN(date.valueOf())) {
    throw new Error("Data de venda inválida.");
  }
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}
