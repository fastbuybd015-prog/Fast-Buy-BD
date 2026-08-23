import { sql } from "drizzle-orm";
import { index, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./_shared";
import { cartStatusEnum } from "./enums";
import { profiles } from "./profiles";

/**
 * A signed-in customer's cart, so it follows them between devices.
 *
 * Guests keep their cart in localStorage and merge it here on login.
 * The cart stores no prices at all — checkout recalculates everything from
 * the live listing (Backend Master Context §38–39).
 */
export const carts = pgTable(
  "carts",
  {
    id: primaryId(),

    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    status: cartStatusEnum().notNull().default("ACTIVE"),

    ...timestamps,
  },
  (t) => [
    // A customer has at most one open cart; converted/abandoned ones are kept
    // for analytics.
    uniqueIndex("carts_one_active_per_user_key").on(t.userId).where(sql`${t.status} = 'ACTIVE'`),
    index("carts_user_id_idx").on(t.userId),
  ],
);

export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;
