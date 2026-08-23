import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { HEALTH_CHECK_TIMEOUT_MS } from "@/config/constants";
import { env } from "@/config/env";
import { pingRedis } from "@/config/redis";
import { pingDatabase } from "@/db";

/**
 * GET /health  (Backend Master Context §16)
 *
 * Reports the real state of each dependency. It never claims a dependency is
 * healthy without actually reaching it, and never leaks connection strings,
 * credentials or host names.
 */

const SERVICE_STATUS = ["ok", "error", "not_configured"] as const;
type ServiceStatus = (typeof SERVICE_STATUS)[number];

const healthResponseSchema = z.object({
  status: z.enum(["ok", "degraded", "error"]),
  timestamp: z.iso.datetime(),
  uptimeSeconds: z.number(),
  environment: z.string(),
  services: z.object({
    database: z.enum(SERVICE_STATUS),
    redis: z.enum(SERVICE_STATUS),
  }),
});

async function withTimeout(probe: () => Promise<void>, ms: number): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`Health check timed out after ${ms}ms`)), ms);
  });

  try {
    await Promise.race([probe(), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function checkService(
  configured: boolean,
  probe: () => Promise<void>,
): Promise<ServiceStatus> {
  if (!configured) return "not_configured";

  try {
    await withTimeout(probe, HEALTH_CHECK_TIMEOUT_MS);
    return "ok";
  } catch {
    return "error";
  }
}

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        summary: "Service health",
        description:
          "Reports API liveness and the live status of each dependency. " +
          "`not_configured` means the corresponding environment variables have not been set yet.",
        response: { 200: healthResponseSchema, 503: healthResponseSchema },
      },
    },
    async (request, reply) => {
      const [database, redis] = await Promise.all([
        checkService(env.isDatabaseConfigured, pingDatabase),
        checkService(env.isRedisConfigured, pingRedis),
      ]);

      // The database is essential; Redis is a cache and may be absent by design.
      const status = database === "error" ? "error" : database === "ok" ? "ok" : "degraded";

      if (status !== "ok") {
        request.log.warn({ database, redis }, "Health check is not fully green");
      }

      return reply.status(status === "error" ? 503 : 200).send({
        status,
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
        environment: env.nodeEnv,
        services: { database, redis },
      });
    },
  );
};
