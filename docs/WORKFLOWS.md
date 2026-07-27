# Fluxos

## Cliente

Cardápio → produto → carrinho → identificação → entrega/retirada → horário →
pagamento → revisão → confirmação → sucesso → acompanhamento.

Na confirmação, o servidor reconsulta produto, menu, área, capacidade e
pagamento, recalcula valores e grava tudo de forma atômica.

## Administração

Novo pedido → conferência → confirmação → preparação → entrega/retirada →
conclusão.

Cada mudança grava status anterior, novo status, horário e administrador.

## Fundação entregue

Atualmente estão ativos: leitura do storefront, bootstrap do catálogo,
autenticação e autorização da rota administrativa. Os demais passos continuam
explicitamente pendentes no roadmap.
