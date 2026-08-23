import { boolean, index, integer, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { primaryId, rating, timestamps } from "./_shared";
import { brands } from "./brands";
import { categories } from "./categories";

/**
 * The canonical product — "PRAN Mustard Oil 1L" as a concept, independent of
 * any store.
 *
 * It deliberately carries NO price and NO stock. Those belong to
 * `store_products` and `inventory`, because the same product is sold by
 * several stores at different prices. That separation is what makes
 * multi-store price comparison possible at all (Master Project Context §35).
 */
export const products = pgTable(
  "products",
  {
    id: primaryId(),

    categoryId: uuid()
      .notNull()
      // A category with products cannot be deleted — deactivate it instead.
      .references(() => categories.id, { onDelete: "restrict" }),

    brandId: uuid().references(() => brands.id, { onDelete: "set null" }),

    name: text().notNull(),
    slug: text().notNull(),
    description: text(),

    /** Pack size shown to the customer, e.g. "5 kg bag", "1 litre bottle". */
    unit: text().notNull(),

    /** Free-form search/browse keywords. */
    tags: text().array().notNull().default([]),

    /** Denormalised review aggregates, recalculated when a review is posted. */
    ratingAverage: rating().notNull().default("0"),
    reviewCount: integer().notNull().default(0),

    isActive: boolean().notNull().default(true),

    ...timestamps,
  },
  (t) => [
    // Public URLs are /product/<slug>.
    uniqueIndex("products_slug_key").on(t.slug),
    index("products_category_id_idx").on(t.categoryId),
    index("products_brand_id_idx").on(t.brandId),
    index("products_is_active_idx").on(t.isActive),
    // Array containment lookups ("show me everything tagged 'staple'").
    index("products_tags_idx").using("gin", t.tags),
  ],
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
