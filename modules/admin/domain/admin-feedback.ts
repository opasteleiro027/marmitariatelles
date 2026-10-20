export type AdminFeedbackKind = "success" | "error";

const SAFE_ERROR_PREFIXES = [
  "Campo obrigatório:",
  "Preço",
  "Informe um preço válido.",
  "Limite inválido:",
  "Prazo estimado inválido.",
  "Etapa de montagem inválida.",
  "O bairro informado",
  "Configurações do estabelecimento ausentes.",
  "A categoria Monte seu pote não foi encontrada.",
  "Atualização de pedido inválida.",
  "Pedido não encontrado.",
  "Esta mudança de status não é permitida.",
  "Digite a confirmação exatamente como solicitado.",
] as const;

export function buildAdminFeedbackUrl(
  targetPath: string,
  kind: AdminFeedbackKind,
  message: string,
) {
  const parameters = new URLSearchParams({
    feedback: kind,
    feedbackMessage: message,
  });
  return `${targetPath}${targetPath.includes("?") ? "&" : "?"}${parameters}`;
}

export function adminActionErrorMessage(reason: unknown) {
  if (!(reason instanceof Error)) {
    return "Não foi possível concluir a alteração. Tente novamente.";
  }

  const message = reason.message.trim();
  if (SAFE_ERROR_PREFIXES.some((prefix) => message.startsWith(prefix))) {
    return message;
  }
  if (/duplicate key|unique constraint|já existe/i.test(message)) {
    return "Já existe um registro com esses dados.";
  }
  if (/database|postgres|connection|econn|timeout/i.test(message)) {
    return "Não foi possível acessar o banco de dados. Tente novamente.";
  }
  return "Ocorreu um erro inesperado ao salvar. Tente novamente.";
}
