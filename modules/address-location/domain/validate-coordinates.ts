export class CoordinateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CoordinateError";
  }
}

export function validateCoordinates(latitudeValue: unknown, longitudeValue: unknown) {
  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new CoordinateError("Coordenadas de localização inválidas.");
  }
  return { latitude, longitude };
}
