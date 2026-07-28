export type AddressAreaResult = {
  kind: "success" | "error";
  message: string;
};

export function describeAddressAreaResult(
  neighborhood: string,
  matchedArea: { formattedFee: string } | null,
  source: "gps" | "postal-code",
): AddressAreaResult {
  if (!neighborhood) {
    return {
      kind: "error",
      message:
        source === "postal-code"
          ? "CEP encontrado, mas o ViaCEP não informou o bairro. Preencha o campo Bairro manualmente."
          : "Endereço aproximado encontrado, mas o bairro não foi identificado. Preencha-o manualmente.",
    };
  }

  if (!matchedArea) {
    return {
      kind: "error",
      message: `Bairro "${neighborhood}" preenchido, mas ele ainda não está em uma área de entrega cadastrada.`,
    };
  }

  return {
    kind: "success",
    message: `Bairro preenchido automaticamente: ${neighborhood}. Taxa de ${matchedArea.formattedFee}.`,
  };
}
