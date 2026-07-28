# Estrutura do projeto

| Caminho | Responsabilidade | Dependências diretas |
| --- | --- | --- |
| `app/` | Rotas Next.js, APIs e composição | módulos de UI/aplicação |
| `db/` | conexão PostgreSQL, schema, migration e seed | módulos com tabelas |
| `drizzle-postgres/` | migration SQL versionada | PostgreSQL |
| `modules/admin-auth/` | credenciais, token e sessão administrativa | Node crypto, Next cookies |
| `modules/address-location/` | GPS opcional, CEP, geocodificação e correspondência de área | Geolocation API, ViaCEP, Nominatim |
| `modules/admin/` | composição visual do painel | módulos administrativos |
| `modules/catalog/` | categorias, produtos, adicionais e cardápios | PostgreSQL |
| `modules/establishment/` | loja, áreas e pagamentos | PostgreSQL |
| `modules/identity/` | administradores, clientes e endereços | PostgreSQL |
| `modules/ordering/` | checkout, totais, pedidos, status e tracking | demais domínios |
| `modules/sales-calendar/` | domingo, janela e faixas de atendimento | catálogo, estabelecimento |
| `modules/storefront/` | snapshot e experiência pública | catálogo, ordering |
| `modules/operational-monitoring/` | saúde da aplicação e banco | PostgreSQL |
| `tests/` | testes automatizados de domínio e segurança | módulos de domínio |
| `docs/` | arquitetura, dados, fluxos e testes | projeto completo |
| `build/` | empacotamento/start standalone | Next.js |
| `railway.json` | contrato de implantação | Railway |

Peças significativas de interface possuem `README.md`, `DEPENDENCIES.md` e
`TESTS.md` na própria pasta. Os READMEs dos módulos registram entradas, saídas e
limites de responsabilidade.
