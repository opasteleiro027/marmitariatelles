import { NextResponse } from "next/server";
import { findAddressByPostalCode } from "@/modules/address-location/application/find-address-by-postal-code";
import { PostalCodeLookupError } from "@/modules/address-location/infrastructure/via-cep-client";

export async function GET(
  _request: Request,
  context: { params: Promise<{ postalCode: string }> },
) {
  try {
    const { postalCode } = await context.params;
    return NextResponse.json(await findAddressByPostalCode(postalCode));
  } catch (reason) {
    const status = reason instanceof PostalCodeLookupError ? reason.status : 502;
    const message =
      reason instanceof PostalCodeLookupError
        ? reason.message
        : "Não foi possível consultar o CEP agora. Tente novamente.";
    if (!(reason instanceof PostalCodeLookupError)) {
      console.error("Falha inesperada ao consultar CEP", reason);
    }
    return NextResponse.json({ error: message }, { status });
  }
}
