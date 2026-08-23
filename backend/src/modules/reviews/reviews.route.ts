import { and, eq, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import { orderItems, orders, products, profiles, reviews } from "@/db/schema";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/errors/app-error";
import { authenticate, getUser, optionalAuth } from "@/plugins/auth";
import { ok, successSchema } from "@/utils/response";

const reviewSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  userName: z.string(),
  rating: z.number().int(),
  comment: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const reviewRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/:productId/reviews",
    {
      preHandler: [optionalAuth],
      schema: {
        tags: ["Reviews"],
        summary: "List product reviews",
        params: z.object({ productId: z.string().uuid() }),
        querystring: z.object({
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(50).default(10),
        }),
        response: {
          200: z.object({
            success: z.literal(true),
            data: z.array(reviewSchema),
            meta: z.object({
              page: z.number().int(),
              limit: z.number().int(),
              total: z.number().int(),
              totalPages: z.number().int(),
              averageRating: z.string(),
            }),
          }),
        },
      },
    },
    async (request) => {
      const db = getDb();
      const { productId } = request.params;
      const { page, limit } = request.query;
      const offset = (page - 1) * limit;

      const [countResult] = await db
        .select({
          count: sql<number>`count(*)::int`,
          avg: sql<string>`COALESCE(ROUND(AVG(${reviews.rating}), 2), 0)`,
        })
        .from(reviews)
        .where(and(eq(reviews.productId, productId), eq(reviews.status, "APPROVED")));

      const total = countResult?.count ?? 0;
      const averageRating = countResult?.avg ?? "0";

      const rows = await db
        .select({
          id: reviews.id,
          userId: reviews.userId,
          userName: profiles.fullName,
          rating: reviews.rating,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
        })
        .from(reviews)
        .innerJoin(profiles, eq(profiles.id, reviews.userId))
        .where(and(eq(reviews.productId, productId), eq(reviews.status, "APPROVED")))
        .orderBy(sql`${reviews.createdAt} DESC`)
        .limit(limit)
        .offset(offset);

      return {
        success: true as const,
        data: rows,
        meta: {
          page,
          limit,
          total,
          totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
          averageRating,
        },
      };
    },
  );

  app.post(
    "/:productId/reviews",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Reviews"],
        summary: "Submit product review",
        params: z.object({ productId: z.string().uuid() }),
        body: z.object({
          orderItemId: z.string().uuid(),
          rating: z.number().int().min(1).max(5),
          comment: z.string().max(2000).optional(),
        }),
        response: { 201: successSchema(reviewSchema) },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const userId = getUser(request).profileId;
      const { productId } = request.params;
      const { orderItemId, rating, comment } = request.body;

      const product = await db.query.products.findFirst({
        where: eq(products.id, productId),
        columns: { id: true },
      });
      if (!product) throw new NotFoundError("Product not found.");

      const oi = await db.query.orderItems.findFirst({
        where: eq(orderItems.id, orderItemId),
        columns: { id: true, orderId: true, productId: true },
      });
      if (!oi) throw new NotFoundError("Order item not found.");
      if (oi.productId !== productId) {
        throw new ValidationError("Order item does not match this product.");
      }

      const order = await db.query.orders.findFirst({
        where: eq(orders.id, oi.orderId),
        columns: { userId: true, orderStatus: true },
      });
      if (!order) throw new NotFoundError("Order not found.");
      if (order.userId !== userId) throw new ForbiddenError("This order does not belong to you.");
      if (order.orderStatus !== "DELIVERED") {
        throw new ValidationError("You can only review products from delivered orders.");
      }

      const existing = await db.query.reviews.findFirst({
        where: eq(reviews.orderItemId, orderItemId),
        columns: { id: true },
      });
      if (existing) {
        throw new ConflictError("You have already reviewed this item.");
      }

      const [created] = await db
        .insert(reviews)
        .values({
          userId,
          productId,
          orderItemId,
          rating,
          comment: comment ?? null,
        })
        .returning();

      const review = created as NonNullable<typeof created>;

      const [stats] = await db
        .select({
          avg: sql<string>`ROUND(AVG(${reviews.rating}), 2)`,
          count: sql<number>`count(*)::int`,
        })
        .from(reviews)
        .where(and(eq(reviews.productId, productId), eq(reviews.status, "APPROVED")));

      if (stats) {
        await db
          .update(products)
          .set({
            ratingAverage: stats.avg,
            reviewCount: stats.count,
            updatedAt: new Date(),
          })
          .where(eq(products.id, productId));
      }

      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.id, userId),
        columns: { fullName: true },
      });

      return reply.status(201).send(
        ok({
          id: review.id,
          userId: review.userId,
          userName: profile?.fullName ?? "User",
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        }),
      );
    },
  );
};
