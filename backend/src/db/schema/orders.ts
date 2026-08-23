import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { money, primaryId, timestamps } from "./_shared";
import { addresses } from "./addresses";
import { orderStatusEnum, paymentStatusEnum } from "./enums";
import { profiles } from "./profiles";

/**
 * The customer-level order — what the customer thinks of as "my order",
 * what they pay for in one go.
 *
 * Because a basket can span several stores, the fulfilment work is split into
 * child `store_orders`. This parent row carries the money and the payment.
 *
 * Every total here is computed server-side from live listings. Values sent by
 * the browser are never persisted (Backend Master Context §83).
 */
export const orders = pgTable(
  "orders",
  {
    id: primaryId(),

    /** Human-readable reference, e.g. FSB-20260818-A1B2C. Never the PK. */
    orderNumber: text().notNull(),

    userId: uuid()
      .notNull()
      // A customer with order history cannot be deleted; suspend them instead.
      .references(() => profiles.id, { onDelete: "restrict" }),

    /**
     * The address record used at checkout, kept for reference only — the
     * columns below are the authoritative copy. If the customer later edits or
     * deletes that address, this order must still show where it was delivered.
     */
    addressId: uuid().references(() => addresses.id, { onDelete: "set null" }),

    recipientNameSnapshot: text().notNull(),
    phoneSnapshot: text().notNull(),
    addressLineSnapshot: text().notNull(),
    citySnapshot: text().notNull(),
    areaSnapshot: text(),
    postalCodeSnapshot: text(),

    subtotal: money().notNull(),
    discountTotal: money().notNull().default("0"),
    deliveryTotal: money().notNull().default("0"),
    grandTotal: money().notNull(),

    /** Coupon code as applied, so a later edit to the coupon changes nothing. */
    couponCodeSnapshot: text(),

    paymentStatus: paymentStatusEnum().notNull().default("PENDING"),
    orderStatus: orderStatusEnum().notNull().default("PENDING_PAYMENT"),

    notes: text(),

    /**
     * Supplied by the client on checkout. The unique index makes a retried or
     * double-clicked request return the same order instead of creating a
     * second one (Backend Master Context §50).
     */
    idempotencyKey: text(),

    placedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    cancelledAt: timestamp({ withTimezone: true }),
    cancellationReason: text(),

    ...timestamps,
  },
  (t) => [
    uniqueIndex("orders_order_number_key").on(t.orderNumber),
    uniqueIndex("orders_idempotency_key")
      .on(t.idempotencyKey)
      .where(sql`${t.idempotencyKey} is not null`),

    // "My orders, newest first".
    index("orders_user_placed_idx").on(t.userId, t.placedAt),
    // Admin queues filtered by state.
    index("orders_order_status_idx").on(t.orderStatus),
    index("orders_payment_status_idx").on(t.paymentStatus),
    // Revenue-over-time analytics.
    index("orders_placed_at_idx").on(t.placedAt),

    check("orders_subtotal_non_negative", sql`subtotal >= 0`),
    check("orders_discount_non_negative", sql`discount_total >= 0`),
    check("orders_delivery_non_negative", sql`delivery_total >= 0`),
    check("orders_grand_total_non_negative", sql`grand_total >= 0`),
    // The headline figure must equal its parts — a rounding slip cannot hide.
    check(
      "orders_grand_total_consistent",
      sql`grand_total = subtotal - discount_total + delivery_total`,
    ),
  ],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
