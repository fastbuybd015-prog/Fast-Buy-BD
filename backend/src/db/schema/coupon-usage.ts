import { index, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createdAt, money, primaryId } from "./_shared";
import { coupons } from "./coupons";
import { orders } from "./orders";
import { profiles } from "./profiles";

/**
 * One redemption of a coupon.
 *
 * Written inside the order-creation transaction, so per-user and global usage
 * limits cannot be beaten by submitting checkout twice at once.
 */
export const couponUsage = pgTable(
  "coupon_usage",
  {
    id: primaryId(),

    couponId: uuid()
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),

    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    /** What the customer actually saved, after any maximum-discount cap. */
    discountAmount: money().notNull(),

    ...createdAt,
  },
  (t) => [
    // A coupon counts once per order, whatever the client retries.
    uniqueIndex("coupon_usage_coupon_order_key").on(t.couponId, t.orderId),
    // The per-user limit check.
    index("coupon_usage_coupon_user_idx").on(t.couponId, t.userId),
    index("coupon_usage_order_id_idx").on(t.orderId),
  ],
);

export type CouponUsage = typeof couponUsage.$inferSelect;
export type NewCouponUsage = typeof couponUsage.$inferInsert;
