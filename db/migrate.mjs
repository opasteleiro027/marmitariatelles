import { readdir, readFile } from "node:fs/promises";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error("DATABASE_URL não configurada para a migration PostgreSQL.");
}

const sql = postgres(databaseUrl, {
  max: 1,
  prepare: false,
  ssl: usesTls(databaseUrl) ? "require" : false,
});

try {
  await sql`
    CREATE TABLE IF NOT EXISTS app_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `;

  const migrationDirectory = new URL("../drizzle-postgres/", import.meta.url);
  const migrationFiles = (await readdir(migrationDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const filename of migrationFiles) {
    const [existing] = await sql`
      SELECT filename FROM app_migrations WHERE filename = ${filename}
    `;
    if (existing) continue;

    const source = await readFile(new URL(filename, migrationDirectory), "utf8");
    const statements = source
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    await sql.begin(async (transaction) => {
      for (const statement of statements) {
        await transaction.unsafe(statement);
      }
      await transaction`
        INSERT INTO app_migrations (filename, applied_at)
        VALUES (${filename}, ${new Date().toISOString()})
      `;
    });
  }

  await seedFoundation(sql);
  console.log("PostgreSQL e dados iniciais verificados com sucesso.");
} finally {
  await sql.end({ timeout: 5 });
}

async function seedFoundation(database) {
  const seedData = JSON.parse(
    await readFile(new URL("./seed-data.json", import.meta.url), "utf8"),
  );
  const timestamp = new Date().toISOString();
  let salesDate = nextSundayDateKey();
  let menuId = `seed-menu-${salesDate}`;

  await database.begin(async (transaction) => {
    const admin = seedData.administrator;
    await transaction`
      INSERT INTO admin_users
        (id, email, display_name, role, active, created_at, updated_at)
      VALUES
        (${admin.id}, ${admin.email}, ${admin.displayName}, ${admin.role},
          TRUE, ${timestamp}, ${timestamp})
      ON CONFLICT (email) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        role = EXCLUDED.role,
        active = TRUE,
        updated_at = EXCLUDED.updated_at
    `;

    const settings = seedData.settings;
    await transaction`
      INSERT INTO business_settings
        (id, business_name, description, welcome_message, whatsapp, phone,
          address, primary_color, minimum_order_cents, order_deadline_label,
          delivery_window_label, notice, pickup_instructions,
          delivery_instructions, orders_paused, updated_at)
      VALUES
        (${settings.id}, ${settings.businessName}, ${settings.description},
          ${settings.welcomeMessage}, ${settings.whatsapp}, ${settings.phone},
          ${settings.address}, ${settings.primaryColor},
          ${settings.minimumOrderCents}, ${settings.orderDeadlineLabel},
          ${settings.deliveryWindowLabel}, ${settings.notice},
          ${settings.pickupInstructions}, ${settings.deliveryInstructions},
          ${settings.ordersPaused}, ${timestamp})
      ON CONFLICT (id) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        description = EXCLUDED.description,
        welcome_message = EXCLUDED.welcome_message,
        whatsapp = EXCLUDED.whatsapp,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        updated_at = EXCLUDED.updated_at
    `;

    for (const category of seedData.categories) {
      await transaction`
        INSERT INTO categories
          (id, name, display_order, active, created_at)
        VALUES
          (${category.id}, ${category.name}, ${category.displayOrder},
            TRUE, ${timestamp})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          display_order = EXCLUDED.display_order
      `;
    }

    for (const product of seedData.products) {
      await transaction`
        INSERT INTO products
          (id, category_id, name, description, price_cents,
            promotional_price_cents, featured, active, sold_out,
            notes_allowed, display_order, created_at, updated_at)
        VALUES
          (${product.id}, ${product.categoryId}, ${product.name},
            ${product.description}, ${product.priceCents},
            ${product.promotionalPriceCents}, ${product.featured}, TRUE, FALSE,
            TRUE, ${product.displayOrder}, ${timestamp}, ${timestamp})
        ON CONFLICT (id) DO NOTHING
      `;
    }

    const [operationalMenu] = await transaction`
      SELECT id, sales_date
      FROM sales_menus
      WHERE operational = TRUE
      LIMIT 1
    `;
    if (operationalMenu) {
      menuId = operationalMenu.id;
      salesDate = operationalMenu.sales_date;
    } else {
      const [existingMenu] = await transaction`
        SELECT id
        FROM sales_menus
        WHERE sales_date = ${salesDate}
        LIMIT 1
      `;
      if (existingMenu) menuId = existingMenu.id;
    }

    await transaction`
      INSERT INTO sales_menus
        (id, sales_date, ordering_opens_at, ordering_closes_at, total_capacity,
          published, closed_manually, operational, created_at, updated_at)
      VALUES
        (${menuId}, ${salesDate}, ${timestamp},
          ${new Date(`${salesDate}T10:30:00-03:00`).toISOString()},
          60, TRUE, FALSE, TRUE, ${timestamp}, ${timestamp})
      ON CONFLICT (id) DO UPDATE SET
        published = TRUE,
        operational = TRUE,
        updated_at = EXCLUDED.updated_at
    `;

    for (const product of seedData.products) {
      await transaction`
        INSERT INTO sales_menu_items
          (id, menu_id, product_id, available_quantity, sold_quantity,
            active, display_order)
        VALUES
          (${`${menuId}-${product.id}`}, ${menuId}, ${product.id}, 40, 0,
            TRUE, ${product.displayOrder})
        ON CONFLICT (menu_id, product_id) DO NOTHING
      `;
    }

    for (const method of seedData.paymentMethods) {
      await transaction`
        INSERT INTO payment_methods
          (id, code, label, active, display_order)
        VALUES
          (${method.id}, ${method.code}, ${method.label}, TRUE,
            ${method.displayOrder})
        ON CONFLICT (id) DO UPDATE SET
          label = EXCLUDED.label,
          active = TRUE,
          display_order = EXCLUDED.display_order
      `;
    }

    for (const [index, window] of [
      ["11:00", "12:00"],
      ["12:00", "13:00"],
      ["13:00", "14:00"],
    ].entries()) {
      await transaction`
        INSERT INTO delivery_slots
          (id, sales_date, starts_at, ends_at, capacity, reserved_count, active)
        VALUES
          (${`slot-${salesDate}-${index + 1}`}, ${salesDate}, ${window[0]},
            ${window[1]}, 20, 0, TRUE)
        ON CONFLICT (id) DO NOTHING
      `;
    }
  });
}

function nextSundayDateKey(reference = new Date()) {
  const localParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(reference);
  const value = Object.fromEntries(
    localParts.map((part) => [part.type, part.value]),
  );
  const candidate = new Date(
    Date.UTC(Number(value.year), Number(value.month) - 1, Number(value.day)),
  );
  const daysUntilSunday = (7 - candidate.getUTCDay()) % 7 || 7;
  candidate.setUTCDate(candidate.getUTCDate() + daysUntilSunday);
  return candidate.toISOString().slice(0, 10);
}

function usesTls(value) {
  const host = new URL(value).hostname;
  return (
    !host.endsWith("railway.internal") &&
    !["localhost", "127.0.0.1", "::1"].includes(host)
  );
}
