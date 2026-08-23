import { sql } from "drizzle-orm";
import { boolean, index, integer, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createdAt, primaryId } from "./_shared";
import { products } from "./products";

/**
 * Product gallery images.
 *
 * Only the URL/path lives in Postgres — the files themselves are in Supabase
 * Storage. Large binaries never belong in the database (Backend Master
 * Context §151).
 */
export const productImages = pgTable(
  "product_images",
  {
    id: primaryId(),

    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    imageUrl: text().notNull(),
    /** Accessibility text; falls back to the product name when absent. */
    altText: text(),

    sortOrder: integer().notNull().default(0),
    isPrimary: boolean().notNull().default(false),

    ...createdAt,
  },
  (t) => [
    index("product_images_product_id_idx").on(t.productId),
    // Exactly one primary image per product, enforced by the database.
    uniqueIndex("product_images_one_primary_per_product_key")
      .on(t.productId)
      .where(sql`${t.isPrimary}`),
  ],
);

export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
