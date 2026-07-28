# Arquitetura

## Direção

Monólito modular por domínio, compilado como uma aplicação Next.js standalone.
Essa forma mantém uma implantação simples no Railway sem misturar regras de
negócio, apresentação e persistência.

## Módulos e dependências

- `identity`, `catalog` e `establishment` possuem as entidades base;
- `sales-calendar` controla a agenda operacional;
- `ordering` depende das entidades anteriores e é dono da confirmação;
- `storefront` expõe somente o snapshot público;
- `admin-auth` protege o painel;
- `admin` compõe as interfaces, sem possuir regras de catálogo ou pedido;
- `operational-monitoring` fornece o health check.

Dependências circulares e arquivos genéricos de descarte não são permitidos.

## Persistência

PostgreSQL é a fonte de verdade. Drizzle descreve o schema e gera migrations.
As operações concorrentes do checkout usam uma transação PostgreSQL, locks de
linha e lock consultivo por chave de idempotência.

Estado transitório do carrinho pode ficar em `localStorage`. Pedido, preço,
estoque, capacidade, taxas, pagamento e status sempre ficam no servidor.

## Segurança

- sessão administrativa `httpOnly`, assinada por HMAC e com expiração;
- e-mail autorizado por allowlist e senha vinda do ambiente;
- rotas e Server Actions administrativas validam a sessão;
- preços e totais são recalculados no servidor;
- produtos, faixa e área são bloqueados durante a confirmação;
- pedido duplicado é evitado com chave de idempotência;
- acompanhamento usa token não sequencial e armazena apenas seu hash;
- número amigável não concede acesso ao pedido;
- cancelamento restaura estoque e reserva uma única vez.

## Implantação

O GitHub hospeda o código e aciona o serviço Railway. O PostgreSQL é um serviço
do mesmo projeto Railway. `railway.json` declara build, pre-deploy migration,
start e health check. A aplicação não depende de Supabase, D1 ou Sites.
