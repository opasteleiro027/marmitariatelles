import { validateCoordinates } from "../domain/validate-coordinates";
import { reverseGeocode } from "../infrastructure/nominatim-client";

export async function findAddressByCoordinates(
  latitudeValue: unknown,
  longitudeValue: unknown,
) {
  const { latitude, longitude } = validateCoordinates(
    latitudeValue,
    longitudeValue,
  );
  return reverseGeocode(latitude, longitude);
}
