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
  const response = await fetch(url, {
    headers: { accept: "application/json" },
  });
  const result = (await response.json()) as LocatedAddress & ErrorResponse;
  if (!response.ok) {
    throw new Error(result.error ?? "Não foi possível localizar o endereço.");
  }
  return result;
}
