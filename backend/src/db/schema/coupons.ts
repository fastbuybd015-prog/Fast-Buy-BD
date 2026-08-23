import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { money, primaryId, timestamps } from "./_shared";
import { couponTypeEnum } from "./enums";

/**
 * Discount codes.
 *
 * Validity is decided entirely server-side at checkout — the frontend may
 * display a coupon as applied, but only the backend's re-check counts
 * (Backend Master Context §92).
 */
export const coupons = pgTable(
  "coupons",
  {
    id: primaryId(),

    code: text().notNull(),
    description: text(),

    type: couponTypeEnum().notNull(),
    /** Percent when type = PERCENTAGE, taka when type = FIXED. */
    value: money().notNull(),

    /** Cart subtotal required before the coupon applies. */
    minimumOrder: money().notNull().default("0"),
    /** Ceiling for percentage coupons, so "50% off" cannot cost unbounded money. */
    maximumDiscount: money(),

    startsAt: timestamp({ withTimezone: true }),
    expiresAt: timestamp({ withTimezone: true }),

    /** Total redemptions allowed across all customers. Null = unlimited. */
    usageLimit: integer(),
    /** Redemptions allowed per customer. Null = unlimited. */
    perUserLimit: integer(),
    /** Maintained transactionally as coupons are redeemed. */
    usedCount: integer().notNull().default(0),

    isActive: boolean().notNull().default(true),

    ...timestamps,
  },
  (t) => [
    uniqueIndex("coupons_code_key").on(t.code),
    index("coupons_active_expiry_idx").on(t.isActive, t.expiresAt),

    check("coupons_value_positive", sql`value > 0`),
    check("coupons_percentage_within_range", sql`type <> 'PERCENTAGE' or value <= 100`),
    check(
      "coupons_window_ordered",
      sql`starts_at is null or expires_at is null or expires_at > starts_at`,
    ),
    check("coupons_used_count_within_limit", sql`usage_limit is null or used_count <= usage_limit`),
  ],
);

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
