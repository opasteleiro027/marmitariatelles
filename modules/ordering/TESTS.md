# Test scenarios

- Normalizes an optional customer observation with a 500-character limit.

- Recalculates totals from persisted prices.
- Rejects unavailable items, closed windows and unsupported neighborhoods.
- Rejects an address whose city or neighborhood differs from the selected area.
- Assigns the first available slot automatically to home delivery.
- Keeps explicit slot selection for pickup.
- Reserves stock and slot capacity atomically.
- Reuses an idempotency result for a repeated confirmation request.
- Preserves historical names and prices after catalog edits.
- Distinguishes a new order from status-only changes in the admin pulse.
- Refreshes the customer tracking screen every five seconds while an order is
  active.
- Prints a complete 80 mm thermal order slip from the administrative list.
- Builds daily, weekly and monthly boundaries in the Sao Paulo time zone.
- Excludes cancelled orders from commercial report totals and rankings.
- Aggregates customer frequency, tickets, neighborhoods, products and payment
  preferences for the administrative overview.
- Requires the exact destructive-action phrase before clearing test history.
- Restores stock from non-cancelled test orders without duplicating cancelled
  order restoration.
- Removes transactional dependencies while preserving catalog and admin data.
