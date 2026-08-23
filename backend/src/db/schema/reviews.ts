import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./_shared";
import { reviewStatusEnum } from "./enums";
import { orderItems } from "./order-items";
import { products } from "./products";
import { profiles } from "./profiles";

/**
 * Product reviews, restricted to verified purchases.
 *
 * `orderItemId` is the proof: a review must point at a line the customer
 * actually received, and the unique index below allows exactly one review per
 * purchased line. That makes review-bombing by unrelated accounts impossible
 * rather than merely discouraged.
 */
export const reviews = pgTable(
  "reviews",
  {
    id: primaryId(),

    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    /** The delivered line this review is about. */
    orderItemId: uuid()
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),

    /** Whole stars, 1–5. */
    rating: integer().notNull(),
    comment: text(),

    status: reviewStatusEnum().notNull().default("APPROVED"),

    ...timestamps,
  },
  (t) => [
    uniqueIndex("reviews_order_item_key").on(t.orderItemId),
    // The product page: approved reviews, newest first.
    index("reviews_product_status_idx").on(t.productId, t.status),
    index("reviews_user_id_idx").on(t.userId),

    check("reviews_rating_range", sql`rating between 1 and 5`),
  ],
);

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
