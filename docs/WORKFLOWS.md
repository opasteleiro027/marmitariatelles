# Fluxos

## Cliente

Cardápio → produto → carrinho → identificação → entrega/retirada → horário →
pagamento → revisão → confirmação → sucesso → acompanhamento.

Na confirmação, o servidor reconsulta produto, menu, área, capacidade e
pagamento, recalcula valores e grava tudo de forma atômica.

### Endereço de entrega

Entrega → usar GPS ou informar CEP/manual → sugerir endereço → cliente revisa
número e bairro → associar área cadastrada → servidor confere cidade e bairro →
aplicar taxa.

Na entrega, a primeira faixa operacional disponível é atribuída internamente e
o cliente não precisa escolher horário. Na retirada, o cliente escolhe a faixa
em que pretende buscar o pedido.

Se a permissão de GPS for negada, a localização falhar ou os provedores externos
estiverem indisponíveis, o cliente continua preenchendo todos os campos
manualmente.

## Administração

Novo pedido → conferência → confirmação → preparação → entrega/retirada →
conclusão.

Cada mudança grava status anterior, novo status, horário e administrador.

### Agenda

O painel abre primeiro a agenda de hoje; quando não existe, abre a data futura
mais próxima e, por último, a data passada mais recente. A loja usa a mesma
agenda publicada para exibir data, disponibilidade e faixas. Uma data já
ocupada por outra agenda gera mensagem no formulário, sem erro de página.

## Fundação entregue

Atualmente estão ativos: leitura do storefront, bootstrap do catálogo,
autenticação e autorização da rota administrativa. Os demais passos continuam
explicitamente pendentes no roadmap.
