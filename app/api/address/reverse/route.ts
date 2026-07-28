import { NextResponse } from "next/server";
import { findAddressByCoordinates } from "@/modules/address-location/application/find-address-by-coordinates";
import { CoordinateError } from "@/modules/address-location/domain/validate-coordinates";
import { ReverseGeocodingError } from "@/modules/address-location/infrastructure/nominatim-client";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const result = await findAddressByCoordinates(
      url.searchParams.get("latitude"),
      url.searchParams.get("longitude"),
    );
    return NextResponse.json(result);
  } catch (reason) {
    const status =
      reason instanceof CoordinateError
        ? 400
        : reason instanceof ReverseGeocodingError
          ? reason.status
          : 502;
    const message =
      reason instanceof Error
        ? reason.message
        : "Não foi possível localizar o endereço.";
    return NextResponse.json({ error: message }, { status });
  }
}
