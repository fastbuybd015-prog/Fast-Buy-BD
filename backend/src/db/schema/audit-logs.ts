import { index, inet, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, primaryId } from "./_shared";
import { profiles } from "./profiles";

/**
 * Who did what, to which record, and what changed.
 *
 * Written for the operations that move money or trust: verifying and
 * rejecting payments, adjusting stock, changing prices, overriding an order
 * status, verifying a store, changing someone's role.
 *
 * `previousData` / `newData` hold the before-and-after of the affected fields
 * only. Never put a token, password or payment credential in them
 * (Backend Master Context §145).
 */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: primaryId(),

    /** Null if the platform acted on its own, e.g. a scheduled job. */
    actorId: uuid().references(() => profiles.id, { onDelete: "set null" }),

    /** Verb, e.g. "PAYMENT_VERIFY", "INVENTORY_ADJUST", "ROLE_CHANGE". */
    action: text().notNull(),

    entityType: text().notNull(),
    entityId: uuid(),

    previousData: jsonb(),
    newData: jsonb(),

    ipAddress: inet(),

    ...createdAt,
  },
  (t) => [
    // "Everything this admin did" and "the history of this record".
    index("audit_logs_actor_created_idx").on(t.actorId, t.createdAt),
    index("audit_logs_entity_idx").on(t.entityType, t.entityId),
    index("audit_logs_action_created_idx").on(t.action, t.createdAt),
  ],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
