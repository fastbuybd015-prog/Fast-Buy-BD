import { and, eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import { coupons, couponUsage } from "@/db/schema";
import { authenticate, getUser } from "@/plugins/auth";
import { ok, successSchema } from "@/utils/response";

const couponValidationSchema = z.object({
  code: z.string(),
  valid: z.boolean(),
  type: z.string().optional(),
  value: z.string().optional(),
  minimumOrder: z.string().optional(),
  maximumDiscount: z.string().nullable().optional(),
  reason: z.string().optional(),
});

export const couponRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("preHandler", authenticate);

  app.post(
    "/validate",
    {
      schema: {
        tags: ["Coupons"],
        summary: "Validate a coupon code",
        body: z.object({
          code: z.string().min(1).max(50),
          subtotal: z.coerce.number().min(0).optional(),
        }),
        response: { 200: successSchema(couponValidationSchema) },
      },
    },
    async (request) => {
      const db = getDb();
      const userId = getUser(request).profileId;
      const { code, subtotal } = request.body;

      const coupon = await db.query.coupons.findFirst({
        where: eq(coupons.code, code),
      });

      if (!coupon?.isActive) {
        return ok({ code, valid: false, reason: "Coupon not found or inactive." });
      }

      const now = new Date();
      if (coupon.startsAt && now < coupon.startsAt) {
        return ok({ code, valid: false, reason: "Coupon is not yet active." });
      }
      if (coupon.expiresAt && now > coupon.expiresAt) {
        return ok({ code, valid: false, reason: "Coupon has expired." });
      }
      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        return ok({ code, valid: false, reason: "Coupon usage limit reached." });
      }
      if (subtotal !== undefined && Number(coupon.minimumOrder) > subtotal) {
        return ok({
          code,
          valid: false,
          reason: `Minimum order of ৳${coupon.minimumOrder} required.`,
        });
      }

      if (coupon.perUserLimit !== null) {
        const usage = await db.query.couponUsage.findMany({
          where: and(eq(couponUsage.couponId, coupon.id), eq(couponUsage.userId, userId)),
          columns: { id: true },
        });
        if (usage.length >= coupon.perUserLimit) {
          return ok({ code, valid: false, reason: "You have reached the usage limit." });
        }
      }

      return ok({
        code,
        valid: true,
        type: coupon.type,
        value: coupon.value,
        minimumOrder: coupon.minimumOrder,
        maximumDiscount: coupon.maximumDiscount,
      });
    },
  );
};
