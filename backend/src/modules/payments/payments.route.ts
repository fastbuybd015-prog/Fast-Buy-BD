import { and, eq, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import { orders, payments } from "@/db/schema";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/errors/app-error";
import { authenticate, getUser } from "@/plugins/auth";
import { RATE_LIMITS } from "@/plugins/rate-limit";
import { broadcastOrderUpdate } from "@/plugins/websocket";
import { ok, successSchema } from "@/utils/response";

const paymentSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  method: z.string(),
  amount: z.string(),
  payerNumber: z.string().nullable(),
  transactionId: z.string().nullable(),
  proofUrl: z.string().nullable(),
  status: z.string(),
  submittedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

export const paymentRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("preHandler", authenticate);

  app.post(
    "/",
    {
      preHandler: [RATE_LIMITS.paymentSubmit],
      schema: {
        tags: ["Payments"],
        summary: "Submit manual payment proof",
        body: z.object({
          orderId: z.string().uuid(),
          method: z.enum(["BKASH", "NAGAD", "ROCKET"]),
          payerNumber: z.string().min(5).max(20).optional(),
          transactionId: z.string().min(1).max(100).optional(),
          proofUrl: z.string().max(500).optional(),
        }),
        response: { 201: successSchema(paymentSchema) },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const userId = getUser(request).profileId;
      const { orderId, method, payerNumber, transactionId, proofUrl } = request.body;

      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        columns: { id: true, userId: true, grandTotal: true, paymentStatus: true },
      });
      if (!order) throw new NotFoundError("Order not found.");
      if (order.userId !== userId) throw new ForbiddenError("This order does not belong to you.");

      if (order.paymentStatus === "VERIFIED") {
        throw new ConflictError("Payment has already been verified for this order.");
      }

      const existingPayment = await db.query.payments.findFirst({
        where: and(
          eq(payments.orderId, orderId),
          sql`${payments.status} IN ('PENDING', 'SUBMITTED', 'VERIFIED')`,
        ),
        columns: { id: true },
      });
      if (existingPayment) {
        throw new ConflictError("A payment is already pending or verified for this order.");
      }

      if (transactionId) {
        const duplicate = await db.query.payments.findFirst({
          where: eq(payments.transactionId, transactionId),
          columns: { id: true },
        });
        if (duplicate) {
          throw new ValidationError("This transaction ID has already been used.");
        }
      }

      const [created] = await db
        .insert(payments)
        .values({
          orderId,
          userId,
          method,
          amount: order.grandTotal,
          payerNumber: payerNumber ?? null,
          transactionId: transactionId ?? null,
          proofUrl: proofUrl ?? null,
          status: "SUBMITTED",
          submittedAt: new Date(),
        })
        .returning();

      const payment = created as NonNullable<typeof created>;

      await db
        .update(orders)
        .set({
          paymentStatus: "SUBMITTED",
          orderStatus: "PAYMENT_SUBMITTED",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      broadcastOrderUpdate(orderId, {
        orderId,
        paymentStatus: "SUBMITTED",
        orderStatus: "PAYMENT_SUBMITTED",
      });

      return reply.status(201).send(
        ok({
          id: payment.id,
          orderId: payment.orderId,
          method: payment.method,
          amount: payment.amount,
          payerNumber: payment.payerNumber,
          transactionId: payment.transactionId,
          proofUrl: payment.proofUrl,
          status: payment.status,
          submittedAt: payment.submittedAt,
          createdAt: payment.createdAt,
        }),
      );
    },
  );

  app.get(
    "/",
    {
      schema: {
        tags: ["Payments"],
        summary: "List current user's payments",
        querystring: z.object({
          orderId: z.string().uuid().optional(),
        }),
        response: { 200: successSchema(z.array(paymentSchema)) },
      },
    },
    async (request) => {
      const db = getDb();
      const userId = getUser(request).profileId;

      const conditions = [eq(payments.userId, userId)];
      if (request.query.orderId) {
        conditions.push(eq(payments.orderId, request.query.orderId));
      }

      const rows = await db
        .select({
          id: payments.id,
          orderId: payments.orderId,
          method: payments.method,
          amount: payments.amount,
          payerNumber: payments.payerNumber,
          transactionId: payments.transactionId,
          proofUrl: payments.proofUrl,
          status: payments.status,
          submittedAt: payments.submittedAt,
          createdAt: payments.createdAt,
        })
        .from(payments)
        .where(and(...conditions))
        .orderBy(sql`${payments.createdAt} DESC`);

      return ok(rows);
    },
  );
};
