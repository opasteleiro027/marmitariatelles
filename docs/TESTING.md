# Estratégia de testes

## Unidade

Regras monetárias, janelas, taxas, troco, autorização, localização, normalização
de CEP e correspondência de área.

## Integração

Repositórios PostgreSQL, migrations, confirmação atômica, idempotência, estoque,
capacidade e nova execução do seed após edição da data do menu.
Também validar conflito entre duas agendas da mesma data e seleção prioritária
da agenda de hoje.

## Fluxo

Pedido completo do cliente e operação administrativa, incluindo rotas
protegidas, acompanhamento por token, permissão de GPS negada, CEP indisponível
e confirmação manual do endereço.

## Verificação por etapa

Executar typecheck, lint, testes e build. Uma etapa não avança com falhas reais
na etapa anterior.
