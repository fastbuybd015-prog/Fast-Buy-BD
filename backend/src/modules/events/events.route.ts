import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import { searchHistory, userEvents } from "@/db/schema";
import { optionalAuth } from "@/plugins/auth";
import { ok, successSchema } from "@/utils/response";

export const eventRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("preHandler", optionalAuth);

  app.post(
    "/",
    {
      schema: {
        tags: ["Events"],
        summary: "Track user event",
        body: z.object({
          eventType: z.enum([
            "PRODUCT_VIEW",
            "PRODUCT_CLICK",
            "SEARCH",
            "ADD_TO_CART",
            "REMOVE_FROM_CART",
            "FAVORITE",
            "RECOMMENDATION_CLICK",
          ]),
          productId: z.string().uuid().optional(),
          storeProductId: z.string().uuid().optional(),
          sessionId: z.string().max(100).optional(),
          metadata: z.record(z.string(), z.unknown()).optional(),
        }),
        response: { 201: successSchema(z.object({ tracked: z.boolean() })) },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const userId = request.user?.profileId ?? null;

      await db.insert(userEvents).values({
        userId,
        sessionId: request.body.sessionId ?? null,
        eventType: request.body.eventType,
        productId: request.body.productId ?? null,
        storeProductId: request.body.storeProductId ?? null,
        metadata: request.body.metadata ?? null,
      });

      return reply.status(201).send(ok({ tracked: true }));
    },
  );

  app.post(
    "/search",
    {
      schema: {
        tags: ["Events"],
        summary: "Track search query",
        body: z.object({
          query: z.string().min(1).max(200),
          resultCount: z.number().int().min(0),
          sessionId: z.string().max(100).optional(),
          clickedProductId: z.string().uuid().optional(),
        }),
        response: { 201: successSchema(z.object({ tracked: z.boolean() })) },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const userId = request.user?.profileId ?? null;

      await db.insert(searchHistory).values({
        userId,
        sessionId: request.body.sessionId ?? null,
        query: request.body.query,
        resultCount: request.body.resultCount,
        clickedProductId: request.body.clickedProductId ?? null,
      });

      return reply.status(201).send(ok({ tracked: true }));
    },
  );
};
