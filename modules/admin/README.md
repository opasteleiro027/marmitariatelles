# Administration

## Purpose

Protected operational surface for the merchant.

## Responsibilities

- Require a server-verified identity.
- Authorize only e-mails listed in `ADMIN_EMAILS`.
- Present operational state without exposing customer data.
- Host future order, catalog, schedule and configuration workflows.

## Security boundary

Authentication identifies a user; the e-mail allowlist authorizes the user.
Both checks happen on the server. Missing configuration denies access.
