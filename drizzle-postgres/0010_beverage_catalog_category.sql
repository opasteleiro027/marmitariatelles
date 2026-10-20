INSERT INTO categories (id, name, display_order, active, created_at)
VALUES ('pote-mix-bebidas', 'Bebidas', 4, TRUE, NOW()::text)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  active = TRUE;
