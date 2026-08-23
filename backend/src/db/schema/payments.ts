import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { money, primaryId, timestamps } from "./_shared";
import { paymentMethodEnum, paymentStatusEnum } from "./enums";
import { orders } from "./orders";
import { profiles } from "./profiles";

/**
 * A manual bKash / Nagad / Rocket payment submitted for admin verification.
 *
 * The customer pays outside FastShopBD and then submits proof. The platform
 * therefore stores ONLY references — sender number, transaction id, optional
 * screenshot.
 *
 * It must never store a PIN, an OTP, or any banking credential. There is
 * deliberately no column that could hold one (Master Project Context §50).
 *
 * `amount` is written by the server from the order total; a figure sent by
 * the client is ignored (Backend Master Context §56).
 */
export const payments = pgTable(
  "payments",
  {
    id: primaryId(),

    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),

    method: paymentMethodEnum().notNull(),
    amount: money().notNull(),

    /** The customer's mobile wallet number that sent the money. */
    payerNumber: text(),
    /** The reference the wallet gave them. */
    transactionId: text(),
    /** Private Supabase Storage path — never a public URL. */
    proofUrl: text(),

    status: paymentStatusEnum().notNull().default("PENDING"),

    submittedAt: timestamp({ withTimezone: true }),

    /** Who approved or refused it, and when. */
    verifiedBy: uuid().references(() => profiles.id, { onDelete: "set null" }),
    verifiedAt: timestamp({ withTimezone: true }),
    rejectionReason: text(),

    ...timestamps,
  },
  (t) => [
    // One transaction id can back only one payment, so the same screenshot
    // cannot be replayed against a second order.
    uniqueIndex("payments_transaction_id_key")
      .on(t.transactionId)
      .where(sql`${t.transactionId} is not null`),

    // At most one payment per order may be in flight or accepted; a rejected
    // attempt leaves the customer free to submit again.
    uniqueIndex("payments_one_open_per_order_key")
      .on(t.orderId)
      .where(sql`${t.status} in ('PENDING', 'SUBMITTED', 'VERIFIED')`),

    index("payments_order_id_idx").on(t.orderId),
    index("payments_user_id_idx").on(t.userId),
    // The admin verification queue.
    index("payments_status_submitted_idx").on(t.status, t.submittedAt),

    check("payments_amount_positive", sql`amount > 0`),
    // A refusal must always say why — the customer is shown this reason.
    check(
      "payments_rejection_has_reason",
      sql`status <> 'REJECTED' or rejection_reason is not null`,
    ),
  ],
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
