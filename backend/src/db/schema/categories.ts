import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./_shared";

/**
 * Product categories.
 *
 * `parentId` is self-referencing so sub-categories are possible later; the
 * current ten categories are all top level.
 */
export const categories = pgTable(
  "categories",
  {
    id: primaryId(),

    name: text().notNull(),
    slug: text().notNull(),
    description: text(),
    imageUrl: text(),

    parentId: uuid().references((): AnyPgColumn => categories.id, { onDelete: "set null" }),

    isActive: boolean().notNull().default(true),
    sortOrder: integer().notNull().default(0),

    ...timestamps,
  },
  (t) => [
    // Public URLs are /category/<slug>, so the slug must be unique and indexed.
    uniqueIndex("categories_slug_key").on(t.slug),
    index("categories_parent_id_idx").on(t.parentId),
    index("categories_active_sort_idx").on(t.isActive, t.sortOrder),
  ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
