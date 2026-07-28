# Storefront

## Purpose

Public, mobile-first surface used by customers to discover the active Sunday
menu and begin an order.

## Responsibilities

- Read a server-authoritative storefront snapshot.
- Present opening status, delivery information and available products.
- Keep presentation independent from persistence details.

## Inputs and outputs

- Input: registros PostgreSQL expostos por `storefront.repository.ts`.
- Output: accessible React UI and typed `StorefrontSnapshot`.

## Related modules

O checkout envia apenas identificadores e quantidades; preços vindos do
navegador nunca são aceitos como definitivos.
