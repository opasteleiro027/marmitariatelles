# Marmitaria Telles

Aplicação web mobile-first para receber e administrar pedidos de marmitas aos
domingos. O pedido é gravado no banco antes de qualquer contato por WhatsApp.

## Produção

- Aplicação: https://marmitariatelles-production.up.railway.app
- Código-fonte: https://github.com/opasteleiro027/marmitariatelles

## O que já funciona

- loja pública responsiva, cardápio e carrinho persistente no dispositivo;
- checkout para retirada ou entrega, horário, pagamento e troco;
- endereço por GPS opcional, busca automática de CEP e conferência de área;
- confirmação transacional com preço recalculado no servidor, estoque,
  capacidade, idempotência e número amigável;
- acompanhamento privado por token seguro;
- login administrativo com sessão assinada;
- dashboard com pedidos e faturamento;
- mudança de status com histórico e devolução de estoque no cancelamento;
- criação e edição de produtos, esgotado, bairros, taxas, pedido mínimo,
  agenda do domingo, faixas de horário e dados públicos do negócio;
- health check para Railway em `/api/health`.

Os seis produtos e preços iniciais são dados de demonstração e devem ser
revisados no painel antes da operação real. Nenhuma área de entrega é presumida:
até o administrador cadastrar bairros e taxas, apenas retirada fica disponível.

## Dados do estabelecimento

- Nome: Marmitaria Telles
- Administrador: `abraaofcjunior@gmail.com`
- WhatsApp: `+55 27 98844-6510`
- Endereço: Av. Bartolomeu de Las Casa, nº 16, Quadra 17, Cidade Continental,
  Setor América, Serra - ES

## Tecnologias

- Next.js 16 App Router, React 19 e TypeScript;
- CSS Modules e Tailwind CSS 4;
- PostgreSQL no Railway;
- Drizzle ORM para schema e migrations;
- `postgres.js` para consultas e transações;
- Node.js Test Runner.

Não há Supabase. O repositório é preparado para GitHub e a aplicação para
Railway, seguindo o mesmo modelo operacional do projeto Clube do Pasteleiro.

## Instalação local

Requisito: Node.js `>=22.13.0` e PostgreSQL.

```bash
npm install
copy .env.example .env.local
npm run db:migrate
npm run dev
```

Acesse `http://localhost:3000`. O painel fica em `/admin`.

## Variáveis de ambiente

```dotenv
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marmitaria_telles
ADMIN_EMAILS=abraaofcjunior@gmail.com
ADMIN_PASSWORD=defina-uma-senha-forte
SESSION_SECRET=gere-um-segredo-longo-e-aleatorio
ORDER_TOKEN_SECRET=opcional-separado-do-segredo-da-sessao
APP_URL=http://localhost:3000
REVERSE_GEOCODING_BASE_URL=https://nominatim.openstreetmap.org
```

`ORDER_TOKEN_SECRET` é opcional; quando ausente, `SESSION_SECRET` também assina
os tokens de acompanhamento. Nunca versionar valores reais.

O GPS exige HTTPS e permissão explícita do cliente. A geocodificação reversa usa
o endpoint configurado em `REVERSE_GEOCODING_BASE_URL`; o padrão público do
Nominatim deve ser usado apenas em volume moderado, com atribuição e limite de
uma requisição por segundo. O preenchimento manual sempre permanece disponível.

## Banco e dados iniciais

O schema fonte é reexportado por `db/schema.ts`. A migration PostgreSQL fica em
`drizzle-postgres/`.

```bash
npm run db:generate
npm run db:migrate
```

`db:migrate` aplica migrations pendentes e executa um seed idempotente com os
dados reais do estabelecimento, categorias, catálogo de demonstração, formas de
pagamento, próximo domingo e três faixas de horário.

## Verificações

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Publicação no Railway

O ambiente de produção está conectado à branch `main` no GitHub e usa
PostgreSQL persistente no Railway. O arquivo `railway.json` executa build,
migration antes do deploy, start do standalone e health check.

## Estrutura e decisões

- `PROJECT_STRUCTURE.md`: mapa de módulos e integrações.
- `docs/ARCHITECTURE.md`: limites e decisões arquiteturais.
- `docs/DATA_MODEL.md`: entidades e relacionamentos.
- `docs/WORKFLOWS.md`: fluxos críticos.
- `ROADMAP.md`: concluído e pendente.

## Fora desta entrega

Complementos configuráveis, upload de fotos, cupom no checkout, filtros
avançados, comanda, relatórios, Pix/QR Code e notificações automáticas continuam
no roadmap. Pagamento on-line, WhatsApp oficial, fidelidade e múltiplas lojas
permanecem fora do MVP inicial.
