# Estratégia de testes

## Unidade

Regras monetárias, liga/desliga, taxas, troco, autorização, localização,
normalização de CEP e correspondência de área.

## Integração

Repositórios PostgreSQL, migrations, confirmação atômica, idempotência, estoque,
cardápio operacional estável e nova execução idempotente do seed.

## Fluxo

Pedido completo do cliente e operação administrativa, incluindo ligar/desligar,
rotas
protegidas, acompanhamento por token, permissão de GPS negada, CEP indisponível
e confirmação manual do endereço.

## Verificação por etapa

Executar typecheck, lint, testes e build. Uma etapa não avança com falhas reais
na etapa anterior.
