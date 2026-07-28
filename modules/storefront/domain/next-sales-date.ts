const WEEKDAY_SUNDAY = 0;

export function nextSundayLabel(reference = new Date()): string {
  const localDateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(reference);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(localDateParts.find((item) => item.type === type)?.value);
  const candidate = new Date(
    Date.UTC(part("year"), part("month") - 1, part("day"), 12),
  );
  const daysUntilSunday = (7 - candidate.getUTCDay()) % 7 || 7;
  candidate.setUTCDate(candidate.getUTCDate() + daysUntilSunday);

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(candidate);
}

export function isSunday(reference = new Date()): boolean {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
  }).format(reference);
  return weekday === "Sun" || reference.getDay() === WEEKDAY_SUNDAY;
}
