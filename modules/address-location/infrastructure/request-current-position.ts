"use client";

export function requestCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12_000,
      maximumAge: 60_000,
    });
  });
}

export function locationErrorMessage(reason: unknown): string {
  if (isGeolocationError(reason)) {
    if (reason.code === 1) {
      return "Localização não autorizada. Você pode preencher o endereço manualmente.";
    }
    if (reason.code === 3) {
      return "A localização demorou demais. Tente novamente ou informe o CEP.";
    }
  }
  return reason instanceof Error
    ? reason.message
    : "Não foi possível obter sua localização. Preencha o endereço manualmente.";
}

function isGeolocationError(reason: unknown): reason is { code: number } {
  return (
    typeof reason === "object" &&
    reason !== null &&
    "code" in reason &&
    typeof reason.code === "number"
  );
}
