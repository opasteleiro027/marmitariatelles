# Mapa de dados

## Identidade

`admin_users` → administradores e perfis.

`customers` → `customer_addresses`.

## Catálogo

`categories` → `products` → `product_images`.

`products` ↔ `addon_groups` → `addon_options`.

`sales_menus` → `sales_menu_items` → `products`.

## Operação

`business_settings`, `delivery_areas`, `delivery_slots`, `payment_methods`.

## Pedido

`orders` → `order_items` → `order_item_addons`.

`orders` → `payments`, `order_status_history`, `internal_order_notes`.

`coupons` e `order_idempotency_keys` protegem desconto e duplicidade.

Snapshots em `orders` e `order_items` preservam dados históricos.
