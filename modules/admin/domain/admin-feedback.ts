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
  "Produto não encontrado.",
  "Tamanho não encontrado.",
  "Ingrediente não encontrado.",
  "Esta mudança de status não é permitida.",
  "Digite a confirmação exatamente como solicitado.",
  "Abra o caixa antes de registrar pagamentos ou movimentações.",
  "Informe o motivo da movimentação",
  "Informe um valor válido para o caixa.",
  "Informe um valor válido.",
  "A observação deve ter no máximo 500 caracteres.",
  "Administrador ativo não encontrado.",
  "A forma de pagamento selecionada não está disponível.",
  "Selecione o pedido e a forma de pagamento.",
  "Este pedido já teve o pagamento processado.",
  "Pedido não encontrado ou cancelado.",
  "Comanda ou forma de pagamento inválida.",
  "Comanda inválida.",
  "Esta comanda já foi encerrada.",
  "Marque o pedido como servido antes de fechar a comanda.",
  "Aceite o pedido antes de adicionar novos consumos.",
  "Esta comanda já foi paga ou cancelada.",
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
