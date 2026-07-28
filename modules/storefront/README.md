# Storefront

## Purpose

Public, mobile-first surface used by customers to discover the operational
menu and begin an order while the site is enabled.

## Responsibilities

- Read a server-authoritative storefront snapshot.
- Present independent Home, Cardápio, Como funciona and Contato screens.
- Build numbered menu steps from active administrator categories.
- Present the enabled/disabled status, delivery information and products.
- Disable ordering controls while the administrator has the site turned off.
- Persist only an untrusted cart draft and customer observation in the browser.
- Keep presentation independent from persistence details.

## Inputs and outputs

- Input: registros PostgreSQL expostos por `storefront.repository.ts`.
- Output: accessible React UI and typed `StorefrontSnapshot`.

## Related modules

O checkout envia apenas identificadores, quantidades e uma observação opcional;
preços vindos do navegador nunca são aceitos como definitivos.
