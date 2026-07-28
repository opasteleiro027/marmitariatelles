export const ORDER_REPORT_PERIODS = ["day", "week", "month"] as const;

export type OrderReportPeriod = (typeof ORDER_REPORT_PERIODS)[number];

export type OrderReportDateRange = {
  startDate: string;
  endDate: string;
  label: string;
};

const REPORT_TIME_ZONE = "America/Sao_Paulo";

export function parseOrderReportPeriod(
  value: string | string[] | undefined,
): OrderReportPeriod {
  const normalized = Array.isArray(value) ? value[0] : value;
  return ORDER_REPORT_PERIODS.includes(normalized as OrderReportPeriod)
    ? (normalized as OrderReportPeriod)
    : "day";
}

export function getOrderReportDateRange(
  period: OrderReportPeriod,
  now = new Date(),
): OrderReportDateRange {
  const localDate = getLocalCalendarDate(now);
  const anchor = new Date(
    Date.UTC(localDate.year, localDate.month - 1, localDate.day),
  );

  if (period === "week") {
    const mondayOffset = (anchor.getUTCDay() + 6) % 7;
    const start = addUtcDays(anchor, -mondayOffset);
    const end = addUtcDays(start, 7);
    return {
      startDate: toIsoCalendarDate(start),
      endDate: toIsoCalendarDate(end),
      label: `Semana de ${formatShortDate(start)} a ${formatShortDate(addUtcDays(end, -1))}`,
    };
  }

  if (period === "month") {
    const start = new Date(
      Date.UTC(localDate.year, localDate.month - 1, 1),
    );
    const end = new Date(Date.UTC(localDate.year, localDate.month, 1));
    return {
      startDate: toIsoCalendarDate(start),
      endDate: toIsoCalendarDate(end),
      label: capitalize(
        new Intl.DateTimeFormat("pt-BR", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(start),
      ),
    };
  }

  return {
    startDate: toIsoCalendarDate(anchor),
    endDate: toIsoCalendarDate(addUtcDays(anchor, 1)),
    label: `Hoje, ${formatLongDate(anchor)}`,
  };
}

function getLocalCalendarDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: values.year,
    month: values.month,
    day: values.day,
  };
}

function addUtcDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function toIsoCalendarDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
