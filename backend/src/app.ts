import { randomUUID } from "node:crypto";
import Fastify, { type FastifyInstance } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { API_PREFIX } from "./config/constants.js";
import { env } from "./config/env.js";
import { healthRoutes } from "./modules/health/health.route.js";
import authPlugin from "./plugins/auth.js";
import corsPlugin from "./plugins/cors.js";
import errorHandlerPlugin from "./plugins/error-handler.js";
import securityPlugin from "./plugins/security.js";
import swaggerPlugin from "./plugins/swagger.js";
import { apiRoutes } from "./routes.js";

/**
 * Builds a fully configured Fastify instance without starting it.
 *
 * Kept separate from `server.ts` so integration tests can call
 * `buildApp()` and use `app.inject()` with no network involved.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.logLevel,
      // Never log credentials or tokens (Backend Master Context §142).
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          'req.headers["x-api-key"]',
          "res.headers['set-cookie']",
          "*.password",
          "*.accessToken",
          "*.refreshToken",
          "*.transactionId",
        ],
        remove: true,
      },
      ...(env.isProduction
        ? {}
        : {
            transport: {
              target: "pino-pretty",
              options: {
                colorize: true,
                translateTime: "HH:MM:ss",
                ignore: "pid,hostname",
              },
            },
          }),
    },
    // Trust the incoming request id when a proxy supplies one, otherwise
    // generate a UUID. Every log line carries it (Backend Master Context §143).
    requestIdHeader: "x-request-id",
    genReqId: () => randomUUID(),
    // Reject oversized JSON bodies early. File uploads go to Supabase Storage.
    bodyLimit: 1_048_576, // 1 MiB
    ajv: { customOptions: { coerceTypes: false } },
  }).withTypeProvider<ZodTypeProvider>();

  // Zod becomes the single source of truth for validation AND OpenAPI schemas.
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Surface the request id to the client so users can quote it in bug reports.
  app.addHook("onSend", async (request, reply) => {
    reply.header("X-Request-Id", request.id);
  });

  await app.register(securityPlugin);
  await app.register(corsPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(swaggerPlugin);
  await app.register(authPlugin);

  // Infrastructure endpoint, deliberately outside the versioned API.
  await app.register(healthRoutes);

  // All business endpoints.
  await app.register(apiRoutes, { prefix: API_PREFIX });

  return app;
}