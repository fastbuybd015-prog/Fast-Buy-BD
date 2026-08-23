import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { money, primaryId, timestamps } from "./_shared";
import { products } from "./products";
import { stores } from "./stores";

/**
 * A store's listing of a canonical product — the price side of the multi-store
 * model.
 *
 *   Miniket Rice
 *     ├── Fast Mart      ৳420
 *     ├── Daily Basket   ৳398   ← best deal
 *     └── Green Valley   ৳435
 *
 * Price comparison, the budget basket and the basket optimizer all read this
 * table. Stock lives in `inventory`, one row per listing.
 */
export const storeProducts = pgTable(
  "store_products",
  {
    id: primaryId(),

    storeId: uuid()
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),

    productId: uuid()
      .notNull()
      // Never delete a product that has been listed or sold — deactivate it.
      .references(() => products.id, { onDelete: "restrict" }),

    /** The store's own stock-keeping code, if it uses one. */
    sku: text(),

    /** Current selling price. */
    price: money().notNull(),

    /** Price before discount. Equal to `price` when there is no offer. */
    originalPrice: money().notNull(),

    /**
     * Derived, never written by the application: Postgres recomputes it from
     * the two prices above, so a stale or exaggerated discount is impossible.
     */
    discountPercentage: numeric({ precision: 5, scale: 2 }).generatedAlwaysAs(
      sql`case when original_price > 0
            then round((original_price - price) / original_price * 100, 2)
            else 0 end`,
    ),

    isActive: boolean().notNull().default(true),

    ...timestamps,
  },
  (t) => [
    // A store lists a given product at most once.
    uniqueIndex("store_products_store_product_key").on(t.storeId, t.productId),

    // "All listings of this product, cheapest first" — the price comparison query.
    index("store_products_product_price_idx").on(t.productId, t.price),
    // "Everything this store sells" — store page and store dashboard.
    index("store_products_store_id_idx").on(t.storeId),
    index("store_products_is_active_idx").on(t.isActive),

    check("store_products_price_non_negative", sql`price >= 0`),
    check("store_products_original_price_not_lower", sql`original_price >= price`),
  ],
);

export type StoreProduct = typeof storeProducts.$inferSelect;
export type NewStoreProduct = typeof storeProducts.$inferInsert;
