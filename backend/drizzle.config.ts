import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit configuration.
 *
 * Migration workflow (Backend Master Context §178):
 *   1. edit a schema file in src/db/schema/
 *   2. bun run db:generate   → writes SQL into ./drizzle
 *   3. review the generated SQL
 *   4. bun run db:migrate    → applies it
 *   5. commit the migration files
 *
 * Never change the Supabase schema by hand in the dashboard — the repository
 * must stay the single source of truth for the database structure.
 */

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  ...(databaseUrl ? { dbCredentials: { url: databaseUrl } } : {}),
  casing: "snake_case",
  verbose: true,
  strict: true,
});
