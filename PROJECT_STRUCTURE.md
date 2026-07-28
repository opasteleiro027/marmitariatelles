# Estrutura do projeto

| Caminho | Responsabilidade | Dependências diretas |
| --- | --- | --- |
| `app/` | Rotas Next.js, APIs e composição | módulos de UI/aplicação |
| `db/` | conexão PostgreSQL, schema, migration e seed | módulos com tabelas |
| `drizzle-postgres/` | migration SQL versionada | PostgreSQL |
| `modules/admin-auth/` | credenciais, token e sessão administrativa | Node crypto, Next cookies |
| `modules/address-location/` | GPS opcional, CEP, geocodificação e correspondência de área | Geolocation API, BrasilAPI, ViaCEP, Nominatim |
| `modules/admin/` | shell, navegação, cabeçalhos e visão geral do painel | módulos administrativos |
| `modules/catalog/` | categorias, produtos, adicionais e cardápios | PostgreSQL |
| `modules/establishment/` | loja, liga/desliga, áreas e pagamentos | PostgreSQL |
| `modules/identity/` | administradores, clientes e endereços | PostgreSQL |
| `modules/ordering/` | checkout, totais, pedidos, status e tracking | demais domínios |
| `modules/storefront/` | snapshot e experiência pública | catálogo, ordering |
| `modules/operational-monitoring/` | saúde da aplicação e banco | PostgreSQL |
| `tests/` | testes automatizados de domínio e segurança | módulos de domínio |
| `docs/` | arquitetura, dados, fluxos e testes | projeto completo |
| `build/` | empacotamento/start standalone | Next.js |
| `railway.json` | contrato de implantação | Railway |

Peças significativas de interface possuem `README.md`, `DEPENDENCIES.md` e
`TESTS.md` na própria pasta. Os READMEs dos módulos registram entradas, saídas e
limites de responsabilidade.

## Telas administrativas

| Rota | Peça principal | Dados consultados |
| --- | --- | --- |
| `/admin` | `admin-overview` | métricas, produtos ativos e estado do site |
| `/admin/pedidos` | `admin-order-list` | pedidos e métricas |
| `/admin/cardapio` | `catalog-management` | categorias e produtos |
| `/admin/areas-entrega` | `delivery-area-management` | bairros e taxas |
| `/admin/configuracoes` | `business-settings-management` | dados do estabelecimento |

`app/admin/(panel)/layout.tsx` protege e compõe essas rotas com `admin-shell`.
`admin-navigation` é responsável somente pelos destinos e pelo estado ativo.
`admin-order-monitor` permanece no layout e acompanha novos pedidos em qualquer
uma das telas.
