import { sql } from "drizzle-orm";
import { boolean, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, primaryId } from "./_shared";
import { notificationTypeEnum } from "./enums";
import { profiles } from "./profiles";

/**
 * In-app notifications.
 *
 * Stored first, delivered second: Supabase Realtime pushes the row to the
 * customer's open tab, but the record here is what the notification centre
 * shows when they come back tomorrow. Realtime is a delivery mechanism, never
 * the source of truth (Backend Master Context §105).
 */
export const notifications = pgTable(
  "notifications",
  {
    id: primaryId(),

    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    type: notificationTypeEnum().notNull(),

    title: text().notNull(),
    message: text().notNull(),

    /** What to open when tapped, e.g. "order" + the order id. */
    referenceType: text(),
    referenceId: uuid(),

    isRead: boolean().notNull().default(false),

    ...createdAt,
  },
  (t) => [
    // The notification list: this user's, newest first.
    index("notifications_user_created_idx").on(t.userId, t.createdAt),
    // The unread badge count — a partial index, since read rows are the bulk.
    index("notifications_unread_idx").on(t.userId).where(sql`${t.isRead} = false`),
  ],
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
