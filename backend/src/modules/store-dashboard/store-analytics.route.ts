import { and, eq, gte, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import { orderItems, storeMembers, storeOrders } from "@/db/schema";
import { ForbiddenError } from "@/errors/app-error";
import { authenticate, getUser } from "@/plugins/auth";
import { RATE_LIMITS } from "@/plugins/rate-limit";
import { CACHE_KEYS, CACHE_TTL, getCached, setCache } from "@/utils/cache";
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

export const storeAnalyticsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", RATE_LIMITS.analytics);

  app.get(
    "/overview",
    {
      schema: {
        tags: ["Store Analytics"],
        summary: "Store overview stats",
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
              statusDistribution: z.record(z.string(), z.number().int()),
            }),
          ),
        },
      },
    },
    async (request) => {
      const storeId = await getOwnedStoreId(getUser(request).profileId);
      const range = request.query.range;
      const cacheKey = CACHE_KEYS.storeAnalytics(storeId, range);

      type StoreOverview = {
        totalRevenue: string;
        periodRevenue: string;
        totalOrders: number;
        periodOrders: number;
        averageOrderValue: string;
        statusDistribution: Record<string, number>;
      };

      const cached = await getCached<StoreOverview>(cacheKey);
      if (cached) return ok(cached);

      const db = getDb();
      const rangeStart = getDateRange(range);

      const [totalStats] = await db
        .select({
          sum: sql<string>`COALESCE(SUM(${storeOrders.total}), 0)`,
          count: sql<number>`count(*)::int`,
        })
        .from(storeOrders)
        .where(
          and(
            eq(storeOrders.storeId, storeId),
            sql`${storeOrders.status} NOT IN ('CANCELLED', 'REFUNDED')`,
          ),
        );

      const [periodStats] = await db
        .select({
          sum: sql<string>`COALESCE(SUM(${storeOrders.total}), 0)`,
          count: sql<number>`count(*)::int`,
        })
        .from(storeOrders)
        .where(
          and(
            eq(storeOrders.storeId, storeId),
            gte(storeOrders.createdAt, rangeStart),
            sql`${storeOrders.status} NOT IN ('CANCELLED', 'REFUNDED')`,
          ),
        );

      const statusRows = await db
        .select({
          status: storeOrders.status,
          count: sql<number>`count(*)::int`,
        })
        .from(storeOrders)
        .where(eq(storeOrders.storeId, storeId))
        .groupBy(storeOrders.status);

      const statusDistribution: Record<string, number> = {};
      for (const row of statusRows) {
        statusDistribution[row.status] = row.count;
      }

      const totalOrders = totalStats?.count ?? 0;
      const totalRevenue = totalStats?.sum ?? "0";
      const avg = totalOrders > 0 ? (Number(totalRevenue) / totalOrders).toFixed(2) : "0.00";

      const result: StoreOverview = {
        totalRevenue,
        periodRevenue: periodStats?.sum ?? "0",
        totalOrders,
        periodOrders: periodStats?.count ?? 0,
        averageOrderValue: avg,
        statusDistribution,
      };

      await setCache(cacheKey, result, CACHE_TTL.analytics);
      return ok(result);
    },
  );

  app.get(
    "/products",
    {
      schema: {
        tags: ["Store Analytics"],
        summary: "Store best sellers",
        querystring: z.object({
          limit: z.coerce.number().int().min(1).max(50).default(10),
        }),
        response: {
          200: successSchema(
            z.array(
              z.object({
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
      const storeId = await getOwnedStoreId(getUser(request).profileId);

      const rows = await db
        .select({
          productName: orderItems.productNameSnapshot,
          totalQuantity: sql<number>`SUM(${orderItems.quantity})::int`,
          totalRevenue: sql<string>`SUM(${orderItems.lineTotal})`,
        })
        .from(orderItems)
        .innerJoin(storeOrders, eq(storeOrders.id, orderItems.storeOrderId))
        .where(eq(storeOrders.storeId, storeId))
        .groupBy(orderItems.productNameSnapshot)
        .orderBy(sql`SUM(${orderItems.quantity}) DESC`)
        .limit(request.query.limit);

      return ok(rows);
    },
  );
};
