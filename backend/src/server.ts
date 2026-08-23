import type { FastifyInstance } from "fastify";
import { buildApp } from "@/app";
import { API_PREFIX, DOCS_ROUTE } from "@/config/constants";
import { env } from "@/config/env";
import { closeRedis } from "@/config/redis";
import { closeDatabase } from "@/db";

/**
 * Process entry point: builds the app, starts listening and shuts down cleanly.
 */

function logStartupSummary(app: FastifyInstance): void {
  const base = `http://localhost:${env.port}`;

  app.log.info(`FastShopBD API listening on ${base}`);
  app.log.info(`  API   ${base}${API_PREFIX}`);
  app.log.info(`  Health ${base}/health`);
  if (env.enableSwagger) app.log.info(`  Docs  ${base}${DOCS_ROUTE}`);

  if (env.missingOptionalConfig.length > 0) {
    app.log.warn(
      `Not configured yet: ${env.missingOptionalConfig.join(", ")}. ` +
        "Endpoints depending on them will return 503 until you fill in backend/.env.",
    );
  }

  if (!env.isRedisConfigured) {
    app.log.info("REDIS_URL is not set — caching is disabled and PostgreSQL is queried directly.");
  }
}

/** Close the HTTP server and every open connection, once. */
function registerShutdownHandlers(app: FastifyInstance): void {
  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;

    app.log.info(`${signal} received — shutting down gracefully.`);

    try {
      await app.close();
      await Promise.all([closeDatabase(), closeRedis()]);
      app.log.info("Shutdown complete.");
      process.exit(0);
    } catch (error) {
      app.log.error({ err: error }, "Error during shutdown");
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  process.on("unhandledRejection", (reason) => {
    app.log.error({ err: reason }, "Unhandled promise rejection");
  });

  process.on("uncaughtException", (error) => {
    app.log.fatal({ err: error }, "Uncaught exception — exiting");
    process.exit(1);
  });
}

async function main(): Promise<void> {
  const app = await buildApp();

  registerShutdownHandlers(app);

  try {
    await app.listen({ port: env.port, host: env.host });
    logStartupSummary(app);
  } catch (error) {
    app.log.fatal({ err: error }, "Failed to start the server");
    process.exit(1);
  }
}

void main();
