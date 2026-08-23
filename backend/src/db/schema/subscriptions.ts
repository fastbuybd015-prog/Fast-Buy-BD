import { sql } from "drizzle-orm";
import { index, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./_shared";
import { subscriptionStatusEnum } from "./enums";
import { profiles } from "./profiles";
import { subscriptionPlans } from "./subscription-plans";

/**
 * A customer's membership state.
 *
 * Every timestamp here is written by the server. The trial countdown the
 * customer sees is derived from `trialExpiresAt`, so clearing browser storage
 * cannot restart a trial — which is exactly what the current localStorage
 * implementation allows (Frontend Master Context §130).
 */
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: primaryId(),

    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    planId: uuid()
      .notNull()
      .references(() => subscriptionPlans.id, { onDelete: "restrict" }),

    status: subscriptionStatusEnum().notNull().default("TRIAL"),

    trialStartedAt: timestamp({ withTimezone: true }),
    trialExpiresAt: timestamp({ withTimezone: true }),

    startedAt: timestamp({ withTimezone: true }),
    expiresAt: timestamp({ withTimezone: true }),
    cancelledAt: timestamp({ withTimezone: true }),

    ...timestamps,
  },
  (t) => [
    // A customer holds at most one live membership; lapsed rows stay as history.
    uniqueIndex("subscriptions_one_live_per_user_key")
      .on(t.userId)
      .where(sql`${t.status} in ('TRIAL', 'ACTIVE')`),
    index("subscriptions_user_id_idx").on(t.userId),
    index("subscriptions_plan_id_idx").on(t.planId),
    // Sweep for memberships that have lapsed.
    index("subscriptions_status_expires_idx").on(t.status, t.expiresAt),
  ],
);

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
