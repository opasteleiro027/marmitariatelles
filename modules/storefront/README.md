# Storefront

## Purpose

Public, mobile-first surface used by customers to discover the active Sunday
menu and begin an order.

## Responsibilities

- Read a server-authoritative storefront snapshot.
- Present opening status, delivery information and available products.
- Keep presentation independent from persistence details.

## Inputs and outputs

- Input: D1 records exposed through `storefront.repository.ts`.
- Output: accessible React UI and typed `StorefrontSnapshot`.

## Related modules

The ordering workflow will consume product identifiers from this module without
trusting prices sent by the browser.
