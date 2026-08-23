import { index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, primaryId } from "./_shared";
import { inventoryMovementTypeEnum } from "./enums";
import { profiles } from "./profiles";
import { storeProducts } from "./store-products";

/**
 * Append-only ledger of every stock change.
 *
 * `inventory` holds the current balance; this table explains how it got there.
 * Without it, "why does this store show 3 units?" is unanswerable — with it,
 * every unit is traceable to a restock, an order, or a manual correction.
 */
export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: primaryId(),

    storeProductId: uuid()
      .notNull()
      .references(() => storeProducts.id, { onDelete: "cascade" }),

    type: inventoryMovementTypeEnum().notNull(),

    /** Signed: positive adds stock, negative removes it. */
    quantity: integer().notNull(),

    /** What caused the movement, e.g. "order" + the order id. */
    referenceType: text(),
    referenceId: uuid(),

    note: text(),

    /** Null for system-generated movements such as order reservations. */
    createdBy: uuid().references(() => profiles.id, { onDelete: "set null" }),

    ...createdAt,
  },
  (t) => [
    // "History for this listing, newest first" — the store owner's stock log.
    index("inventory_movements_store_product_created_idx").on(t.storeProductId, t.createdAt),
    index("inventory_movements_reference_idx").on(t.referenceType, t.referenceId),
    index("inventory_movements_created_by_idx").on(t.createdBy),
  ],
);

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type NewInventoryMovement = typeof inventoryMovements.$inferInsert;
