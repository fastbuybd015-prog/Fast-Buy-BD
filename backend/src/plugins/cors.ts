import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { env } from "@/config/env";

/**
 * CORS.
 *
 * Only the configured frontend origins may call this API from a browser.
 * `origin: "*"` is deliberately not used — this API is authenticated
 * (Backend Master Context §149).
 */
async function corsPlugin(app: FastifyInstance): Promise<void> {
  const allowed = new Set(env.corsOrigins);

  await app.register(cors, {
    origin(origin, callback) {
      // Same-origin, curl, server-to-server and health probes send no Origin.
      if (!origin) return callback(null, true);

      if (allowed.has(origin)) return callback(null, true);

      app.log.warn({ origin }, "Blocked cross-origin request from a non-allowed origin");
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id", "Idempotency-Key"],
    exposedHeaders: ["X-Request-Id"],
    maxAge: 86_400,
  });
}

export default fp(corsPlugin, { name: "fastshopbd-cors" });
