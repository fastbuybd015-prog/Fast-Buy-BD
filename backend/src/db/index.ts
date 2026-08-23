import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/config/env";
import { ServiceUnavailableError } from "@/errors/app-error";
import * as schema from "./schema";

/**
 * Drizzle ORM + Supabase PostgreSQL connection.
 *
 * Drizzle is the ONLY database access layer for business logic — the Supabase
 * JS client is never used as a second ORM (Backend Master Context §20).
 *
 * The connection is created lazily so the server can boot (and serve /health
 * and /docs) before DATABASE_URL has been filled in.
 */

type Sql = ReturnType<typeof postgres>;
export type Database = ReturnType<typeof drizzle<typeof schema>>;

let sqlClient: Sql | undefined;
let database: Database | undefined;

/**
 * Supabase's transaction pooler (port 6543) cannot use prepared statements.
 * Detect it so local (5432) and serverless (6543) URLs both work unchanged.
 */
function usesTransactionPooler(connectionString: string): boolean {
  try {
    const url = new URL(connectionString);
    return url.port === "6543" || url.searchParams.get("prepare") === "false";
  } catch {
    return false;
  }
}

function connect(connectionString: string): { client: Sql; db: Database } {
  const transactionPooler = usesTransactionPooler(connectionString);

  const client = postgres(connectionString, {
    // Transaction-mode pooling multiplexes connections; keep the pool tiny and
    // disable prepared statements.
    prepare: !transactionPooler,
    max: transactionPooler ? 1 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
  });

  return { client, db: drizzle(client, { schema, casing: "snake_case" }) };
}

/**
 * Returns the Drizzle instance.
 *
 * Throws a 503 (never a silent fallback) when the database is not configured,
 * so a missing DATABASE_URL can never be mistaken for "no data".
 */
export function getDb(): Database {
  if (database) return database;

  if (!env.databaseUrl) {
    throw new ServiceUnavailableError(
      "The database is not configured. Set DATABASE_URL in backend/.env.",
    );
  }

  const connection = connect(env.databaseUrl);
  sqlClient = connection.client;
  database = connection.db;
  return database;
}

/** True when a connection has actually been opened. */
export function isDatabaseConnected(): boolean {
  return database !== undefined;
}

/** Lightweight liveness probe used by /health. */
export async function pingDatabase(): Promise<void> {
  await getDb().execute(sql`select 1`);
}

export async function closeDatabase(): Promise<void> {
  if (!sqlClient) return;
  await sqlClient.end({ timeout: 5 });
  sqlClient = undefined;
  database = undefined;
}
