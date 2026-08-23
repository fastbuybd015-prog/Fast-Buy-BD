import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { PAGINATION } from "@/config/constants";
import { getDb } from "@/db";
import { inventory, products, storeProducts, stores } from "@/db/schema";
import { NotFoundError } from "@/errors/app-error";
import { CACHE_KEYS, CACHE_TTL, getCached, setCache } from "@/utils/cache";
import { buildPaginationMeta, ok, paginatedSchema, successSchema } from "@/utils/response";

const storeSchema = z.object({
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
  deliveryMinMinutes: z.number().int().nullable(),
  deliveryMaxMinutes: z.number().int().nullable(),
  ratingAverage: z.string(),
  reviewCount: z.number().int(),
  isVerified: z.boolean(),
  productCount: z.number().int(),
});

const storeProductSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  productSlug: z.string(),
  unit: z.string(),
  primaryImage: z.string().nullable(),
  price: z.string(),
  originalPrice: z.string(),
  discountPercentage: z.string().nullable(),
  available: z.number().int().nullable(),
  inStock: z.boolean(),
  ratingAverage: z.string(),
  reviewCount: z.number().int(),
});

export const storeRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/",
    {
      schema: {
        tags: ["Stores"],
        summary: "List active stores",
        response: { 200: successSchema(z.array(storeSchema)) },
      },
    },
    async () => {
      const db = getDb();
      const rows = await db
        .select({
          id: stores.id,
          name: stores.name,
          slug: stores.slug,
          description: stores.description,
          logoUrl: stores.logoUrl,
          coverUrl: stores.coverUrl,
          phone: stores.phone,
          email: stores.email,
          addressLine: stores.addressLine,
          city: stores.city,
          area: stores.area,
          deliveryMinMinutes: stores.deliveryMinMinutes,
          deliveryMaxMinutes: stores.deliveryMaxMinutes,
          ratingAverage: stores.ratingAverage,
          reviewCount: stores.reviewCount,
          isVerified: stores.isVerified,
          productCount: sql<number>`(SELECT COUNT(*)::int FROM store_products sp WHERE sp.store_id = stores.id AND sp.is_active = true)`,
        })
        .from(stores)
        .where(eq(stores.status, "ACTIVE"))
        .orderBy(desc(stores.isVerified), asc(stores.name));

      return ok(rows);
    },
  );

  app.get(
    "/:slug",
    {
      schema: {
        tags: ["Stores"],
        summary: "Get store by slug",
        params: z.object({ slug: z.string() }),
        response: { 200: successSchema(storeSchema) },
      },
    },
    async (request) => {
      const slug = request.params.slug;
      const cacheKey = CACHE_KEYS.storeDetail(slug);
      type StoreDetail = z.infer<typeof storeSchema>;
      const cached = await getCached<StoreDetail>(cacheKey);
      if (cached) return ok(cached);

      const db = getDb();

      const rows = await db
        .select({
          id: stores.id,
          name: stores.name,
          slug: stores.slug,
          description: stores.description,
          logoUrl: stores.logoUrl,
          coverUrl: stores.coverUrl,
          phone: stores.phone,
          email: stores.email,
          addressLine: stores.addressLine,
          city: stores.city,
          area: stores.area,
          deliveryMinMinutes: stores.deliveryMinMinutes,
          deliveryMaxMinutes: stores.deliveryMaxMinutes,
          ratingAverage: stores.ratingAverage,
          reviewCount: stores.reviewCount,
          isVerified: stores.isVerified,
          productCount: sql<number>`(SELECT COUNT(*)::int FROM store_products sp WHERE sp.store_id = stores.id AND sp.is_active = true)`,
        })
        .from(stores)
        .where(and(eq(stores.slug, slug), eq(stores.status, "ACTIVE")));

      const store = rows[0];
      if (!store) throw new NotFoundError("Store not found.");
      await setCache(cacheKey, store, CACHE_TTL.storeDetail);
      return ok(store);
    },
  );

  app.get(
    "/:slug/products",
    {
      schema: {
        tags: ["Stores"],
        summary: "List products sold by a store",
        params: z.object({ slug: z.string() }),
        querystring: z.object({
          page: z.coerce.number().int().min(1).default(PAGINATION.defaultPage),
          limit: z.coerce
            .number()
            .int()
            .min(1)
            .max(PAGINATION.maxLimit)
            .default(PAGINATION.defaultLimit),
        }),
        response: { 200: paginatedSchema(storeProductSchema) },
      },
    },
    async (request) => {
      const db = getDb();
      const { slug } = request.params;
      const { page, limit } = request.query;

      const store = await db.query.stores.findFirst({
        where: and(eq(stores.slug, slug), eq(stores.status, "ACTIVE")),
        columns: { id: true },
      });
      if (!store) throw new NotFoundError("Store not found.");

      const offset = (page - 1) * limit;

      const countResult = await db
        .select({ total: sql<number>`COUNT(*)::int` })
        .from(storeProducts)
        .innerJoin(products, eq(products.id, storeProducts.productId))
        .where(
          and(
            eq(storeProducts.storeId, store.id),
            eq(storeProducts.isActive, true),
            eq(products.isActive, true),
          ),
        );
      const total = countResult[0]?.total ?? 0;

      const rows = await db
        .select({
          productId: products.id,
          productName: products.name,
          productSlug: products.slug,
          unit: products.unit,
          primaryImage: sql<string | null>`(
            SELECT image_url FROM product_images pi
            WHERE pi.product_id = "products"."id" AND pi.is_primary LIMIT 1
          )`,
          price: storeProducts.price,
          originalPrice: storeProducts.originalPrice,
          discountPercentage: storeProducts.discountPercentage,
          available: inventory.availableQuantity,
          ratingAverage: products.ratingAverage,
          reviewCount: products.reviewCount,
        })
        .from(storeProducts)
        .innerJoin(products, eq(products.id, storeProducts.productId))
        .leftJoin(inventory, eq(inventory.storeProductId, storeProducts.id))
        .where(
          and(
            eq(storeProducts.storeId, store.id),
            eq(storeProducts.isActive, true),
            eq(products.isActive, true),
          ),
        )
        .orderBy(asc(storeProducts.price))
        .limit(limit)
        .offset(offset);

      const data = rows.map((r) => ({
        ...r,
        inStock: (r.available ?? 0) > 0,
      }));

      return {
        success: true as const,
        data,
        meta: buildPaginationMeta({ page, limit, total }),
      };
    },
  );
};
