# Domingo na Mesa

Aplicação web mobile-first para vender marmitas aos domingos, substituir o
registro informal de pedidos por WhatsApp e dar ao comerciante uma operação
rastreável.

## Estado atual

A Fase 1 (Fundação) está em desenvolvimento. A versão atual já contém:

- página pública responsiva com status da venda e catálogo persistente;
- painel administrativo com autenticação e autorização por allowlist;
- esquema relacional para catálogo, clientes, pedidos, pagamentos e operação;
- dados iniciais de demonstração carregados de forma idempotente;
- regras monetárias puras e testes automatizados;
- documentação e mapas arquiteturais.

Carrinho, checkout, confirmação atômica e gestão administrativa ainda não estão
concluídos. Consulte `ROADMAP.md`.

## Tecnologias

- TypeScript e React 19;
- App Router compatível com Next.js por meio do Vinext;
- Tailwind CSS 4 e CSS Modules;
- Cloudflare D1 com Drizzle ORM;
- Cloudflare Workers / OpenAI Sites;
- Node.js Test Runner.

O briefing recomendava Supabase e Vercel para um projeto sem stack. O ambiente
de entrega atual fornece D1, autenticação gerenciada e Workers, então a Fase 1
usa esses recursos para manter a aplicação executável e publicável. O domínio
permanece separado da infraestrutura para permitir um futuro adaptador Supabase
sem reescrever as regras de negócio. Supabase não está configurado nesta fase.

## Instalação e desenvolvimento

Requisito: Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env.local` e substitua o e-mail de exemplo. Nunca
versione credenciais reais.

## Banco e migrations

O binding lógico `DB` está declarado em `.openai/hosting.json`.

```bash
npm run db:generate
```

O schema fonte fica em módulos de negócio e é reexportado por `db/schema.ts`.
As migrations geradas ficam em `drizzle/`. A página pública cria apenas o
subconjunto mínimo da fundação de forma idempotente; as demais tabelas entram
pela migration.

## Autenticação e primeiro administrador

O painel `/admin` usa a identidade gerenciada pela plataforma e uma segunda
verificação de autorização no servidor.

1. Defina `ADMIN_EMAILS` com um ou mais e-mails separados por vírgula.
2. Publique a aplicação.
3. Entre com um dos e-mails autorizados.

Sem `ADMIN_EMAILS`, o acesso é negado por padrão. Não existem credenciais fixas
de produção.

## Verificações

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Estrutura e publicação

Veja `PROJECT_STRUCTURE.md` para o mapa de módulos e `docs/ARCHITECTURE.md` para
as decisões. A publicação é feita pelo fluxo de Sites após testes e build.

## Dados de demonstração

O bootstrap idempotente adiciona três categorias e seis produtos do briefing.
Eles são adequados para desenvolvimento e devem ser substituídos no painel
administrativo antes da operação real.

## Supabase

Não há integração Supabase ativa. As variáveis comentadas de `.env.example`
reservam o contrato esperado para um futuro adaptador. Quando essa decisão for
tomada, será necessário implementar repositórios, migrations, políticas RLS,
storage e autenticação Supabase; inserir apenas chaves não habilita o recurso.

## Escopo futuro

Pagamento on-line, WhatsApp oficial, aplicativo nativo, fidelidade, rastreamento
de entregador e múltiplas lojas não pertencem ao MVP.
