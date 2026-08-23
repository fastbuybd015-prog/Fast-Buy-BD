import { index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, primaryId } from "./_shared";
import { products } from "./products";
import { profiles } from "./profiles";

/**
 * What customers searched for, and whether it worked.
 *
 * `resultCount` and `clickedProductId` together answer questions the platform
 * genuinely needs: which searches return nothing (missing stock, wrong
 * keywords) and which results people actually click.
 */
export const searchHistory = pgTable(
  "search_history",
  {
    id: primaryId(),

    userId: uuid().references(() => profiles.id, { onDelete: "cascade" }),
    sessionId: text(),

    query: text().notNull(),
    resultCount: integer().notNull().default(0),

    /** Set later if the customer opened one of the results. */
    clickedProductId: uuid().references(() => products.id, { onDelete: "set null" }),

    ...createdAt,
  },
  (t) => [
    index("search_history_user_created_idx").on(t.userId, t.createdAt),
    // Trending searches, and zero-result searches worth fixing.
    index("search_history_query_idx").on(t.query),
    index("search_history_clicked_product_id_idx").on(t.clickedProductId),
  ],
);

export type SearchHistory = typeof searchHistory.$inferSelect;
export type NewSearchHistory = typeof searchHistory.$inferInsert;
