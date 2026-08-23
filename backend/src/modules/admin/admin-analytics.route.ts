import { and, eq, gte, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import {
  inventory,
  orderItems,
  orders,
  payments,
  products,
  profiles,
  storeProducts,
} from "@/db/schema";
import { authenticate, requireRole } from "@/plugins/auth";
import { RATE_LIMITS } from "@/plugins/rate-limit";
import { CACHE_KEYS, CACHE_TTL, getCached, setCache } from "@/utils/cache";
import { ok, successSchema } from "@/utils/response";

function getDateRange(range: string): Date {
  const now = new Date();
  switch (range) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

export const adminAnalyticsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requireRole("ADMIN"));
  app.addHook("preHandler", RATE_LIMITS.analytics);

  app.get(
    "/overview",
    {
      schema: {
        tags: ["Admin - Analytics"],
        summary: "Platform overview stats",
        querystring: z.object({
          range: z.enum(["today", "7d", "30d"]).default("30d"),
        }),
        response: {
          200: successSchema(
            z.object({
              totalRevenue: z.string(),
              periodRevenue: z.string(),
              totalOrders: z.number().int(),
              periodOrders: z.number().int(),
              averageOrderValue: z.string(),
              totalCustomers: z.number().int(),
              periodNewCustomers: z.number().int(),
              pendingPayments: z.number().int(),
            }),
          ),
        },
      },
    },
    async (request) => {
      const range = request.query.range;
      const cacheKey = CACHE_KEYS.adminAnalytics(range);
      type OverviewResult = {
        totalRevenue: string;
        periodRevenue: string;
        totalOrders: number;
        periodOrders: number;
        averageOrderValue: string;
        totalCustomers: number;
        periodNewCustomers: number;
        pendingPayments: number;
      };
      const cached = await getCached<OverviewResult>(cacheKey);
      if (cached) return ok(cached);

      const db = getDb();
      const rangeStart = getDateRange(range);

      const [totalRev] = await db
        .select({
          sum: sql<string>`COALESCE(SUM(${orders.grandTotal}), 0)`,
          count: sql<number>`count(*)::int`,
        })
        .from(orders)
        .where(sql`${orders.orderStatus} NOT IN ('CANCELLED', 'REFUNDED')`);

      const [periodRev] = await db
        .select({
          sum: sql<string>`COALESCE(SUM(${orders.grandTotal}), 0)`,
          count: sql<number>`count(*)::int`,
        })
        .from(orders)
        .where(
          and(
            gte(orders.placedAt, rangeStart),
            sql`${orders.orderStatus} NOT IN ('CANCELLED', 'REFUNDED')`,
          ),
        );

      const [customers] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(profiles)
        .where(eq(profiles.role, "CUSTOMER"));

      const [newCustomers] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(profiles)
        .where(and(eq(profiles.role, "CUSTOMER"), gte(profiles.createdAt, rangeStart)));

      const [pendingPay] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(payments)
        .where(eq(payments.status, "SUBMITTED"));

      const totalOrders = totalRev?.count ?? 0;
      const totalRevenue = totalRev?.sum ?? "0";
      const avgOrderValue =
        totalOrders > 0 ? (Number(totalRevenue) / totalOrders).toFixed(2) : "0.00";

      const result = {
        totalRevenue,
        periodRevenue: periodRev?.sum ?? "0",
        totalOrders,
        periodOrders: periodRev?.count ?? 0,
        averageOrderValue: avgOrderValue,
        totalCustomers: customers?.count ?? 0,
        periodNewCustomers: newCustomers?.count ?? 0,
        pendingPayments: pendingPay?.count ?? 0,
      };
      await setCache(cacheKey, result, CACHE_TTL.analytics);
      return ok(result);
    },
  );

  app.get(
    "/products",
    {
      schema: {
        tags: ["Admin - Analytics"],
        summary: "Best selling products",
        querystring: z.object({
          limit: z.coerce.number().int().min(1).max(50).default(10),
        }),
        response: {
          200: successSchema(
            z.array(
              z.object({
                productId: z.string().uuid().nullable(),
                productName: z.string(),
                totalQuantity: z.number().int(),
                totalRevenue: z.string(),
              }),
            ),
          ),
        },
      },
    },
    async (request) => {
      const db = getDb();

      const rows = await db
        .select({
          productId: orderItems.productId,
          productName: orderItems.productNameSnapshot,
          totalQuantity: sql<number>`SUM(${orderItems.quantity})::int`,
          totalRevenue: sql<string>`SUM(${orderItems.lineTotal})`,
        })
        .from(orderItems)
        .groupBy(orderItems.productId, orderItems.productNameSnapshot)
        .orderBy(sql`SUM(${orderItems.quantity}) DESC`)
        .limit(request.query.limit);

      return ok(rows);
    },
  );

  app.get(
    "/low-stock",
    {
      schema: {
        tags: ["Admin - Analytics"],
        summary: "Products with low stock",
        querystring: z.object({
          limit: z.coerce.number().int().min(1).max(50).default(20),
        }),
        response: {
          200: successSchema(
            z.array(
              z.object({
                storeProductId: z.string().uuid(),
                productName: z.string(),
                available: z.number().int().nullable(),
                lowStockThreshold: z.number().int(),
              }),
            ),
          ),
        },
      },
    },
    async (request) => {
      const db = getDb();

      const rows = await db
        .select({
          storeProductId: inventory.storeProductId,
          productName: products.name,
          available: inventory.availableQuantity,
          lowStockThreshold: inventory.lowStockThreshold,
        })
        .from(inventory)
        .innerJoin(storeProducts, eq(storeProducts.id, inventory.storeProductId))
        .innerJoin(products, eq(products.id, storeProducts.productId))
        .where(
          sql`${inventory.quantity} - ${inventory.reservedQuantity} <= ${inventory.lowStockThreshold}`,
        )
        .orderBy(sql`${inventory.quantity} - ${inventory.reservedQuantity} ASC`)
        .limit(request.query.limit);

      return ok(rows);
    },
  );
};
