# Test scenarios

- Recalculates totals from persisted prices.
- Rejects unavailable items, closed windows and unsupported neighborhoods.
- Rejects an address whose city or neighborhood differs from the selected area.
- Reserves stock and slot capacity atomically.
- Reuses an idempotency result for a repeated confirmation request.
- Preserves historical names and prices after catalog edits.
