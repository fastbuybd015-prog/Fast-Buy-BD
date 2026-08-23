import { index, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createdAt, primaryId } from "./_shared";
import { storeMemberRoleEnum } from "./enums";
import { profiles } from "./profiles";
import { stores } from "./stores";

/**
 * Links people to the stores they may operate.
 *
 * This join table — rather than a single `owner_id` column on `stores` — is
 * what every store-scoped authorization check reads: "is this user a member of
 * the store they are trying to modify?" It also lets a store add managers and
 * staff later without a schema change (Backend Master Context §29).
 */
export const storeMembers = pgTable(
  "store_members",
  {
    id: primaryId(),

    storeId: uuid()
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),

    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    role: storeMemberRoleEnum().notNull().default("OWNER"),

    ...createdAt,
  },
  (t) => [
    // A person holds exactly one role in a given store.
    uniqueIndex("store_members_store_user_key").on(t.storeId, t.userId),
    index("store_members_store_id_idx").on(t.storeId),
    // The hot path: "which stores may this user manage?"
    index("store_members_user_id_idx").on(t.userId),
  ],
);

export type StoreMember = typeof storeMembers.$inferSelect;
export type NewStoreMember = typeof storeMembers.$inferInsert;
