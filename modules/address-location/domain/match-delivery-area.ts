import type {
  DeliveryAreaReference,
  LocatedAddress,
} from "./address-location.types";
import { normalizeLocationName } from "./normalize-location-name";

export function findMatchingDeliveryArea<TArea extends DeliveryAreaReference>(
  address: Pick<LocatedAddress, "neighborhood" | "city">,
  areas: TArea[],
): TArea | null {
  const neighborhood = normalizeLocationName(address.neighborhood);
  const city = normalizeLocationName(address.city);
  if (!neighborhood || !city) return null;

  return (
    areas.find(
      (area) =>
        normalizeLocationName(area.neighborhood) === neighborhood &&
        normalizeLocationName(area.city) === city,
    ) ?? null
  );
}

export function addressBelongsToDeliveryArea(
  address: Pick<LocatedAddress, "neighborhood" | "city">,
  area: DeliveryAreaReference,
): boolean {
  return findMatchingDeliveryArea(address, [area]) !== null;
}
