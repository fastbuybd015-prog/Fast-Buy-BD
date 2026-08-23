import { and, eq, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import {
  inventory,
  inventoryMovements,
  notifications,
  orderItems,
  orderStatusHistory,
  orders,
  profiles,
  storeOrders,
} from "@/db/schema";
import { NotFoundError, ValidationError } from "@/errors/app-error";
import { authenticate, getUser, requireRole } from "@/plugins/auth";
import { broadcastOrderUpdate } from "@/plugins/websocket";
import { invalidateCachePattern } from "@/utils/cache";
import { ok, successSchema } from "@/utils/response";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAYMENT_SUBMITTED: ["PAYMENT_VERIFIED", "CANCELLED"],
  PAYMENT_VERIFIED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
};

export const adminOrderRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requireRole("ADMIN"));

  app.get(
    "/",
    {
      schema: {
        tags: ["Admin - Orders"],
        summary: "List all orders (admin)",
        querystring: z.object({
          status: z
            .enum([
              "PENDING_PAYMENT",
              "PAYMENT_SUBMITTED",
              "PAYMENT_VERIFIED",
              "PROCESSING",
              "PACKED",
              "SHIPPED",
              "OUT_FOR_DELIVERY",
              "DELIVERED",
              "CANCELLED",
              "REFUNDED",
            ])
            .optional(),
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(50).default(20),
        }),
        response: {
          200: z.object({
            success: z.literal(true),
            data: z.array(
              z.object({
                id: z.string().uuid(),
                orderNumber: z.string(),
                customerName: z.string(),
                grandTotal: z.string(),
                paymentStatus: z.string(),
                orderStatus: z.string(),
                placedAt: z.coerce.date(),
              }),
            ),
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
        conditions.push(eq(orders.orderStatus, status));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(whereClause);

      const total = countResult?.count ?? 0;

      const rows = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          customerName: profiles.fullName,
          grandTotal: orders.grandTotal,
          paymentStatus: orders.paymentStatus,
          orderStatus: orders.orderStatus,
          placedAt: orders.placedAt,
        })
        .from(orders)
        .innerJoin(profiles, eq(profiles.id, orders.userId))
        .where(whereClause)
        .orderBy(sql`${orders.placedAt} DESC`)
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

  app.patch(
    "/:id/status",
    {
      schema: {
        tags: ["Admin - Orders"],
        summary: "Update order status (admin)",
        params: z.object({ id: z.string().uuid() }),
        body: z.object({
          status: z.enum([
            "PAYMENT_VERIFIED",
            "PROCESSING",
            "PACKED",
            "SHIPPED",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "CANCELLED",
            "REFUNDED",
          ]),
          note: z.string().max(500).optional(),
          cancellationReason: z.string().max(500).optional(),
        }),
        response: { 200: successSchema(z.object({ updated: z.boolean() })) },
      },
    },
    async (request) => {
      const db = getDb();
      const adminId = getUser(request).profileId;

      const order = await db.query.orders.findFirst({
        where: eq(orders.id, request.params.id),
      });
      if (!order) throw new NotFoundError("Order not found.");

      const allowed = VALID_TRANSITIONS[order.orderStatus];
      if (!allowed?.includes(request.body.status)) {
        throw new ValidationError(
          `Cannot transition from "${order.orderStatus}" to "${request.body.status}".`,
        );
      }

      await db.transaction(async (tx) => {
        const updateData: Record<string, unknown> = {
          orderStatus: request.body.status,
          updatedAt: new Date(),
        };

        if (request.body.status === "CANCELLED") {
          updateData.cancelledAt = new Date();
          updateData.cancellationReason = request.body.cancellationReason ?? "Cancelled by admin";

          const items = await tx
            .select({
              storeProductId: orderItems.storeProductId,
              quantity: orderItems.quantity,
            })
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));

          for (const item of items) {
            if (!item.storeProductId) continue;

            await tx
              .update(inventory)
              .set({
                reservedQuantity: sql`GREATEST(${inventory.reservedQuantity} - ${item.quantity}, 0)`,
                updatedAt: new Date(),
              })
              .where(eq(inventory.storeProductId, item.storeProductId));

            await tx.insert(inventoryMovements).values({
              storeProductId: item.storeProductId,
              type: "ORDER_RELEASED",
              quantity: item.quantity,
              referenceType: "order",
              referenceId: order.id,
            });
          }
        }

        await tx.update(orders).set(updateData).where(eq(orders.id, order.id));

        await tx
          .update(storeOrders)
          .set({ status: request.body.status, updatedAt: new Date() })
          .where(eq(storeOrders.orderId, order.id));

        await tx.insert(orderStatusHistory).values({
          orderId: order.id,
          previousStatus: order.orderStatus,
          newStatus: request.body.status,
          changedBy: adminId,
          note: request.body.note ?? null,
        });

        const notificationType = STATUS_NOTIFICATION_MAP[request.body.status];
        if (notificationType) {
          await tx.insert(notifications).values({
            userId: order.userId,
            type: notificationType,
            title: STATUS_TITLE_MAP[request.body.status] ?? "Order Update",
            message: `Your order ${order.orderNumber} status has been updated to ${request.body.status.replace(/_/g, " ").toLowerCase()}.`,
            referenceType: "order",
            referenceId: order.id,
          });
        }
      });

      broadcastOrderUpdate(order.id, {
        orderId: order.id,
        orderStatus: request.body.status,
        timestamp: new Date().toISOString(),
      });

      void invalidateCachePattern("analytics:admin:*");
      void invalidateCachePattern("analytics:store:*");

      return ok({ updated: true });
    },
  );
};

type NotificationType =
  | "PAYMENT_VERIFIED"
  | "PAYMENT_REJECTED"
  | "ORDER_PROCESSING"
  | "ORDER_PACKED"
  | "ORDER_SHIPPED"
  | "ORDER_OUT_FOR_DELIVERY"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED"
  | "NEW_STORE_ORDER"
  | "LOW_STOCK";

const STATUS_NOTIFICATION_MAP: Record<string, NotificationType> = {
  PROCESSING: "ORDER_PROCESSING",
  PACKED: "ORDER_PACKED",
  SHIPPED: "ORDER_SHIPPED",
  OUT_FOR_DELIVERY: "ORDER_OUT_FOR_DELIVERY",
  DELIVERED: "ORDER_DELIVERED",
  CANCELLED: "ORDER_CANCELLED",
};

const STATUS_TITLE_MAP: Record<string, string> = {
  PROCESSING: "Order Processing",
  PACKED: "Order Packed",
  SHIPPED: "Order Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Order Delivered",
  CANCELLED: "Order Cancelled",
};
