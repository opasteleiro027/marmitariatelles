# Ordering

Owns the complete order lifecycle, monetary snapshots, payments, coupons,
status history, internal notes and idempotency keys.

All confirmation-time values are recalculated on the server inside one atomic
operation. Product and addon names and prices are copied to immutable snapshots.
For delivery, the selected area must match the normalized city and neighborhood
from the confirmed address.

Home delivery receives the first available operational slot automatically.
Pickup keeps the slot as an explicit customer choice.

The protected admin pulse exposes only a change marker, total count and latest
order identifier. The admin interface polls it every five seconds, refreshes
changed data and can play an opt-in sound only when a new order is detected.
