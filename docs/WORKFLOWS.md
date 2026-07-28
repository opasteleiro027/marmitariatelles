# Fluxos

## Cliente

Cardápio → produto → carrinho → identificação → entrega/retirada → horário →
pagamento → revisão → confirmação → sucesso → acompanhamento.

Na confirmação, o servidor reconsulta produto, menu, área e
pagamento, recalcula valores e grava tudo de forma atômica.

### Endereço de entrega

Entrega → usar GPS ou informar CEP → preencher bairro → identificar
automaticamente área e taxa cadastradas → cliente revisa número e endereço →
servidor confere cidade e bairro → aplicar taxa.

Não há área padrão nem seletor manual de taxa. Se o CEP não retornar bairro, o
campo continua editável; se cidade e bairro não corresponderem a uma área
cadastrada, a confirmação permanece indisponível.

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

### Novos pedidos no painel

Enquanto o painel está aberto e visível, uma consulta protegida verifica
alterações a cada cinco segundos. Um novo pedido atualiza lista e métricas; uma
mudança de status também atualiza os dados, mas não dispara o alerta de novo
pedido.

O som inicia habilitado por padrão. Na primeira interação com o painel, o
navegador libera automaticamente a reprodução; antes disso, a interface informa
que aguarda interação. O administrador pode regular o volume, testar o toque,
silenciar ou reativar o alerta.

### Ligar ou desligar o site

O administrador usa um único botão. **Ligar site** libera imediatamente novos
pedidos; **Desligar site** bloqueia imediatamente produtos, carrinho e
confirmação no servidor. Não existe configuração de data, abertura ou
encerramento no painel.

Cardápio e faixas são mantidos internamente para validar estoque e retirada,
sem interferir no estado ligado/desligado.

## Fundação entregue

Atualmente estão ativos: leitura do storefront, bootstrap do catálogo,
autenticação e autorização da rota administrativa. Os demais passos continuam
explicitamente pendentes no roadmap.
