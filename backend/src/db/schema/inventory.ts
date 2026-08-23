import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { primaryId } from "./_shared";
import { storeProducts } from "./store-products";

/**
 * Stock for one store listing.
 *
 * Kept out of `store_products` on purpose: quantities change on every order
 * while prices rarely change, so isolating the hot columns keeps the listing
 * rows stable.
 *
 * Overselling is prevented by the CHECK constraints below plus a transactional
 * `UPDATE ... WHERE quantity - reserved_quantity >= :requested`. The database
 * refuses to store an impossible state — the application cannot introduce one
 * through a race, a bug, or a manual query.
 */
export const inventory = pgTable(
  "inventory",
  {
    id: primaryId(),

    storeProductId: uuid()
      .notNull()
      .references(() => storeProducts.id, { onDelete: "cascade" }),

    /** Physical units on the shelf. */
    quantity: integer().notNull().default(0),

    /** Units committed to orders that are placed but not yet shipped. */
    reservedQuantity: integer().notNull().default(0),

    /** What a customer can actually buy right now. Derived by Postgres. */
    availableQuantity: integer().generatedAlwaysAs(sql`quantity - reserved_quantity`),

    lowStockThreshold: integer().notNull().default(5),

    /** Optional — powers the expiry-aware "smart clearance" deals (Phase B32). */
    manufacturedAt: date(),
    expiresAt: date(),

    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Exactly one stock row per listing.
    uniqueIndex("inventory_store_product_key").on(t.storeProductId),

    // Low-stock dashboards and expiry alerts.
    index("inventory_low_stock_idx").on(t.lowStockThreshold),
    index("inventory_expires_at_idx").on(t.expiresAt),

    check("inventory_quantity_non_negative", sql`quantity >= 0`),
    check("inventory_reserved_non_negative", sql`reserved_quantity >= 0`),
    // The core oversell guard: you can never reserve more than you hold.
    check("inventory_reserved_within_quantity", sql`reserved_quantity <= quantity`),
    check(
      "inventory_expiry_after_manufacture",
      sql`manufactured_at is null or expires_at is null or expires_at >= manufactured_at`,
    ),
  ],
);

export type Inventory = typeof inventory.$inferSelect;
export type NewInventory = typeof inventory.$inferInsert;
