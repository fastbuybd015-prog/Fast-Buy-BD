import { and, eq, gt, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import { inventory, products, storeProducts, stores } from "@/db/schema";
import { CACHE_KEYS, CACHE_TTL, getCached, setCache } from "@/utils/cache";
import { ok, successSchema } from "@/utils/response";

const expiryDealSchema = z.object({
  storeProductId: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string(),
  slug: z.string(),
  unit: z.string(),
  storeId: z.string().uuid(),
  storeName: z.string(),
  price: z.string(),
  originalPrice: z.string(),
  discountPercentage: z.string().nullable(),
  available: z.number().int().nullable(),
  expiresAt: z.string().nullable(),
  daysUntilExpiry: z.number().int().nullable(),
  expiringSoon: z.boolean(),
  imageUrl: z.string().nullable(),
});

const expiryDealsResponseSchema = z.object({
  deals: z.array(expiryDealSchema),
  total: z.number().int(),
});

export const expiryDealsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/",
    {
      schema: {
        tags: ["Smart Shopping"],
        summary: "Products expiring soon with deals",
        querystring: z.object({
          daysThreshold: z.coerce.number().int().min(1).max(90).default(7),
          limit: z.coerce.number().int().min(1).max(50).default(20),
        }),
        response: { 200: successSchema(expiryDealsResponseSchema) },
      },
    },
    async (request) => {
      const { daysThreshold, limit } = request.query;

      const cacheKey = CACHE_KEYS.expiryDeals(daysThreshold, limit);
      type Deal = z.infer<typeof expiryDealSchema>;
      const cached = await getCached<{ deals: Deal[]; total: number }>(cacheKey);
      if (cached) return ok(cached);

      const db = getDb();
      const today = new Date().toISOString().split("T")[0];
      const thresholdDate = new Date(Date.now() + daysThreshold * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const rows = await db
        .select({
          storeProductId: storeProducts.id,
          productId: products.id,
          productName: products.name,
          slug: products.slug,
          unit: products.unit,
          storeId: stores.id,
          storeName: stores.name,
          price: storeProducts.price,
          originalPrice: storeProducts.originalPrice,
          discountPercentage: storeProducts.discountPercentage,
          available: inventory.availableQuantity,
          expiresAt: inventory.expiresAt,
          imageUrl: sql<string | null>`(
						SELECT image_url FROM product_images pi
						WHERE pi.product_id = "products"."id" AND pi.is_primary LIMIT 1
					)`,
        })
        .from(inventory)
        .innerJoin(storeProducts, eq(storeProducts.id, inventory.storeProductId))
        .innerJoin(products, eq(products.id, storeProducts.productId))
        .innerJoin(stores, eq(stores.id, storeProducts.storeId))
        .where(
          and(
            sql`${inventory.expiresAt} IS NOT NULL`,
            sql`${inventory.expiresAt} > ${today}`,
            sql`${inventory.expiresAt} <= ${thresholdDate}`,
            gt(sql`${inventory.quantity} - ${inventory.reservedQuantity}`, 0),
            eq(storeProducts.isActive, true),
            eq(products.isActive, true),
            eq(stores.status, "ACTIVE"),
          ),
        )
        .orderBy(sql`${inventory.expiresAt} ASC`)
        .limit(limit);

      const deals = rows.map((r) => {
        const expiryDate = r.expiresAt ? new Date(r.expiresAt) : null;
        const now = new Date();
        const daysUntilExpiry = expiryDate
          ? Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
          : null;

        return {
          storeProductId: r.storeProductId,
          productId: r.productId,
          productName: r.productName,
          slug: r.slug,
          unit: r.unit,
          storeId: r.storeId,
          storeName: r.storeName,
          price: r.price,
          originalPrice: r.originalPrice,
          discountPercentage: r.discountPercentage,
          available: r.available,
          expiresAt: r.expiresAt,
          daysUntilExpiry,
          expiringSoon: daysUntilExpiry !== null && daysUntilExpiry <= 3,
          imageUrl: r.imageUrl,
        };
      });

      const result = { deals, total: deals.length };
      await setCache(cacheKey, result, CACHE_TTL.expiryDeals);
      return ok(result);
    },
  );
};
