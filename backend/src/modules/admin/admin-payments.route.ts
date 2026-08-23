import { and, eq, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import {
  auditLogs,
  notifications,
  orderStatusHistory,
  orders,
  payments,
  profiles,
  storeOrders,
} from "@/db/schema";
import { NotFoundError, ValidationError } from "@/errors/app-error";
import { authenticate, getUser, requireRole } from "@/plugins/auth";
import { broadcastOrderUpdate } from "@/plugins/websocket";
import { invalidateCachePattern } from "@/utils/cache";
import { ok, successSchema } from "@/utils/response";

const adminPaymentSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  orderNumber: z.string(),
  userId: z.string().uuid(),
  customerName: z.string(),
  method: z.string(),
  amount: z.string(),
  payerNumber: z.string().nullable(),
  transactionId: z.string().nullable(),
  proofUrl: z.string().nullable(),
  status: z.string(),
  submittedAt: z.coerce.date().nullable(),
  verifiedBy: z.string().uuid().nullable(),
  verifiedAt: z.coerce.date().nullable(),
  rejectionReason: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const adminPaymentRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requireRole("ADMIN"));

  app.get(
    "/",
    {
      schema: {
        tags: ["Admin - Payments"],
        summary: "List payments for admin verification",
        querystring: z.object({
          status: z.enum(["PENDING", "SUBMITTED", "VERIFIED", "REJECTED", "REFUNDED"]).optional(),
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(50).default(20),
        }),
        response: {
          200: z.object({
            success: z.literal(true),
            data: z.array(adminPaymentSchema),
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
      const { status, page, limit } = request.query;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (status) {
        conditions.push(eq(payments.status, status));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(payments)
        .where(whereClause);

      const total = countResult?.count ?? 0;

      const rows = await db
        .select({
          id: payments.id,
          orderId: payments.orderId,
          orderNumber: orders.orderNumber,
          userId: payments.userId,
          customerName: profiles.fullName,
          method: payments.method,
          amount: payments.amount,
          payerNumber: payments.payerNumber,
          transactionId: payments.transactionId,
          proofUrl: payments.proofUrl,
          status: payments.status,
          submittedAt: payments.submittedAt,
          verifiedBy: payments.verifiedBy,
          verifiedAt: payments.verifiedAt,
          rejectionReason: payments.rejectionReason,
          createdAt: payments.createdAt,
        })
        .from(payments)
        .innerJoin(orders, eq(orders.id, payments.orderId))
        .innerJoin(profiles, eq(profiles.id, payments.userId))
        .where(whereClause)
        .orderBy(sql`${payments.submittedAt} DESC NULLS LAST`)
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
        },
      };
    },
  );

  app.get(
    "/:id",
    {
      schema: {
        tags: ["Admin - Payments"],
        summary: "Get payment details for admin",
        params: z.object({ id: z.string().uuid() }),
        response: { 200: successSchema(adminPaymentSchema) },
      },
    },
    async (request) => {
      const db = getDb();

      const [row] = await db
        .select({
          id: payments.id,
          orderId: payments.orderId,
          orderNumber: orders.orderNumber,
          userId: payments.userId,
          customerName: profiles.fullName,
          method: payments.method,
          amount: payments.amount,
          payerNumber: payments.payerNumber,
          transactionId: payments.transactionId,
          proofUrl: payments.proofUrl,
          status: payments.status,
          submittedAt: payments.submittedAt,
          verifiedBy: payments.verifiedBy,
          verifiedAt: payments.verifiedAt,
          rejectionReason: payments.rejectionReason,
          createdAt: payments.createdAt,
        })
        .from(payments)
        .innerJoin(orders, eq(orders.id, payments.orderId))
        .innerJoin(profiles, eq(profiles.id, payments.userId))
        .where(eq(payments.id, request.params.id));

      if (!row) throw new NotFoundError("Payment not found.");
      return ok(row);
    },
  );

  app.patch(
    "/:id/verify",
    {
      schema: {
        tags: ["Admin - Payments"],
        summary: "Verify a submitted payment",
        params: z.object({ id: z.string().uuid() }),
        response: { 200: successSchema(z.object({ verified: z.boolean() })) },
      },
    },
    async (request) => {
      const db = getDb();
      const adminId = getUser(request).profileId;

      const payment = await db.query.payments.findFirst({
        where: eq(payments.id, request.params.id),
      });
      if (!payment) throw new NotFoundError("Payment not found.");

      if (payment.status === "VERIFIED") {
        return ok({ verified: true });
      }

      if (payment.status !== "SUBMITTED") {
        throw new ValidationError(`Cannot verify payment with status "${payment.status}".`);
      }

      await db.transaction(async (tx) => {
        await tx
          .update(payments)
          .set({
            status: "VERIFIED",
            verifiedBy: adminId,
            verifiedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));

        await tx
          .update(orders)
          .set({
            paymentStatus: "VERIFIED",
            orderStatus: "PAYMENT_VERIFIED",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, payment.orderId));

        await tx
          .update(storeOrders)
          .set({ status: "PAYMENT_VERIFIED", updatedAt: new Date() })
          .where(eq(storeOrders.orderId, payment.orderId));

        await tx.insert(orderStatusHistory).values({
          orderId: payment.orderId,
          previousStatus: "PAYMENT_SUBMITTED",
          newStatus: "PAYMENT_VERIFIED",
          changedBy: adminId,
        });

        await tx.insert(notifications).values({
          userId: payment.userId,
          type: "PAYMENT_VERIFIED",
          title: "Payment Verified",
          message: "Your payment has been verified. Your order is now being processed.",
          referenceType: "order",
          referenceId: payment.orderId,
        });

        await tx.insert(auditLogs).values({
          actorId: adminId,
          action: "PAYMENT_VERIFY",
          entityType: "payment",
          entityId: payment.id,
          previousData: { status: payment.status },
          newData: { status: "VERIFIED" },
          ipAddress: request.ip,
        });
      });

      broadcastOrderUpdate(payment.orderId, {
        orderId: payment.orderId,
        paymentStatus: "VERIFIED",
        orderStatus: "PAYMENT_VERIFIED",
      });

      void invalidateCachePattern("analytics:admin:*");
      void invalidateCachePattern("analytics:store:*");

      return ok({ verified: true });
    },
  );

  app.patch(
    "/:id/reject",
    {
      schema: {
        tags: ["Admin - Payments"],
        summary: "Reject a submitted payment",
        params: z.object({ id: z.string().uuid() }),
        body: z.object({
          rejectionReason: z.string().min(1).max(500),
        }),
        response: { 200: successSchema(z.object({ rejected: z.boolean() })) },
      },
    },
    async (request) => {
      const db = getDb();
      const adminId = getUser(request).profileId;

      const payment = await db.query.payments.findFirst({
        where: eq(payments.id, request.params.id),
      });
      if (!payment) throw new NotFoundError("Payment not found.");

      if (payment.status === "REJECTED") {
        return ok({ rejected: true });
      }

      if (payment.status !== "SUBMITTED") {
        throw new ValidationError(`Cannot reject payment with status "${payment.status}".`);
      }

      await db.transaction(async (tx) => {
        await tx
          .update(payments)
          .set({
            status: "REJECTED",
            verifiedBy: adminId,
            verifiedAt: new Date(),
            rejectionReason: request.body.rejectionReason,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));

        await tx
          .update(orders)
          .set({
            paymentStatus: "REJECTED",
            orderStatus: "PENDING_PAYMENT",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, payment.orderId));

        await tx.insert(notifications).values({
          userId: payment.userId,
          type: "PAYMENT_REJECTED",
          title: "Payment Rejected",
          message: `Your payment was rejected: ${request.body.rejectionReason}`,
          referenceType: "order",
          referenceId: payment.orderId,
        });

        await tx.insert(auditLogs).values({
          actorId: adminId,
          action: "PAYMENT_REJECT",
          entityType: "payment",
          entityId: payment.id,
          previousData: { status: payment.status },
          newData: { status: "REJECTED", rejectionReason: request.body.rejectionReason },
          ipAddress: request.ip,
        });
      });

      broadcastOrderUpdate(payment.orderId, {
        orderId: payment.orderId,
        paymentStatus: "REJECTED",
        orderStatus: "PENDING_PAYMENT",
      });

      void invalidateCachePattern("analytics:admin:*");
      void invalidateCachePattern("analytics:store:*");

      return ok({ rejected: true });
    },
  );
};
