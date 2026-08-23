import { sql } from "drizzle-orm";
import { check, index, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { money, primaryId, timestamps } from "./_shared";
import { orderStatusEnum } from "./enums";
import { orders } from "./orders";
import { stores } from "./stores";

/**
 * The per-store slice of a customer order.
 *
 *   Order FSB-20260818-A1B2C
 *     ├── Fast Mart      — packed
 *     ├── Daily Basket   — processing
 *     └── Green Valley   — shipped
 *
 * Each store fulfils, and is measured on, only its own slice. This is what a
 * store owner sees in their dashboard, and what store analytics aggregate.
 * Its `status` therefore moves independently of the sibling stores'.
 */
export const storeOrders = pgTable(
  "store_orders",
  {
    id: primaryId(),

    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    storeId: uuid()
      .notNull()
      .references(() => stores.id, { onDelete: "restrict" }),

    subtotal: money().notNull(),
    discountTotal: money().notNull().default("0"),
    /** Delivery is charged per participating store (Backend Master Context §90). */
    deliveryFee: money().notNull().default("0"),
    total: money().notNull(),

    status: orderStatusEnum().notNull().default("PENDING_PAYMENT"),

    ...timestamps,
  },
  (t) => [
    // One slice per store per order.
    uniqueIndex("store_orders_order_store_key").on(t.orderId, t.storeId),
    index("store_orders_order_id_idx").on(t.orderId),
    // The store owner's work queue: "my store's orders in this state".
    index("store_orders_store_status_idx").on(t.storeId, t.status),

    check("store_orders_subtotal_non_negative", sql`subtotal >= 0`),
    check("store_orders_total_non_negative", sql`total >= 0`),
    check("store_orders_total_consistent", sql`total = subtotal - discount_total + delivery_fee`),
  ],
);

export type StoreOrder = typeof storeOrders.$inferSelect;
export type NewStoreOrder = typeof storeOrders.$inferInsert;
