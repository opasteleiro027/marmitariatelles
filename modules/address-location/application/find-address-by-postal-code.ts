import { lookupPostalCode } from "../infrastructure/via-cep-client";

export async function findAddressByPostalCode(postalCode: string) {
  return lookupPostalCode(postalCode);
}
