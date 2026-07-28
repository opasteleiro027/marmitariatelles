# Administration

## Purpose

Protected operational surface for the merchant.

## Responsibilities

- Require a server-verified identity.
- Authorize only e-mails listed in `ADMIN_EMAILS`.
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

Authentication identifies a user; the e-mail allowlist authorizes the user.
Both checks happen on the server. Missing configuration denies access.
