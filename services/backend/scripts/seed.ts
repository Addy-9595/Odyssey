/**
 * Seeds Neon with realistic restaurant sample data so a reviewer can run the
 * project locally against meaningful records. Idempotent: clears every table
 * (FK-safe order) then re-inserts.
 *
 * Run: `pnpm --filter @odyssey/backend run db:seed`
 * Requires DATABASE_URL (loaded here from the repo-root .env).
 *
 * NOTE: this is a DB-mutating command — it writes to Neon.
 */
import { config } from "dotenv";
import { resolve } from "node:path";
// Resolved from cwd — `pnpm --filter @odyssey/backend run db:seed` runs with
// cwd = services/backend, so the repo-root .env is two levels up.
config({ path: resolve(process.cwd(), "../../.env") });

import { createDb } from "../src/db/client.ts";
import {
  categories,
  customers,
  menuItems,
  orderItems,
  orders,
  settings,
  type OpeningHours,
} from "../src/db/schema.ts";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Add it to the repo-root .env before seeding.",
  );
}
const db = createDb(databaseUrl);

async function seed() {
  console.log("Clearing existing data...");
  // Children first to respect foreign keys.
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(menuItems);
  await db.delete(categories);
  await db.delete(customers);
  await db.delete(settings);

  /* ---------------------------------------------------------------------- */
  /* Categories                                                             */
  /* ---------------------------------------------------------------------- */
  console.log("Inserting categories...");
  const [starters, mains, pizzas, desserts, drinks] = await db
    .insert(categories)
    .values([
      { name: "Starters", displayOrder: 1 },
      { name: "Mains", displayOrder: 2 },
      { name: "Pizzas", displayOrder: 3 },
      { name: "Desserts", displayOrder: 4 },
      { name: "Drinks", displayOrder: 5 },
    ])
    .returning();

  /* ---------------------------------------------------------------------- */
  /* Menu items (prices in cents; a few intentionally unavailable)          */
  /* ---------------------------------------------------------------------- */
  console.log("Inserting menu items...");
  const items = await db
    .insert(menuItems)
    .values([
      // Starters
      {
        categoryId: starters!.id,
        name: "Garlic Bread",
        description: "Toasted sourdough, roasted garlic butter, parsley.",
        priceCents: 650,
        isAvailable: true,
      },
      {
        categoryId: starters!.id,
        name: "Soup of the Day",
        description: "Ask your server. Served with bread.",
        priceCents: 720,
        isAvailable: true,
      },
      {
        categoryId: starters!.id,
        name: "Calamari",
        description: "Lightly fried squid, lemon aioli.",
        priceCents: 1050,
        isAvailable: false, // 86'd today
      },
      // Mains
      {
        categoryId: mains!.id,
        name: "Grilled Salmon",
        description: "Atlantic salmon, seasonal greens, lemon butter.",
        priceCents: 2150,
        isAvailable: true,
      },
      {
        categoryId: mains!.id,
        name: "Ribeye Steak",
        description: "10oz ribeye, hand-cut fries, peppercorn sauce.",
        priceCents: 2950,
        isAvailable: true,
      },
      {
        categoryId: mains!.id,
        name: "Mushroom Risotto",
        description: "Arborio rice, wild mushrooms, parmesan.",
        priceCents: 1680,
        isAvailable: true,
      },
      {
        categoryId: mains!.id,
        name: "Lamb Shank",
        description: "Slow-braised lamb, mash, red wine jus.",
        priceCents: 2480,
        isAvailable: false, // sold out
      },
      // Pizzas
      {
        categoryId: pizzas!.id,
        name: "Margherita",
        description: "San Marzano tomato, fior di latte, basil.",
        priceCents: 1290,
        isAvailable: true,
      },
      {
        categoryId: pizzas!.id,
        name: "Pepperoni",
        description: "Tomato, mozzarella, spicy pepperoni.",
        priceCents: 1490,
        isAvailable: true,
      },
      {
        categoryId: pizzas!.id,
        name: "Quattro Formaggi",
        description: "Mozzarella, gorgonzola, fontina, parmesan.",
        priceCents: 1590,
        isAvailable: true,
      },
      // Desserts
      {
        categoryId: desserts!.id,
        name: "Tiramisu",
        description: "Espresso-soaked ladyfingers, mascarpone, cocoa.",
        priceCents: 780,
        isAvailable: true,
      },
      {
        categoryId: desserts!.id,
        name: "Chocolate Fondant",
        description: "Molten dark chocolate, vanilla ice cream.",
        priceCents: 850,
        isAvailable: true,
      },
      // Drinks
      {
        categoryId: drinks!.id,
        name: "Still Water",
        description: "500ml.",
        priceCents: 300,
        isAvailable: true,
      },
      {
        categoryId: drinks!.id,
        name: "Craft Lemonade",
        description: "House-made, lightly sparkling.",
        priceCents: 420,
        isAvailable: true,
      },
      {
        categoryId: drinks!.id,
        name: "House Red (glass)",
        description: "Montepulciano d'Abruzzo.",
        priceCents: 950,
        isAvailable: true,
      },
    ])
    .returning();

  // Lookup by name for readable order construction below.
  const byName = new Map(items.map((i) => [i.name, i]));
  const item = (name: string) => {
    const found = byName.get(name);
    if (!found) throw new Error(`Seed bug: menu item "${name}" not found`);
    return found;
  };

  /* ---------------------------------------------------------------------- */
  /* Customers                                                              */
  /* ---------------------------------------------------------------------- */
  console.log("Inserting customers...");
  const [alice, ben, carla, dan, erin] = await db
    .insert(customers)
    .values([
      { name: "Alice Nguyen", email: "alice@example.com", phone: "+1-202-555-0101" },
      { name: "Ben Carter", email: "ben@example.com", phone: "+1-202-555-0142" },
      { name: "Carla Diaz", email: "carla@example.com", phone: "+1-202-555-0177" },
      { name: "Dan O'Brien", email: "dan@example.com", phone: null },
      { name: "Erin Walsh", email: "erin@example.com", phone: "+1-202-555-0199" },
    ])
    .returning();

  /* ---------------------------------------------------------------------- */
  /* Orders + order items                                                   */
  /* unit_price snapshotted from current menu price; total = sum(qty*unit). */
  /* ---------------------------------------------------------------------- */
  console.log("Inserting orders + order items...");

  type Line = { name: string; quantity: number };
  const orderSpecs: Array<{
    customerId: number;
    status:
      | "pending"
      | "confirmed"
      | "preparing"
      | "ready"
      | "completed"
      | "cancelled";
    type: "dine_in" | "takeaway" | "delivery";
    lines: Line[];
  }> = [
    {
      customerId: alice!.id,
      status: "pending",
      type: "dine_in",
      lines: [
        { name: "Garlic Bread", quantity: 1 },
        { name: "Margherita", quantity: 2 },
        { name: "Craft Lemonade", quantity: 2 },
      ],
    },
    {
      customerId: ben!.id,
      status: "confirmed",
      type: "takeaway",
      lines: [
        { name: "Pepperoni", quantity: 1 },
        { name: "House Red (glass)", quantity: 1 },
      ],
    },
    {
      customerId: carla!.id,
      status: "preparing",
      type: "delivery",
      lines: [
        { name: "Grilled Salmon", quantity: 1 },
        { name: "Mushroom Risotto", quantity: 1 },
        { name: "Still Water", quantity: 2 },
      ],
    },
    {
      customerId: dan!.id,
      status: "ready",
      type: "takeaway",
      lines: [
        { name: "Quattro Formaggi", quantity: 1 },
        { name: "Tiramisu", quantity: 2 },
      ],
    },
    {
      customerId: erin!.id,
      status: "completed",
      type: "dine_in",
      lines: [
        { name: "Ribeye Steak", quantity: 2 },
        { name: "Chocolate Fondant", quantity: 2 },
        { name: "House Red (glass)", quantity: 2 },
      ],
    },
    {
      customerId: alice!.id,
      status: "completed",
      type: "delivery",
      lines: [
        { name: "Margherita", quantity: 1 },
        { name: "Garlic Bread", quantity: 1 },
        { name: "Craft Lemonade", quantity: 1 },
      ],
    },
    {
      customerId: ben!.id,
      status: "cancelled",
      type: "dine_in",
      lines: [{ name: "Pepperoni", quantity: 1 }],
    },
    {
      customerId: carla!.id,
      status: "preparing",
      type: "dine_in",
      lines: [
        { name: "Soup of the Day", quantity: 2 },
        { name: "Grilled Salmon", quantity: 1 },
        { name: "Tiramisu", quantity: 1 },
      ],
    },
  ];

  for (const spec of orderSpecs) {
    const lines = spec.lines.map((l) => {
      const menuItem = item(l.name);
      return {
        menuItemId: menuItem.id,
        quantity: l.quantity,
        unitPriceCents: menuItem.priceCents, // snapshot at order time
      };
    });
    const totalCents = lines.reduce(
      (sum, l) => sum + l.quantity * l.unitPriceCents,
      0,
    );

    const [order] = await db
      .insert(orders)
      .values({
        customerId: spec.customerId,
        status: spec.status,
        type: spec.type,
        totalCents,
      })
      .returning();

    await db.insert(orderItems).values(
      lines.map((l) => ({
        orderId: order!.id,
        menuItemId: l.menuItemId,
        quantity: l.quantity,
        unitPriceCents: l.unitPriceCents,
      })),
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Settings (singleton)                                                   */
  /* ---------------------------------------------------------------------- */
  console.log("Inserting settings...");
  const openingHours: OpeningHours = {
    mon: { open: "11:00", close: "22:00" },
    tue: { open: "11:00", close: "22:00" },
    wed: { open: "11:00", close: "22:00" },
    thu: { open: "11:00", close: "23:00" },
    fri: { open: "11:00", close: "23:30" },
    sat: { open: "10:00", close: "23:30" },
    sun: { open: null, close: null }, // closed Sundays
  };
  await db.insert(settings).values({
    id: 1,
    defaultPrepTimeMinutes: 20,
    autoAcceptOrders: false,
    serviceAvailable: true,
    openingHours,
  });

  console.log("Seed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
