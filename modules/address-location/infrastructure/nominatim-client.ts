import type {
  LocatedAddress,
  NominatimAddress,
} from "../domain/address-location.types";
import { mapNominatimAddress } from "../domain/map-nominatim-address";

type NominatimResponse = {
  address?: NominatimAddress;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1_000;
const resultCache = new Map<string, { expiresAt: number; address: LocatedAddress }>();
let lastRequestAt = 0;
let requestQueue = Promise.resolve();

export class ReverseGeocodingError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
    this.name = "ReverseGeocodingError";
  }
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<LocatedAddress> {
  const cacheKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  const cached = resultCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.address;

  const result = await enqueueRequest(() =>
    requestProvider(latitude, longitude),
  );
  if (resultCache.size >= 500) {
    const oldestKey = resultCache.keys().next().value;
    if (oldestKey) resultCache.delete(oldestKey);
  }
  resultCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    address: result,
  });
  return result;
}

async function enqueueRequest<T>(operation: () => Promise<T>): Promise<T> {
  const scheduled = requestQueue.then(async () => {
    const waitFor = Math.max(0, 1_000 - (Date.now() - lastRequestAt));
    if (waitFor) await new Promise((resolve) => setTimeout(resolve, waitFor));
    lastRequestAt = Date.now();
    return operation();
  });
  requestQueue = scheduled.then(
    () => undefined,
    () => undefined,
  );
  return scheduled;
}

async function requestProvider(
  latitude: number,
  longitude: number,
): Promise<LocatedAddress> {
  const baseUrl =
    process.env.REVERSE_GEOCODING_BASE_URL ??
    "https://nominatim.openstreetmap.org";
  const url = new URL("/reverse", baseUrl);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("layer", "address");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));

  const appUrl = process.env.APP_URL ?? "https://marmitariatelles-production.up.railway.app";
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        accept: "application/json",
        "accept-language": "pt-BR",
        "user-agent": `MarmitariaTelles/0.4 (+${appUrl}; contact: abraaofcjunior@gmail.com)`,
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ReverseGeocodingError(
      "O serviço de localização está indisponível agora. Preencha o endereço manualmente ou tente novamente.",
    );
  }
  if (!response.ok) {
    throw new ReverseGeocodingError(
      "Não foi possível converter a localização em endereço.",
    );
  }
  let result: NominatimResponse;
  try {
    result = (await response.json()) as NominatimResponse;
  } catch {
    throw new ReverseGeocodingError(
      "O serviço de localização retornou uma resposta inválida. Preencha o endereço manualmente.",
    );
  }
  if (!result.address) {
    throw new ReverseGeocodingError(
      "Não encontramos um endereço próximo desta localização.",
      404,
    );
  }
  return mapNominatimAddress(result.address);
}
