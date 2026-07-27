# Arquitetura

## Direção

Monólito modular por domínio, entregue como um único Worker. Essa forma reduz
complexidade operacional sem misturar responsabilidades.

## Dependências

`identity`, `catalog` e `establishment` são módulos base. `ordering` pode
referenciá-los. `storefront` lê catálogo e configuração. `admin` orquestra
operações, mas regras continuam nos respectivos domínios.

Não são permitidas dependências circulares.

## Persistência

D1 é a fonte de verdade. Drizzle descreve o schema e gera migrations. Estado de
interface pode ficar no navegador; pedido, preço, capacidade e estoque não.

## Segurança

- identidade gerenciada pela plataforma;
- allowlist de administrador no servidor;
- deny-by-default;
- preços e totais recalculados no servidor;
- tracking futuro por token hash, nunca apenas pelo número amigável;
- confirmação futura com transação e idempotência.

## Portabilidade

Domínio e UI não importam Drizzle. Repositórios de infraestrutura podem ser
substituídos por Supabase/Postgres se a hospedagem migrar.
