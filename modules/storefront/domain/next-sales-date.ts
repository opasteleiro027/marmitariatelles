const WEEKDAY_SUNDAY = 0;

export function nextSundayLabel(reference = new Date()): string {
  const candidate = new Date(reference);
  const daysUntilSunday = (7 - candidate.getDay()) % 7 || 7;
  candidate.setDate(candidate.getDate() + daysUntilSunday);

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
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
