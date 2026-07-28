import type {
  LocatedAddress,
  NominatimAddress,
} from "./address-location.types";
import { normalizePostalCode } from "./normalize-location-name";

const BRAZILIAN_STATES = new Map([
  ["acre", "AC"],
  ["alagoas", "AL"],
  ["amapa", "AP"],
  ["amazonas", "AM"],
  ["bahia", "BA"],
  ["ceara", "CE"],
  ["distrito federal", "DF"],
  ["espirito santo", "ES"],
  ["goias", "GO"],
  ["maranhao", "MA"],
  ["mato grosso", "MT"],
  ["mato grosso do sul", "MS"],
  ["minas gerais", "MG"],
  ["para", "PA"],
  ["paraiba", "PB"],
  ["parana", "PR"],
  ["pernambuco", "PE"],
  ["piaui", "PI"],
  ["rio de janeiro", "RJ"],
  ["rio grande do norte", "RN"],
  ["rio grande do sul", "RS"],
  ["rondonia", "RO"],
  ["roraima", "RR"],
  ["santa catarina", "SC"],
  ["sao paulo", "SP"],
  ["sergipe", "SE"],
  ["tocantins", "TO"],
]);

export function mapNominatimAddress(address: NominatimAddress): LocatedAddress {
  if (address.country_code && address.country_code.toLowerCase() !== "br") {
    throw new Error("A localização encontrada não fica no Brasil.");
  }
  return {
    postalCode: normalizePostalCode(address.postcode ?? ""),
    street: address.road ?? address.pedestrian ?? address.footway ?? "",
    number: address.house_number ?? "",
    neighborhood:
      address.suburb ??
      address.neighbourhood ??
      address.quarter ??
      address.city_district ??
      "",
    city:
      address.city ??
      address.town ??
      address.municipality ??
      address.village ??
      "",
    state: stateCode(address),
    approximate: true,
    attribution: "Endereço aproximado por OpenStreetMap",
  };
}

function stateCode(address: NominatimAddress): string {
  const isoCode = address["ISO3166-2-lvl4"]?.split("-").at(-1);
  if (isoCode?.length === 2) return isoCode.toUpperCase();
  const normalized = (address.state ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR");
  return BRAZILIAN_STATES.get(normalized) ?? "";
}
