# Ordering

Owns the complete order lifecycle, monetary snapshots, payments, coupons,
status history, internal notes and idempotency keys.

All confirmation-time values are recalculated on the server inside one atomic
operation. Product and addon names and prices are copied to immutable snapshots.
