import { sql } from "drizzle-orm";
import { boolean, index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./_shared";
import { profiles } from "./profiles";

/** Customer delivery addresses. A customer may keep several. */
export const addresses = pgTable(
  "addresses",
  {
    id: primaryId(),

    userId: uuid()
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    /** Free-form label such as "Home" or "Office". */
    label: text(),

    recipientName: text().notNull(),
    phone: text().notNull(),

    addressLine: text().notNull(),
    city: text().notNull(),
    area: text(),
    postalCode: text(),

    isDefault: boolean().notNull().default(false),

    ...timestamps,
  },
  (t) => [
    index("addresses_user_id_idx").on(t.userId),
    // Enforce "at most one default address per customer" in the database
    // rather than hoping the application always remembers to unset the old one.
    uniqueIndex("addresses_one_default_per_user_key").on(t.userId).where(sql`${t.isDefault}`),
  ],
);

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;
