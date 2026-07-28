# Menu builder

## Purpose

Customer-facing, responsive menu assembly screen inspired by the supplied
Google Stitch project.

## Responsibilities

- Compose the hero, dynamic category steps, notes and order summary.
- Persist product quantities and notes locally between visits.
- Open the existing authoritative checkout drawer.
- Clear the local draft after successful order creation.

## Inputs and outputs

Input is a server-rendered `StorefrontSnapshot`. Output is a list of product
identifiers, quantities and optional customer notes passed to ordering.

## Boundaries

This piece never accepts browser prices as authoritative. The order service
reloads every product and recalculates totals in PostgreSQL.
