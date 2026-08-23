import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, primaryId } from "./_shared";
import { orderStatusEnum } from "./enums";
import { orders } from "./orders";
import { profiles } from "./profiles";
import { storeOrders } from "./store-orders";

/**
 * Every fulfilment status change, append-only.
 *
 * Two jobs: it is the audit trail for "who moved this order to SHIPPED and
 * when", and it is the data behind the customer's tracking timeline.
 *
 * A row may describe the parent order or one store's slice — exactly one of
 * `orderId` / `storeOrderId` carries the meaning for a given transition.
 */
export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: primaryId(),

    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    /** Set when the change applied to a single store's slice. */
    storeOrderId: uuid().references(() => storeOrders.id, { onDelete: "cascade" }),

    /** Null on the very first entry, when the order is created. */
    previousStatus: orderStatusEnum(),
    newStatus: orderStatusEnum().notNull(),

    /** Null when the platform made the change automatically. */
    changedBy: uuid().references(() => profiles.id, { onDelete: "set null" }),

    note: text(),

    ...createdAt,
  },
  (t) => [
    // The tracking timeline: this order's transitions in order.
    index("order_status_history_order_created_idx").on(t.orderId, t.createdAt),
    index("order_status_history_store_order_id_idx").on(t.storeOrderId),
    index("order_status_history_changed_by_idx").on(t.changedBy),
  ],
);

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type NewOrderStatusHistory = typeof orderStatusHistory.$inferInsert;
