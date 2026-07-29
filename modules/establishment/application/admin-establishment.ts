import { randomUUID } from "node:crypto";
import { getPostgresClient, withTransaction } from "@/db";

export type AdminDeliveryArea = {
  id: string;
  city: string;
  neighborhood: string;
  deliveryFeeInCents: number;
  minimumOrderInCents: number;
  estimatedMinutes: number | null;
  active: boolean;
};

export type AdminBusinessSettings = {
  businessName: string;
  whatsapp: string;
  phone: string;
  address: string;
  welcomeMessage: string;
  deliveryWindowLabel: string;
  minimumOrderInCents: number;
  ordersPaused: boolean;
};

type EditableBusinessSettings = Omit<AdminBusinessSettings, "ordersPaused">;

export async function getAdminBusinessSettings(): Promise<AdminBusinessSettings> {
  const sql = getPostgresClient();
  const rows = await sql.unsafe<
    Array<{
      business_name: string;
      whatsapp: string;
      phone: string | null;
      address: string | null;
      welcome_message: string;
      delivery_window_label: string;
      minimum_order_cents: number;
      orders_paused: boolean;
    }>
  >(
    `SELECT business_name, whatsapp, phone, address, welcome_message,
            delivery_window_label, minimum_order_cents, orders_paused
     FROM business_settings
     ORDER BY updated_at DESC
     LIMIT 1`,
  );
  const settings = rows[0];
  if (!settings) throw new Error("Configurações do estabelecimento ausentes.");
  return {
    businessName: settings.business_name,
    whatsapp: settings.whatsapp,
    phone: settings.phone ?? "",
    address: settings.address ?? "",
    welcomeMessage: settings.welcome_message,
    deliveryWindowLabel: settings.delivery_window_label,
    minimumOrderInCents: settings.minimum_order_cents,
    ordersPaused: settings.orders_paused,
  };
}

export async function getAdminDeliveryAreas(): Promise<AdminDeliveryArea[]> {
  const sql = getPostgresClient();
  const areas = await sql.unsafe<
    Array<{
      id: string;
      city: string;
      neighborhood: string;
      delivery_fee_cents: number;
      minimum_order_cents: number;
      estimated_minutes: number | null;
      active: boolean;
    }>
  >(
    `SELECT id, city, neighborhood, delivery_fee_cents,
            minimum_order_cents, estimated_minutes, active
     FROM delivery_areas
     ORDER BY display_order, neighborhood`,
  );
  return areas.map((area) => ({
    id: area.id,
    city: area.city,
    neighborhood: area.neighborhood,
    deliveryFeeInCents: area.delivery_fee_cents,
    minimumOrderInCents: area.minimum_order_cents,
    estimatedMinutes: area.estimated_minutes,
    active: area.active,
  }));
}

export async function getAdminEstablishment() {
  const [settings, areas] = await Promise.all([
    getAdminBusinessSettings(),
    getAdminDeliveryAreas(),
  ]);
  return { settings, areas };
}

export async function saveBusinessSettings(input: EditableBusinessSettings) {
  const sql = getPostgresClient();
  await sql.unsafe(
    `UPDATE business_settings
     SET business_name = $1, whatsapp = $2, phone = $3, address = $4,
         welcome_message = $5, delivery_window_label = $6,
         minimum_order_cents = $7, updated_at = $8
     WHERE id = (
       SELECT id FROM business_settings ORDER BY updated_at DESC LIMIT 1
     )`,
    [
      input.businessName,
      input.whatsapp,
      input.phone,
      input.address,
      input.welcomeMessage,
      input.deliveryWindowLabel,
      input.minimumOrderInCents,
      new Date().toISOString(),
    ],
  );
}

export async function setOrdersPaused(paused: boolean) {
  const sql = getPostgresClient();
  await sql.unsafe(
    `UPDATE business_settings
     SET orders_paused = $1, updated_at = $2
     WHERE id = (
       SELECT id FROM business_settings ORDER BY updated_at DESC LIMIT 1
     )`,
    [paused, new Date().toISOString()],
  );
}

export async function createDeliveryArea(
  input: Omit<AdminDeliveryArea, "id" | "active">,
) {
  const sql = getPostgresClient();
  const timestamp = new Date().toISOString();
  await sql.unsafe(
    `INSERT INTO delivery_areas
      (id, city, neighborhood, delivery_fee_cents, minimum_order_cents,
       estimated_minutes, active, display_order, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE, 999, $7, $7)`,
    [
      randomUUID(),
      input.city,
      input.neighborhood,
      input.deliveryFeeInCents,
      input.minimumOrderInCents,
      input.estimatedMinutes,
      timestamp,
    ],
  );
}

export async function updateDeliveryArea(input: AdminDeliveryArea) {
  const sql = getPostgresClient();
  await sql.unsafe(
    `UPDATE delivery_areas
     SET city = $1, neighborhood = $2, delivery_fee_cents = $3,
         minimum_order_cents = $4, estimated_minutes = $5, active = $6,
         updated_at = $7
     WHERE id = $8`,
    [
      input.city,
      input.neighborhood,
      input.deliveryFeeInCents,
      input.minimumOrderInCents,
      input.estimatedMinutes,
      input.active,
      new Date().toISOString(),
      input.id,
    ],
  );
}

export async function deleteDeliveryArea(id: string) {
  return withTransaction(async (sql) => {
    const areas = await sql.unsafe<Array<{ id: string }>>(
      `SELECT id
       FROM delivery_areas
       WHERE id = $1
       FOR UPDATE`,
      [id],
    );
    if (!areas[0]) return false;

    await sql.unsafe(
      `DELETE FROM delivery_areas
       WHERE id = $1`,
      [id],
    );
    return true;
  });
}
