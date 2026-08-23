import { index, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, primaryId } from "./_shared";
import { userEventTypeEnum } from "./enums";
import { products } from "./products";
import { profiles } from "./profiles";
import { storeProducts } from "./store-products";

/**
 * Behavioural events — the raw material the recommendation engine scores.
 *
 * `userId` is nullable so anonymous browsing still informs "popular" and
 * "trending" without requiring an account; `sessionId` groups those visits.
 *
 * Only what recommendations and analytics genuinely need is recorded. PURCHASE
 * rows are written by the order service from committed data, never accepted
 * from the browser (Backend Master Context §107).
 */
export const userEvents = pgTable(
  "user_events",
  {
    id: primaryId(),

    userId: uuid().references(() => profiles.id, { onDelete: "cascade" }),
    /** Anonymous visitor identifier. */
    sessionId: text(),

    eventType: userEventTypeEnum().notNull(),

    productId: uuid().references(() => products.id, { onDelete: "cascade" }),
    storeProductId: uuid().references(() => storeProducts.id, { onDelete: "cascade" }),

    /** Small, event-specific extras — a search term, a recommendation slot. */
    metadata: jsonb(),

    ...createdAt,
  },
  (t) => [
    // "This customer's recent behaviour" — the personalization query.
    index("user_events_user_created_idx").on(t.userId, t.createdAt),
    // "How much attention has this product had lately" — popularity/trending.
    index("user_events_product_created_idx").on(t.productId, t.createdAt),
    index("user_events_type_created_idx").on(t.eventType, t.createdAt),
    index("user_events_session_idx").on(t.sessionId),
    index("user_events_store_product_id_idx").on(t.storeProductId),
  ],
);

export type UserEvent = typeof userEvents.$inferSelect;
export type NewUserEvent = typeof userEvents.$inferInsert;
