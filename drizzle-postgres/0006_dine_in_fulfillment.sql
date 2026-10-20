UPDATE "business_settings"
SET
  "delivery_window_label" = 'Comer na loja, retirada ou entrega',
  "updated_at" = CURRENT_TIMESTAMP::text
WHERE "delivery_window_label" = 'Entrega ou retirada';
--> statement-breakpoint
UPDATE "payment_methods"
SET "label" = CASE "code"
  WHEN 'cash' THEN 'Dinheiro'
  WHEN 'card_on_delivery' THEN 'Cartão na entrega ou na loja'
  WHEN 'pay_on_pickup' THEN 'Pagar no balcão'
  ELSE "label"
END
WHERE "code" IN ('cash', 'card_on_delivery', 'pay_on_pickup');
