# Administration

## Purpose

Protected operational surface for the merchant.

## Responsibilities

- Require a server-verified identity.
- Authorize active administrators from PostgreSQL or the legacy
  `ADMIN_EMAILS` configuration.
- Compose a persistent shell around dedicated administrative routes.
- Highlight the current destination and keep navigation available on mobile.
- Present the operational overview without owning domain business rules.

## Routes

- `/admin`: overview;
- `/admin/pedidos`: orders;
- `/admin/cardapio`: catalog;
- `/admin/areas-entrega`: delivery areas;
- `/admin/configuracoes`: business settings.

## Security boundary

Authentication and authorization happen on the server. Individual PostgreSQL
credentials use salted `scrypt` hashes; the environment allowlist remains only
for backward compatibility. Missing credentials deny access.
