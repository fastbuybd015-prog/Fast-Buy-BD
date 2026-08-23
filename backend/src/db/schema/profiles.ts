import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./_shared";
import { userRoleEnum, userStatusEnum } from "./enums";

/**
 * Application user profile.
 *
 * Supabase Auth owns identity (email, password, sessions) in `auth.users`.
 * This table owns everything the *business* needs, above all the role — which
 * is read from here on every request and never trusted from the client.
 *
 * NOTE: the foreign key to `auth.users(id)` is added in a dedicated SQL
 * migration in Phase B6. Drizzle deliberately does not manage the `auth`
 * schema, which belongs to Supabase.
 */
export const profiles = pgTable(
  "profiles",
  {
    id: primaryId(),

    /** Matches `auth.users.id`. One profile per authenticated identity. */
    authUserId: uuid().notNull(),

    role: userRoleEnum().notNull().default("CUSTOMER"),
    status: userStatusEnum().notNull().default("ACTIVE"),

    fullName: text().notNull(),
    phone: text(),
    avatarUrl: text(),

    ...timestamps,
  },
  (t) => [
    uniqueIndex("profiles_auth_user_id_key").on(t.authUserId),
    // Admin screens filter users by role, and by role within a status.
    index("profiles_role_idx").on(t.role),
    index("profiles_status_idx").on(t.status),
  ],
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
