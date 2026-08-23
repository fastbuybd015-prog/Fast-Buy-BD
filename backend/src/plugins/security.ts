import helmet from "@fastify/helmet";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { env } from "@/config/env";

/**
 * Security headers (Master Project Context §142).
 *
 * CSP is disabled because this process only serves JSON plus the Swagger UI
 * (which needs inline styles/scripts). The browser-facing app is the separate
 * Next.js deployment, which sets its own CSP.
 */
async function securityPlugin(app: FastifyInstance): Promise<void> {
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    // Allow the frontend on another origin to read API responses.
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: env.isProduction ? { maxAge: 31_536_000, includeSubDomains: true } : false,
  });
}

export default fp(securityPlugin, { name: "fastshopbd-security" });
