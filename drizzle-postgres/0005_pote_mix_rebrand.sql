UPDATE "products"
SET "active" = FALSE, "updated_at" = CURRENT_TIMESTAMP::text
WHERE "id" NOT IN (
  'pote-mix-350', 'pote-mix-550', 'mac-cheese-350', 'mac-cheese-550',
  'baratissimo-350', 'penne-camarao-550', 'salada-caesar', 'salada-completa'
);
--> statement-breakpoint
UPDATE "categories"
SET "active" = FALSE
WHERE "id" NOT IN ('pote-mix-monte', 'pote-mix-receitas', 'pote-mix-saladas');
--> statement-breakpoint
UPDATE "addon_groups"
SET "active" = FALSE
WHERE "id" NOT IN (
  'builder-massa', 'builder-molho', 'builder-complementos',
  'builder-finalizacao', 'builder-adicionais',
  'salada-adicionais', 'salada-macarrao'
);
--> statement-breakpoint
UPDATE "sales_menu_items"
SET "active" = FALSE
WHERE "product_id" NOT IN (
  'pote-mix-350', 'pote-mix-550', 'mac-cheese-350', 'mac-cheese-550',
  'baratissimo-350', 'penne-camarao-550', 'salada-caesar', 'salada-completa'
);
--> statement-breakpoint
UPDATE "business_settings"
SET
  "business_name" = 'Pote Mix',
  "description" = 'Massas e saladas preparadas na hora, do seu jeito.',
  "welcome_message" = 'Você escolhe. Você monta. A gente prepara.',
  "primary_color" = '#e99d32',
  "notice" = 'Seu sabor favorito, no pote perfeito.',
  "pickup_instructions" = 'Retirada no endereço do Pote Mix, no horário confirmado no pedido.',
  "updated_at" = CURRENT_TIMESTAMP::text
WHERE "id" = 'default';
