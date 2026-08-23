import { Redis } from "ioredis";
import { env } from "@/config/env";

/**
 * Redis connection.
 *
 * Redis is SUPPORTING infrastructure only — cache, rate limiting, expensive
 * aggregates. PostgreSQL always remains the system of record, so every caller
 * must tolerate `getRedis()` returning `undefined` and fall back to the
 * database (Master Project Context §19).
 *
 * Actual cache/rate-limit usage arrives in Phase B33; for now the connection
 * exists so /health can report it truthfully.
 */

let client: Redis | undefined;
let initialised = false;

export function getRedis(): Redis | undefined {
  if (initialised) return client;
  initialised = true;

  if (!env.redisUrl) return undefined;

  try {
    client = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      connectTimeout: 5_000,
      retryStrategy: (attempt) => (attempt <= 3 ? Math.min(attempt * 500, 2_000) : null),
    });

    // A Redis outage or bad credentials must never crash the API process.
    client.on("error", () => {});
  } catch {
    client = undefined;
  }

  return client;
}

/** Lightweight liveness probe used by /health. */
export async function pingRedis(): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis is not configured.");
  if (redis.status === "wait" || redis.status === "end") {
    await redis.connect();
  }
  await redis.ping();
}

export async function closeRedis(): Promise<void> {
  if (!client) return;
  try {
    client.disconnect();
  } catch {
    // Ignore disconnect errors during shutdown
  }
  client = undefined;
  initialised = false;
}
