export function parsePriceToCents(value: string): number {
  const normalized = value
    .trim()
    .replace(/^R\$\s*/i, "")
    .replace(/\s/g, "");
  const decimal =
    normalized.includes(",") && normalized.includes(".")
      ? normalized.replace(/\./g, "").replace(",", ".")
      : normalized.replace(",", ".");
  const amount = Number(decimal);
  const cents = Math.round(amount * 100);
  if (!Number.isFinite(amount) || cents < 0) {
    throw new Error("Informe um preço válido.");
  }
  return cents;
}
