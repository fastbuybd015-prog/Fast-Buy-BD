import { boolean, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./_shared";

/**
 * Product brands (PRAN, Fresh, Teer, ...).
 *
 * Optional on a product: the current catalogue has unbranded staples such as
 * loose rice, and forcing a brand on those would be false data.
 */
export const brands = pgTable(
  "brands",
  {
    id: primaryId(),

    name: text().notNull(),
    slug: text().notNull(),
    logoUrl: text(),

    isActive: boolean().notNull().default(true),

    ...timestamps,
  },
  (t) => [uniqueIndex("brands_slug_key").on(t.slug)],
);

export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
