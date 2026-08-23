import { sql } from "drizzle-orm";
import { boolean, check, integer, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { money, primaryId, timestamps } from "./_shared";

/**
 * Membership plans.
 *
 * The existing frontend hard-codes "1-day free trial, ৳50/month". Those
 * numbers move here so an admin can change the price or trial length without
 * a code deployment (Master Project Context §135).
 */
export const subscriptionPlans = pgTable(
  "subscription_plans",
  {
    id: primaryId(),

    name: text().notNull(),
    slug: text().notNull(),
    description: text(),

    price: money().notNull(),
    /** Length of a paid cycle. */
    durationDays: integer().notNull().default(30),
    /** Free trial length for a first-time member. */
    trialHours: integer().notNull().default(24),

    isActive: boolean().notNull().default(true),

    ...timestamps,
  },
  (t) => [
    uniqueIndex("subscription_plans_slug_key").on(t.slug),

    check("subscription_plans_price_non_negative", sql`price >= 0`),
    check("subscription_plans_duration_positive", sql`duration_days > 0`),
    check("subscription_plans_trial_non_negative", sql`trial_hours >= 0`),
  ],
);

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
