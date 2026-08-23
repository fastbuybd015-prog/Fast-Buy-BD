import { eq, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import { coupons } from "@/db/schema";
import { NotFoundError } from "@/errors/app-error";
import { authenticate, requireRole } from "@/plugins/auth";
import { ok, successSchema } from "@/utils/response";

const couponSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  description: z.string().nullable(),
  type: z.string(),
  value: z.string(),
  minimumOrder: z.string(),
  maximumDiscount: z.string().nullable(),
  startsAt: z.coerce.date().nullable(),
  expiresAt: z.coerce.date().nullable(),
  usageLimit: z.number().int().nullable(),
  perUserLimit: z.number().int().nullable(),
  usedCount: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
});

export const adminCouponRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requireRole("ADMIN"));

  app.get(
    "/",
    {
      schema: {
        tags: ["Admin - Coupons"],
        summary: "List all coupons",
        querystring: z.object({
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(50).default(20),
        }),
        response: {
          200: z.object({
            success: z.literal(true),
            data: z.array(couponSchema),
            meta: z.object({
              page: z.number().int(),
              limit: z.number().int(),
              total: z.number().int(),
              totalPages: z.number().int(),
            }),
          }),
        },
      },
    },
    async (request) => {
      const db = getDb();
      const { page, limit } = request.query;
      const offset = (page - 1) * limit;

      const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(coupons);

      const total = countResult?.count ?? 0;

      const rows = await db.query.coupons.findMany({
        orderBy: (c, { desc }) => [desc(c.createdAt)],
        limit,
        offset,
      });

      return {
        success: true as const,
        data: rows,
        meta: {
          page,
          limit,
          total,
          totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
        },
      };
    },
  );

  app.post(
    "/",
    {
      schema: {
        tags: ["Admin - Coupons"],
        summary: "Create coupon",
        body: z.object({
          code: z.string().min(1).max(50),
          description: z.string().max(500).optional(),
          type: z.enum(["PERCENTAGE", "FIXED"]),
          value: z.string(),
          minimumOrder: z.string().default("0"),
          maximumDiscount: z.string().optional(),
          startsAt: z.coerce.date().optional(),
          expiresAt: z.coerce.date().optional(),
          usageLimit: z.number().int().min(1).optional(),
          perUserLimit: z.number().int().min(1).optional(),
          isActive: z.boolean().default(true),
        }),
        response: { 201: successSchema(couponSchema) },
      },
    },
    async (request, reply) => {
      const db = getDb();

      const [created] = await db
        .insert(coupons)
        .values({
          code: request.body.code,
          description: request.body.description ?? null,
          type: request.body.type,
          value: request.body.value,
          minimumOrder: request.body.minimumOrder,
          maximumDiscount: request.body.maximumDiscount ?? null,
          startsAt: request.body.startsAt ?? null,
          expiresAt: request.body.expiresAt ?? null,
          usageLimit: request.body.usageLimit ?? null,
          perUserLimit: request.body.perUserLimit ?? null,
          isActive: request.body.isActive,
        })
        .returning();

      return reply.status(201).send(ok(created as NonNullable<typeof created>));
    },
  );

  app.patch(
    "/:id",
    {
      schema: {
        tags: ["Admin - Coupons"],
        summary: "Update coupon",
        params: z.object({ id: z.string().uuid() }),
        body: z.object({
          description: z.string().max(500).optional(),
          value: z.string().optional(),
          minimumOrder: z.string().optional(),
          maximumDiscount: z.string().nullable().optional(),
          startsAt: z.coerce.date().nullable().optional(),
          expiresAt: z.coerce.date().nullable().optional(),
          usageLimit: z.number().int().min(1).nullable().optional(),
          perUserLimit: z.number().int().min(1).nullable().optional(),
          isActive: z.boolean().optional(),
        }),
        response: { 200: successSchema(z.object({ updated: z.boolean() })) },
      },
    },
    async (request) => {
      const db = getDb();

      const existing = await db.query.coupons.findFirst({
        where: eq(coupons.id, request.params.id),
        columns: { id: true },
      });
      if (!existing) throw new NotFoundError("Coupon not found.");

      await db
        .update(coupons)
        .set({ ...request.body, updatedAt: new Date() })
        .where(eq(coupons.id, existing.id));

      return ok({ updated: true });
    },
  );
};
