import type { LocatedAddress } from "../domain/address-location.types";
import { normalizePostalCode } from "../domain/normalize-location-name";

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | "true";
};

export class PostalCodeLookupError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
    this.name = "PostalCodeLookupError";
  }
}

export async function lookupPostalCode(postalCodeValue: string): Promise<LocatedAddress> {
  const postalCode = normalizePostalCode(postalCodeValue);
  if (postalCode.length !== 8) {
    throw new PostalCodeLookupError("Informe um CEP com 8 números.", 400);
  }

  const response = await fetch(`https://viacep.com.br/ws/${postalCode}/json/`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8_000),
    next: { revalidate: 86_400 },
  });
  if (!response.ok) {
    throw new PostalCodeLookupError("Não foi possível consultar o CEP.");
  }
  const result = (await response.json()) as ViaCepResponse;
  if (result.erro === true || result.erro === "true") {
    throw new PostalCodeLookupError("CEP não encontrado.", 404);
  }
  return {
    postalCode: normalizePostalCode(result.cep ?? postalCode),
    street: result.logradouro?.trim() ?? "",
    number: "",
    neighborhood: result.bairro?.trim() ?? "",
    city: result.localidade?.trim() ?? "",
    state: result.uf?.trim().toUpperCase() ?? "",
    approximate: false,
    attribution: null,
  };
}
