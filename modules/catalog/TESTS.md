# Test scenarios

- A menu contains each product at most once.
- Sold-out or inactive products are rejected during server confirmation.
- Required complement groups enforce their minimum and maximum selections.
- Marmita sizes define independent protein and side limits.
- Builder options preserve integer-cent additions and sold-out state.
- Date-specific prices override catalog prices only for that menu.
- Products, builder sizes and options expose explicit edit and delete controls.
- Soft-deleted catalog entries cannot be ordered and are not restored by seed.
- Deleting a catalog entry preserves historical order snapshots.
