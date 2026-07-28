# Storefront

## Purpose

Public, mobile-first surface used by customers to discover the operational
menu and begin an order while the site is enabled.

## Responsibilities

- Read a server-authoritative storefront snapshot.
- Present independent Home, Cardápio, Como funciona and Contato screens.
- Build the numbered marmita flow from the administrator's sizes and option
  groups: size, base, beans, protein, sides, extras and observation.
- Present the enabled/disabled status, delivery information and products.
- Disable ordering controls while the administrator has the site turned off.
- Persist only an untrusted configured-cart draft in the browser.
- Keep presentation independent from persistence details.

## Inputs and outputs

- Input: registros PostgreSQL expostos por `storefront.repository.ts`.
- Output: accessible React UI and typed `StorefrontSnapshot`.

## Related modules

O checkout envia apenas identificadores, quantidades e observações opcionais.
Preços, disponibilidade e limites vindos do navegador nunca são aceitos como
definitivos.
