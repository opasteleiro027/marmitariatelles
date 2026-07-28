"use client";

import type { LocatedAddress } from "../domain/address-location.types";
import { normalizePostalCode } from "../domain/normalize-location-name";

type ErrorResponse = { error?: string };

export async function requestAddressByPostalCode(
  postalCodeValue: string,
): Promise<LocatedAddress> {
  const postalCode = normalizePostalCode(postalCodeValue);
  if (postalCode.length !== 8) {
    throw new Error("Informe um CEP com 8 números.");
  }
  return request(`/api/address/postal-code/${postalCode}`);
}

export async function requestAddressByCoordinates(
  latitude: number,
  longitude: number,
): Promise<LocatedAddress> {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });
  return request(`/api/address/reverse?${query}`);
}

async function request(url: string): Promise<LocatedAddress> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { accept: "application/json" },
    });
  } catch {
    throw new Error(
      "Não foi possível conectar ao serviço de endereço. Preencha os campos manualmente ou tente novamente.",
    );
  }

  let result: LocatedAddress & ErrorResponse;
  try {
    result = (await response.json()) as LocatedAddress & ErrorResponse;
  } catch {
    throw new Error(
      "O serviço de endereço está temporariamente indisponível. Preencha os campos manualmente.",
    );
  }
  if (!response.ok) {
    throw new Error(result.error ?? "Não foi possível localizar o endereço.");
  }
  return result;
}
