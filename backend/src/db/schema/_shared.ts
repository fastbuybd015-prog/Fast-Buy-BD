import { numeric, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Column helpers shared by every table, so the conventions below are applied
 * consistently instead of being retyped (and mistyped) 30 times.
 *
 * Conventions (Backend Master Context §21–24, Supabase Postgres best practices):
 *   - `uuid` primary keys: safe to expose in URLs, no enumerable sequence.
 *   - `timestamptz` everywhere: never a naive `timestamp`.
 *   - `numeric` for money: exact decimal arithmetic, never float.
 *   - `text` for strings: no artificial varchar(n) limits.
 */

/** Standard primary key. */
export const primaryId = () => uuid().primaryKey().defaultRandom();

/**
 * Money column — BDT with two decimal places, up to 9,999,999,999.99.
 *
 * Drizzle returns numeric as a **string** on purpose: converting to a JS
 * `number` would reintroduce floating-point error. Use `src/utils/money.ts`
 * for any arithmetic; Postgres itself computes SUM/AVG exactly.
 */
export const money = () => numeric({ precision: 12, scale: 2 });

/** Rating value in the range 0.00–5.00. */
export const rating = () => numeric({ precision: 3, scale: 2 });

/** `created_at` / `updated_at`, both database-generated. */
export const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
};

/** `created_at` only — for append-only tables such as event and audit logs. */
export const createdAt = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
};
