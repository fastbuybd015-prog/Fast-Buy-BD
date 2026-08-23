import { and, eq, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import {
  inventory,
  inventoryMovements,
  orderItems,
  orderStatusHistory,
  products,
  storeMembers,
  storeOrders,
  storeProducts,
  stores,
} from "@/db/schema";
import { ForbiddenError, NotFoundError, ValidationError } from "@/errors/app-error";
import { authenticate, getUser } from "@/plugins/auth";
import { invalidateCachePattern } from "@/utils/cache";
import { ok, successSchema } from "@/utils/response";

async function getOwnedStoreId(userId: string): Promise<string> {
  const db = getDb();
  const membership = await db.query.storeMembers.findFirst({
    where: eq(storeMembers.userId, userId),
    columns: { storeId: true },
  });
  if (!membership) throw new ForbiddenError("You do not own or manage any store.");
  return membership.storeId;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  PAYMENT_VERIFIED: ["PROCESSING"],
  PROCESSING: ["PACKED"],
  PACKED: ["SHIPPED"],
  SHIPPED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
};

export const storeDashboardRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("preHandler", authenticate);

  app.get(
    "/me",
    {
      schema: {
        tags: ["Store Dashboard"],
        summary: "Get own store profile",
        response: {
          200: successSchema(
            z.object({
              id: z.string().uuid(),
              name: z.string(),
              slug: z.string(),
              description: z.string().nullable(),
              logoUrl: z.string().nullable(),
              coverUrl: z.string().nullable(),
              phone: z.string().nullable(),
              email: z.string().nullable(),
              addressLine: z.string().nullable(),
              city: z.string().nullable(),
              area: z.string().nullable(),
              status: z.string(),
              ratingAverage: z.string(),
              reviewCount: z.number().int(),
            }),
          ),
        },
      },
    },
    async (request) => {
      const db = getDb();
      const storeId = await getOwnedStoreId(getUser(request).profileId);

      const store = await db.query.stores.findFirst({
        where: eq(stores.id, storeId),
        columns: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logoUrl: true,
          coverUrl: true,
          phone: true,
          email: true,
          addressLine: true,
          city: true,
          area: true,
          status: true,
          ratingAverage: true,
          reviewCount: true,
        },
      });
      if (!store) throw new NotFoundError("Store not found.");
      return ok(store);
    },
  );

  app.patch(
    "/me",
    {
      schema: {
        tags: ["Store Dashboard"],
        summary: "Update own store profile",
        body: z.object({
          description: z.string().max(2000).optional(),
          phone: z.string().max(20).optional(),
          email: z.string().email().optional(),
          logoUrl: z.string().url().optional(),
          coverUrl: z.string().url().optional(),
        }),
        response: {
          200: successSchema(z.object({ updated: z.boolean() })),
        },
      },
    },
    async (request) => {
      const db = getDb();
      const storeId = await getOwnedStoreId(getUser(request).profileId);

      await db
        .update(stores)
        .set({ ...request.body, updatedAt: new Date() })
        .where(eq(stores.id, storeId));

      void invalidateCachePattern("store:detail:*");

      return ok({ updated: true });
    },
  );

  app.get(
    "/products",
    {
      schema: {
        tags: ["Store Dashboard"],
        summary: "List store's products",
        querystring: z.object({
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(50).default(20),
        }),
        response: {
          200: z.object({
            success: z.literal(true),
            data: z.array(
              z.object({
                id: z.string().uuid(),
                productId: z.string().uuid(),
                productName: z.string(),
                sku: z.string().nullable(),
                price: z.string(),
                originalPrice: z.string(),
                isActive: z.boolean(),
                available: z.number().int().nullable(),
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
      const storeId = await getOwnedStoreId(getUser(request).profileId);
      const { page, limit } = request.query;
      const offset = (page - 1) * limit;

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(storeProducts)
        .where(eq(storeProducts.storeId, storeId));

      const total = countResult?.count ?? 0;

      const rows = await db
        .select({
          id: storeProducts.id,
          productId: storeProducts.productId,
          productName: products.name,
          sku: storeProducts.sku,
          price: storeProducts.price,
          originalPrice: storeProducts.originalPrice,
          isActive: storeProducts.isActive,
          available: inventory.availableQuantity,
        })
        .from(storeProducts)
        .innerJoin(products, eq(products.id, storeProducts.productId))
        .leftJoin(inventory, eq(inventory.storeProductId, storeProducts.id))
        .where(eq(storeProducts.storeId, storeId))
        .orderBy(sql`${products.name} ASC`)
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
    "/products/:id",
    {
      schema: {
        tags: ["Store Dashboard"],
        summary: "Update store product listing",
        params: z.object({ id: z.string().uuid() }),
        body: z.object({
          price: z.string().optional(),
          originalPrice: z.string().optional(),
          isActive: z.boolean().optional(),
          sku: z.string().max(50).optional(),
        }),
        response: { 200: successSchema(z.object({ updated: z.boolean() })) },
      },
    },
    async (request) => {
      const db = getDb();
      const storeId = await getOwnedStoreId(getUser(request).profileId);

      const listing = await db.query.storeProducts.findFirst({
        where: and(eq(storeProducts.id, request.params.id), eq(storeProducts.storeId, storeId)),
        columns: { id: true },
      });
      if (!listing) throw new NotFoundError("Product listing not found.");

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (request.body.price !== undefined) updateData.price = request.body.price;
      if (request.body.originalPrice !== undefined)
        updateData.originalPrice = request.body.originalPrice;
      if (request.body.isActive !== undefined) updateData.isActive = request.body.isActive;
      if (request.body.sku !== undefined) updateData.sku = request.body.sku;

      await db.update(storeProducts).set(updateData).where(eq(storeProducts.id, listing.id));

      void invalidateCachePattern("recommendations:*");
      void invalidateCachePattern("expiry-deals:*");

      return ok({ updated: true });
    },
  );

  app.get(
    "/inventory",
    {
      schema: {
        tags: ["Store Dashboard"],
        summary: "List store inventory",
        querystring: z.object({
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(50).default(20),
          lowStock: z.coerce.boolean().optional(),
        }),
        response: {
          200: z.object({
            success: z.literal(true),
            data: z.array(
              z.object({
                storeProductId: z.string().uuid(),
                productName: z.string(),
                quantity: z.number().int(),
                reservedQuantity: z.number().int(),
                available: z.number().int().nullable(),
                lowStockThreshold: z.number().int(),
                isLowStock: z.boolean(),
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
      const storeId = await getOwnedStoreId(getUser(request).profileId);
      const { page, limit, lowStock } = request.query;
      const offset = (page - 1) * limit;

      const conditions = [eq(storeProducts.storeId, storeId)];
      if (lowStock) {
        conditions.push(
          sql`${inventory.quantity} - ${inventory.reservedQuantity} <= ${inventory.lowStockThreshold}`,
        );
      }

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(inventory)
        .innerJoin(storeProducts, eq(storeProducts.id, inventory.storeProductId))
        .where(and(...conditions));

      const total = countResult?.count ?? 0;

      const rows = await db
        .select({
          storeProductId: inventory.storeProductId,
          productName: products.name,
          quantity: inventory.quantity,
          reservedQuantity: inventory.reservedQuantity,
          available: inventory.availableQuantity,
          lowStockThreshold: inventory.lowStockThreshold,
        })
        .from(inventory)
        .innerJoin(storeProducts, eq(storeProducts.id, inventory.storeProductId))
        .innerJoin(products, eq(products.id, storeProducts.productId))
        .where(and(...conditions))
        .orderBy(sql`${products.name} ASC`)
        .limit(limit)
        .offset(offset);

      return {
        success: true as const,
        data: rows.map((r) => ({
          ...r,
          isLowStock: (r.available ?? 0) <= r.lowStockThreshold,
        })),
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
    "/inventory/:id/adjust",
    {
      schema: {
        tags: ["Store Dashboard"],
        summary: "Adjust inventory for a store product",
        params: z.object({ id: z.string().uuid() }),
        body: z.object({
          quantity: z.number().int(),
          note: z.string().max(500).optional(),
        }),
        response: {
          200: successSchema(
            z.object({
              storeProductId: z.string().uuid(),
              newQuantity: z.number().int(),
              available: z.number().int().nullable(),
            }),
          ),
        },
      },
    },
    async (request) => {
      const db = getDb();
      const userId = getUser(request).profileId;
      const storeId = await getOwnedStoreId(userId);

      const listing = await db.query.storeProducts.findFirst({
        where: and(eq(storeProducts.id, request.params.id), eq(storeProducts.storeId, storeId)),
        columns: { id: true },
      });
      if (!listing) throw new NotFoundError("Product listing not found.");

      const inv = await db.query.inventory.findFirst({
        where: eq(inventory.storeProductId, listing.id),
      });
      if (!inv) throw new NotFoundError("Inventory record not found.");

      const newQuantity = inv.quantity + request.body.quantity;
      if (newQuantity < 0) {
        throw new ValidationError("Adjustment would make quantity negative.");
      }
      if (newQuantity < inv.reservedQuantity) {
        throw new ValidationError("Cannot reduce quantity below reserved amount.");
      }

      await db
        .update(inventory)
        .set({ quantity: newQuantity, updatedAt: new Date() })
        .where(eq(inventory.id, inv.id));

      await db.insert(inventoryMovements).values({
        storeProductId: listing.id,
        type: request.body.quantity > 0 ? "STOCK_IN" : "MANUAL_ADJUSTMENT",
        quantity: request.body.quantity,
        note: request.body.note ?? null,
        createdBy: userId,
      });

      const updated = await db.query.inventory.findFirst({
        where: eq(inventory.id, inv.id),
        columns: { availableQuantity: true },
      });

      void invalidateCachePattern("expiry-deals:*");
      void invalidateCachePattern("recommendations:*");

      return ok({
        storeProductId: listing.id,
        newQuantity,
        available: updated?.availableQuantity ?? null,
      });
    },
  );

  app.get(
    "/orders",
    {
      schema: {
        tags: ["Store Dashboard"],
        summary: "List store's orders",
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
                orderId: z.string().uuid(),
                subtotal: z.string(),
                total: z.string(),
                status: z.string(),
                itemCount: z.number().int(),
                createdAt: z.coerce.date(),
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
      const storeId = await getOwnedStoreId(getUser(request).profileId);
      const { status, page, limit } = request.query;
      const offset = (page - 1) * limit;

      const conditions = [eq(storeOrders.storeId, storeId)];
      if (status) {
        conditions.push(eq(storeOrders.status, status));
      }

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(storeOrders)
        .where(and(...conditions));

      const total = countResult?.count ?? 0;

      const rows = await db
        .select({
          id: storeOrders.id,
          orderId: storeOrders.orderId,
          subtotal: storeOrders.subtotal,
          total: storeOrders.total,
          status: storeOrders.status,
          createdAt: storeOrders.createdAt,
          itemCount: sql<number>`(
            SELECT COUNT(*)::int FROM order_items oi WHERE oi.store_order_id = ${storeOrders.id}
          )`,
        })
        .from(storeOrders)
        .where(and(...conditions))
        .orderBy(sql`${storeOrders.createdAt} DESC`)
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
    "/orders/:id",
    {
      schema: {
        tags: ["Store Dashboard"],
        summary: "Get store order details",
        params: z.object({ id: z.string().uuid() }),
        response: {
          200: successSchema(
            z.object({
              id: z.string().uuid(),
              orderId: z.string().uuid(),
              subtotal: z.string(),
              discountTotal: z.string(),
              deliveryFee: z.string(),
              total: z.string(),
              status: z.string(),
              items: z.array(
                z.object({
                  id: z.string().uuid(),
                  productNameSnapshot: z.string(),
                  unitSnapshot: z.string(),
                  quantity: z.number().int(),
                  unitPrice: z.string(),
                  lineTotal: z.string(),
                  imageUrlSnapshot: z.string().nullable(),
                }),
              ),
            }),
          ),
        },
      },
    },
    async (request) => {
      const db = getDb();
      const storeId = await getOwnedStoreId(getUser(request).profileId);

      const so = await db.query.storeOrders.findFirst({
        where: and(eq(storeOrders.id, request.params.id), eq(storeOrders.storeId, storeId)),
      });
      if (!so) throw new NotFoundError("Store order not found.");

      const items = await db
        .select({
          id: orderItems.id,
          productNameSnapshot: orderItems.productNameSnapshot,
          unitSnapshot: orderItems.unitSnapshot,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          lineTotal: orderItems.lineTotal,
          imageUrlSnapshot: orderItems.imageUrlSnapshot,
        })
        .from(orderItems)
        .where(eq(orderItems.storeOrderId, so.id));

      return ok({
        id: so.id,
        orderId: so.orderId,
        subtotal: so.subtotal,
        discountTotal: so.discountTotal,
        deliveryFee: so.deliveryFee,
        total: so.total,
        status: so.status,
        items,
      });
    },
  );

  app.patch(
    "/orders/:id/status",
    {
      schema: {
        tags: ["Store Dashboard"],
        summary: "Update store order status",
        params: z.object({ id: z.string().uuid() }),
        body: z.object({
          status: z.enum(["PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"]),
          note: z.string().max(500).optional(),
        }),
        response: { 200: successSchema(z.object({ updated: z.boolean() })) },
      },
    },
    async (request) => {
      const db = getDb();
      const userId = getUser(request).profileId;
      const storeId = await getOwnedStoreId(userId);

      const so = await db.query.storeOrders.findFirst({
        where: and(eq(storeOrders.id, request.params.id), eq(storeOrders.storeId, storeId)),
      });
      if (!so) throw new NotFoundError("Store order not found.");

      const allowed = VALID_TRANSITIONS[so.status];
      if (!allowed?.includes(request.body.status)) {
        throw new ValidationError(
          `Cannot transition from "${so.status}" to "${request.body.status}".`,
        );
      }

      await db.transaction(async (tx) => {
        await tx
          .update(storeOrders)
          .set({ status: request.body.status, updatedAt: new Date() })
          .where(eq(storeOrders.id, so.id));

        await tx.insert(orderStatusHistory).values({
          orderId: so.orderId,
          storeOrderId: so.id,
          previousStatus: so.status,
          newStatus: request.body.status,
          changedBy: userId,
          note: request.body.note ?? null,
        });
      });

      void invalidateCachePattern("analytics:admin:*");
      void invalidateCachePattern("analytics:store:*");

      return ok({ updated: true });
    },
  );
};
