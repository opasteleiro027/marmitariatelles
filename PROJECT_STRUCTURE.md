# Estrutura do projeto

| Caminho | Responsabilidade | Depende de |
| --- | --- | --- |
| `app/` | Rotas e composição App Router | módulos de UI/aplicação |
| `db/` | Ponto único de exportação e conexão D1 | schemas dos módulos |
| `modules/admin/` | Autorização e operação administrativa | storefront, identidade |
| `modules/catalog/` | Produtos, categorias, complementos e menus | Drizzle |
| `modules/establishment/` | Loja, áreas, horários e pagamentos | Drizzle |
| `modules/identity/` | Administradores, clientes e endereços | Drizzle |
| `modules/ordering/` | Pedido, preço, pagamento, histórico e idempotência | demais domínios |
| `modules/storefront/` | Leitura pública e apresentação do cardápio | D1 |
| `tests/` | Verificações automatizadas | módulos de domínio |
| `docs/` | Mapas arquiteturais e operacionais | projeto completo |

Cada módulo possui `README.md`, `DEPENDENCIES.md` e `TESTS.md`.
