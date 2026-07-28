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

type BrasilApiResponse = {
  cep?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
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

  let foundNotFoundResponse = false;
  for (const provider of [lookupBrasilApi, lookupViaCep]) {
    try {
      return await provider(postalCode);
    } catch (reason) {
      if (reason instanceof PostalCodeLookupError && reason.status === 404) {
        foundNotFoundResponse = true;
      }
    }
  }

  if (foundNotFoundResponse) {
    throw new PostalCodeLookupError("CEP não encontrado.", 404);
  }
  throw new PostalCodeLookupError(
    "Não foi possível consultar o CEP agora. Preencha o endereço manualmente ou tente novamente.",
  );
}

async function lookupBrasilApi(postalCode: string): Promise<LocatedAddress> {
  const response = await requestProvider(
    `https://brasilapi.com.br/api/cep/v1/${postalCode}`,
  );
  if (response.status === 404) {
    throw new PostalCodeLookupError("CEP não encontrado.", 404);
  }
  if (!response.ok) {
    throw new PostalCodeLookupError("Provedor de CEP indisponível.");
  }
  const result = (await parseJson(response)) as BrasilApiResponse;
  return {
    postalCode: normalizePostalCode(result.cep ?? postalCode),
    street: result.street?.trim() ?? "",
    number: "",
    neighborhood: result.neighborhood?.trim() ?? "",
    city: result.city?.trim() ?? "",
    state: result.state?.trim().toUpperCase() ?? "",
    approximate: false,
    attribution: null,
  };
}

async function lookupViaCep(postalCode: string): Promise<LocatedAddress> {
  const response = await requestProvider(
    `https://viacep.com.br/ws/${postalCode}/json/`,
  );
  if (!response.ok) {
    throw new PostalCodeLookupError("Provedor de CEP indisponível.");
  }
  const result = (await parseJson(response)) as ViaCepResponse;
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

async function requestProvider(url: string): Promise<Response> {
  try {
    return await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 86_400 },
    });
  } catch {
    throw new PostalCodeLookupError("Provedor de CEP indisponível.");
  }
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new PostalCodeLookupError("Resposta inválida do provedor de CEP.");
  }
}
