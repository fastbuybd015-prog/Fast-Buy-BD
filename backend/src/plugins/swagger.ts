import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { jsonSchemaTransform, jsonSchemaTransformObject } from "fastify-type-provider-zod";
import { APP_NAME, DOCS_ROUTE } from "@/config/constants";
import { env } from "@/config/env";

/**
 * OpenAPI 3.1 documentation, generated from the Zod schemas on each route.
 *
 * Because the schemas are the same objects used for runtime validation, the
 * docs cannot drift from the implementation (Backend Master Context §17).
 */
async function swaggerPlugin(app: FastifyInstance): Promise<void> {
  if (!env.enableSwagger) {
    app.log.info("Swagger UI is disabled (set ENABLE_SWAGGER=true to expose it).");
    return;
  }

  await app.register(swagger, {
    openapi: {
      openapi: "3.1.0",
      info: {
        title: `${APP_NAME} API`,
        description: [
          "REST API for FastShopBD — a smart hyperlocal e-commerce and personalized",
          "shopping optimization platform.",
          "",
          "All responses use a single envelope:",
          "",
          "```json",
          '{ "success": true,  "data": { } }',
          '{ "success": false, "error": { "code": "...", "message": "..." } }',
          "```",
        ].join("\n"),
        version: "1.0.0",
      },
      servers: [
        {
          url: env.isProduction ? "/" : `http://localhost:${env.port}`,
          description: env.isProduction ? "Production" : "Local development",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Supabase Auth access token: `Authorization: Bearer <token>`",
          },
        },
      },
      tags: [
        { name: "Health", description: "Service and dependency status" },
        { name: "Catalog", description: "Products, categories, brands and stores" },
        { name: "Cart", description: "Customer shopping cart" },
        { name: "Checkout", description: "Server-authoritative checkout calculation" },
        { name: "Orders", description: "Multi-store orders and tracking" },
        { name: "Payments", description: "Manual bKash / Nagad / Rocket payment flow" },
        { name: "Smart", description: "Price comparison, budget basket and optimizer" },
        { name: "Admin", description: "Platform administration" },
        { name: "Store", description: "Store owner operations" },
      ],
    },
    transform: jsonSchemaTransform,
    transformObject: jsonSchemaTransformObject,
  });

  await app.register(swaggerUi, {
    routePrefix: DOCS_ROUTE,
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      persistAuthorization: true,
    },
  });
}

export default fp(swaggerPlugin, { name: "fastshopbd-swagger" });
