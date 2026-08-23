import { index, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createdAt, primaryId } from "./_shared";
import { products } from "./products";
import { profiles } from "./profiles";

/**
 * Wishlist entries.
 *
 * Favourites are on the canonical product, not a store listing: the customer
 * wants "Miniket Rice", and should still see it if the store they first found
 * it in stops selling it.
 */
export const favorites = pgTable(
  "favorites",
  {
    id: primaryId(),

    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    ...createdAt,
  },
  (t) => [
    // Favouriting twice is a no-op, not a duplicate row.
    uniqueIndex("favorites_user_product_key").on(t.userId, t.productId),
    index("favorites_user_id_idx").on(t.userId),
    index("favorites_product_id_idx").on(t.productId),
  ],
);

export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
