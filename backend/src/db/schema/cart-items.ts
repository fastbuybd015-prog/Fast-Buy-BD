import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./_shared";
import { carts } from "./carts";
import { storeProducts } from "./store-products";

/**
 * One line in a cart.
 *
 * It points at a `store_product`, not a `product` — the customer is choosing
 * *this store's* offer of the item, which is what makes "add the cheapest
 * option" meaningful.
 *
 * There is deliberately no price column. A price captured when the item was
 * added would be stale by checkout; the server always re-reads the listing.
 */
export const cartItems = pgTable(
  "cart_items",
  {
    id: primaryId(),

    cartId: uuid()
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),

    storeProductId: uuid()
      .notNull()
      .references(() => storeProducts.id, { onDelete: "cascade" }),

    quantity: integer().notNull().default(1),

    ...timestamps,
  },
  (t) => [
    // Adding the same listing twice bumps the quantity instead of duplicating.
    uniqueIndex("cart_items_cart_listing_key").on(t.cartId, t.storeProductId),
    index("cart_items_cart_id_idx").on(t.cartId),
    index("cart_items_store_product_id_idx").on(t.storeProductId),

    check("cart_items_quantity_positive", sql`quantity > 0`),
  ],
);

export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
