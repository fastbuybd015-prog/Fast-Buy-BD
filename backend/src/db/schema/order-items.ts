import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, money, primaryId } from "./_shared";
import { orders } from "./orders";
import { products } from "./products";
import { storeOrders } from "./store-orders";
import { storeProducts } from "./store-products";

/**
 * A purchased line, frozen at the moment of purchase.
 *
 * The `*Snapshot` columns and the price columns exist so that an order printed
 * today still shows what the customer actually bought and paid — even after
 * the store raises the price, renames the product, or delists it entirely.
 * Historical orders are never re-rendered from current catalogue data
 * (Backend Master Context §43).
 */
export const orderItems = pgTable(
  "order_items",
  {
    id: primaryId(),

    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    storeOrderId: uuid()
      .notNull()
      .references(() => storeOrders.id, { onDelete: "cascade" }),

    /** Kept for analytics and "buy again"; nulled if the catalogue row goes. */
    productId: uuid().references(() => products.id, { onDelete: "set null" }),
    storeProductId: uuid().references(() => storeProducts.id, { onDelete: "set null" }),

    // --- Frozen copies, never updated after insert -------------------------
    productNameSnapshot: text().notNull(),
    storeNameSnapshot: text().notNull(),
    unitSnapshot: text().notNull(),
    imageUrlSnapshot: text(),

    quantity: integer().notNull(),

    /** What the customer paid per unit. */
    unitPrice: money().notNull(),
    /** List price at that time, for showing "you saved ৳x". */
    originalUnitPrice: money().notNull(),
    discountAmount: money().notNull().default("0"),
    lineTotal: money().notNull(),

    ...createdAt,
  },
  (t) => [
    index("order_items_order_id_idx").on(t.orderId),
    index("order_items_store_order_id_idx").on(t.storeOrderId),
    // Best-seller analytics and co-purchase ("frequently bought together").
    index("order_items_product_id_idx").on(t.productId),

    check("order_items_quantity_positive", sql`quantity > 0`),
    check("order_items_unit_price_non_negative", sql`unit_price >= 0`),
    check("order_items_line_total_consistent", sql`line_total = unit_price * quantity`),
  ],
);

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
