import { boolean, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./_shared";
import { settingValueTypeEnum } from "./enums";

/**
 * Runtime platform configuration, editable by an admin.
 *
 * Everything the business might want to change without a deployment lives
 * here as a key/value pair — delivery fee, free-delivery threshold, the bKash
 * / Nagad / Rocket receiver numbers, trial length, subscription price,
 * support contacts, maintenance mode.
 *
 * The alternative — scattering these values through the source — is exactly
 * what Master Project Context §55 forbids.
 *
 * `valueType` tells the reader how to parse `value`; `isPublic` marks the
 * settings that are safe to hand to the browser (the delivery threshold is,
 * an internal toggle is not).
 */
export const systemSettings = pgTable(
  "system_settings",
  {
    id: primaryId(),

    /** Dotted key, e.g. "delivery.default_fee". */
    key: text().notNull(),
    value: text().notNull(),
    valueType: settingValueTypeEnum().notNull().default("STRING"),

    /** Grouping for the admin settings screen. */
    group: text().notNull().default("general"),
    label: text(),
    description: text(),

    isPublic: boolean().notNull().default(false),

    ...timestamps,
  },
  (t) => [uniqueIndex("system_settings_key_key").on(t.key)],
);

export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;
