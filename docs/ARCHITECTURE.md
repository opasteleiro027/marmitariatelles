# Arquitetura

## Direção

Monólito modular por domínio, compilado como uma aplicação Next.js standalone.
Essa forma mantém uma implantação simples no Railway sem misturar regras de
negócio, apresentação e persistência.

## Módulos e dependências

- `identity`, `catalog` e `establishment` possuem as entidades base;
- `establishment` controla a disponibilidade pelo único estado ligado/desligado;
- `ordering` depende das entidades anteriores e é dono da confirmação;
- `storefront` expõe somente o snapshot público;
- `admin-auth` protege o painel;
- `admin` compõe shell, navegação, cabeçalhos e visão geral, sem possuir regras
  de catálogo, pedido ou estabelecimento;
- `operational-monitoring` fornece o health check.
- `address-location` isola GPS, CEP, geocodificação reversa e correspondência
  entre o endereço confirmado e as áreas de entrega.

Dependências circulares e arquivos genéricos de descarte não são permitidos.

## Persistência

PostgreSQL é a fonte de verdade. Drizzle descreve o schema e gera migrations.
As operações concorrentes do checkout usam uma transação PostgreSQL, locks de
linha e lock consultivo por chave de idempotência.

Estado transitório do carrinho pode ficar em `localStorage`. Pedido, preço,
estoque, taxas, pagamento e status sempre ficam no servidor.

O cardápio e as faixas continuam relacionados internamente, mas data, janela e
contadores acumulados não controlam a abertura da loja. O
campo `orders_paused` é a única autoridade operacional exposta ao administrador.

## Navegação administrativa

As páginas do painel pertencem ao grupo autenticado `app/admin/(panel)`. O
layout valida a sessão uma vez e mantém a estrutura comum. Cada rota importa
somente a consulta e o componente do próprio domínio, evitando que abrir
Cardápio também carregue pedidos, bairros e configurações.

Os destinos são URLs reais e não âncoras. Áreas de entrega e configurações usam
consultas e componentes separados, embora continuem no domínio
`establishment`.

## Segurança

- sessão administrativa `httpOnly`, assinada por HMAC e com expiração;
- e-mail autorizado por allowlist e senha vinda do ambiente;
- rotas e Server Actions administrativas validam a sessão;
- preços e totais são recalculados no servidor;
- produtos, faixa e área são bloqueados durante a confirmação;
- pedido duplicado é evitado com chave de idempotência;
- acompanhamento usa token não sequencial e armazena apenas seu hash;
- número amigável não concede acesso ao pedido;
- cancelamento restaura estoque uma única vez.
- GPS só é solicitado após ação explícita, coordenadas não são persistidas e o
  endereço permanece editável;
- a área escolhida é conferida no servidor contra cidade e bairro informados.

## Integrações de endereço

O navegador fornece coordenadas somente com permissão e HTTPS. O servidor
consulta BrasilAPI com fallback para ViaCEP por CEP e usa um adaptador de
geocodificação reversa configurável.
O adaptador padrão do Nominatim serializa chamadas, limita a uma por segundo,
mantém cache em memória, identifica a aplicação e retorna atribuição visível.
Falhas externas nunca removem a alternativa de preenchimento manual.

## Implantação

O GitHub hospeda o código e aciona o serviço Railway. O PostgreSQL é um serviço
do mesmo projeto Railway. `railway.json` declara build, pre-deploy migration,
start e health check. A aplicação não depende de Supabase, D1 ou Sites.
