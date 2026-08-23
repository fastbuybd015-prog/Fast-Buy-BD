import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { PAGINATION } from "@/config/constants";
import { getDb } from "@/db";
import {
  inventory,
  productImages,
  products,
  storeProducts,
  stores,
  systemSettings,
} from "@/db/schema";
import { NotFoundError } from "@/errors/app-error";
import { RATE_LIMITS } from "@/plugins/rate-limit";
import { buildPaginationMeta, ok, paginatedSchema, successSchema } from "@/utils/response";

const productListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  unit: z.string(),
  ratingAverage: z.string(),
  reviewCount: z.number().int(),
  categorySlug: z.string().nullable(),
  categoryName: z.string().nullable(),
  brandName: z.string().nullable(),
  primaryImage: z.string().nullable(),
  bestPrice: z.string().nullable(),
  originalPrice: z.string().nullable(),
  discountPercentage: z.string().nullable(),
  storeCount: z.number().int(),
  inStock: z.boolean(),
});

const storeListingSchema = z.object({
  storeId: z.string().uuid(),
  storeName: z.string(),
  storeSlug: z.string(),
  price: z.string(),
  originalPrice: z.string(),
  discountPercentage: z.string().nullable(),
  available: z.number().int().nullable(),
  inStock: z.boolean(),
});

const productDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  unit: z.string(),
  tags: z.array(z.string()),
  ratingAverage: z.string(),
  reviewCount: z.number().int(),
  category: z.object({ id: z.string().uuid(), name: z.string(), slug: z.string() }).nullable(),
  brand: z.object({ id: z.string().uuid(), name: z.string(), slug: z.string() }).nullable(),
  images: z.array(
    z.object({
      id: z.string().uuid(),
      imageUrl: z.string(),
      altText: z.string().nullable(),
      isPrimary: z.boolean(),
    }),
  ),
  storeListings: z.array(storeListingSchema),
  bestPrice: z.string().nullable(),
  inStock: z.boolean(),
});

const SORT_SQL: Record<string, string> = {
  POPULAR: "p.review_count DESC",
  PRICE_ASC: "best_price ASC NULLS LAST",
  PRICE_DESC: "best_price DESC NULLS LAST",
  RATING: "p.rating_average DESC",
  DISCOUNT: "discount_percentage DESC NULLS LAST",
  NEWEST: "p.created_at DESC",
};

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.defaultPage),
  limit: z.coerce.number().int().min(1).max(PAGINATION.maxLimit).default(PAGINATION.defaultLimit),
  q: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  store: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  discount: z.coerce.boolean().optional(),
  inStock: z.coerce.boolean().optional(),
  sort: z
    .enum(["POPULAR", "PRICE_ASC", "PRICE_DESC", "RATING", "DISCOUNT", "NEWEST"])
    .default("NEWEST"),
});

export const productRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/",
    {
      preHandler: [RATE_LIMITS.search],
      schema: {
        tags: ["Products"],
        summary: "List products with filters and pagination",
        querystring: listQuerySchema,
        response: { 200: paginatedSchema(productListItemSchema) },
      },
    },
    async (request) => {
      const db = getDb();
      const q = request.query;
      const offset = (q.page - 1) * q.limit;

      const whereParts: ReturnType<typeof sql>[] = [sql`p.is_active = true`];

      if (q.q) {
        whereParts.push(sql`p.name ILIKE ${`%${q.q}%`}`);
      }
      if (q.category) {
        whereParts.push(sql`c.slug = ${q.category}`);
      }
      if (q.brand) {
        whereParts.push(sql`b.slug = ${q.brand}`);
      }
      if (q.minRating !== undefined) {
        whereParts.push(sql`p.rating_average >= ${String(q.minRating)}`);
      }
      if (q.store) {
        whereParts.push(sql`EXISTS (
          SELECT 1 FROM store_products sp2
          JOIN stores s2 ON s2.id = sp2.store_id
          WHERE sp2.product_id = p.id AND s2.slug = ${q.store} AND sp2.is_active = true
        )`);
      }
      if (q.minPrice !== undefined) {
        whereParts.push(sql`sp_agg.min_price >= ${String(q.minPrice)}`);
      }
      if (q.maxPrice !== undefined) {
        whereParts.push(sql`sp_agg.min_price <= ${String(q.maxPrice)}`);
      }
      if (q.discount) {
        whereParts.push(sql`sp_agg.max_discount > 0`);
      }
      if (q.inStock) {
        whereParts.push(sql`COALESCE(sp_agg.total_available, 0) > 0`);
      }

      const whereClause = sql.join(whereParts, sql` AND `);
      const sortExpr = sql.raw(SORT_SQL[q.sort] ?? "p.created_at DESC");

      const baseQuery = sql`
        SELECT
          p.id, p.name, p.slug, p.unit,
          p.rating_average, p.review_count,
          c.slug AS category_slug, c.name AS category_name,
          b.name AS brand_name,
          (SELECT image_url FROM product_images pi
           WHERE pi.product_id = p.id AND pi.is_primary LIMIT 1) AS primary_image,
          sp_agg.min_price AS best_price,
          sp_agg.max_original AS original_price,
          sp_agg.max_discount AS discount_percentage,
          sp_agg.store_count,
          COALESCE(sp_agg.total_available, 0) > 0 AS in_stock
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN LATERAL (
          SELECT
            MIN(sp.price) AS min_price,
            MAX(sp.original_price) AS max_original,
            MAX(sp.discount_percentage) AS max_discount,
            COUNT(*)::int AS store_count,
            SUM(COALESCE(inv.available_quantity, 0))::int AS total_available
          FROM store_products sp
          LEFT JOIN inventory inv ON inv.store_product_id = sp.id
          WHERE sp.product_id = p.id AND sp.is_active = true
        ) sp_agg ON true
        WHERE ${whereClause}
      `;

      const countResult = await db.execute<{ total: string }>(
        sql`SELECT COUNT(*)::int AS total FROM (${baseQuery}) sub`,
      );
      const total = Number(countResult[0]?.total ?? 0);

      const rows = await db.execute<{
        id: string;
        name: string;
        slug: string;
        unit: string;
        rating_average: string;
        review_count: number;
        category_slug: string | null;
        category_name: string | null;
        brand_name: string | null;
        primary_image: string | null;
        best_price: string | null;
        original_price: string | null;
        discount_percentage: string | null;
        store_count: number;
        in_stock: boolean;
      }>(sql`${baseQuery} ORDER BY ${sortExpr} LIMIT ${q.limit} OFFSET ${offset}`);

      const data = rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        unit: r.unit,
        ratingAverage: r.rating_average,
        reviewCount: r.review_count,
        categorySlug: r.category_slug,
        categoryName: r.category_name,
        brandName: r.brand_name,
        primaryImage: r.primary_image,
        bestPrice: r.best_price,
        originalPrice: r.original_price,
        discountPercentage: r.discount_percentage,
        storeCount: r.store_count,
        inStock: r.in_stock,
      }));

      return {
        success: true as const,
        data,
        meta: buildPaginationMeta({ page: q.page, limit: q.limit, total }),
      };
    },
  );

  app.get(
    "/:slug",
    {
      schema: {
        tags: ["Products"],
        summary: "Product detail with images, category, brand, and store listings",
        params: z.object({ slug: z.string() }),
        response: { 200: successSchema(productDetailSchema) },
      },
    },
    async (request) => {
      const db = getDb();

      const product = await db.query.products.findFirst({
        where: and(eq(products.slug, request.params.slug), eq(products.isActive, true)),
        with: {
          category: { columns: { id: true, name: true, slug: true } },
          brand: { columns: { id: true, name: true, slug: true } },
          images: {
            columns: { id: true, imageUrl: true, altText: true, isPrimary: true },
            orderBy: [desc(productImages.isPrimary), asc(productImages.sortOrder)],
          },
        },
      });

      if (!product) throw new NotFoundError("Product not found.");

      const listings = await db
        .select({
          storeId: stores.id,
          storeName: stores.name,
          storeSlug: stores.slug,
          price: storeProducts.price,
          originalPrice: storeProducts.originalPrice,
          discountPercentage: storeProducts.discountPercentage,
          available: inventory.availableQuantity,
        })
        .from(storeProducts)
        .innerJoin(stores, eq(stores.id, storeProducts.storeId))
        .leftJoin(inventory, eq(inventory.storeProductId, storeProducts.id))
        .where(
          and(
            eq(storeProducts.productId, product.id),
            eq(storeProducts.isActive, true),
            eq(stores.status, "ACTIVE"),
          ),
        )
        .orderBy(asc(storeProducts.price));

      const storeListings = listings.map((l) => ({
        storeId: l.storeId,
        storeName: l.storeName,
        storeSlug: l.storeSlug,
        price: l.price,
        originalPrice: l.originalPrice,
        discountPercentage: l.discountPercentage,
        available: l.available,
        inStock: (l.available ?? 0) > 0,
      }));

      const bestPrice = storeListings[0]?.price ?? null;
      const inStock = storeListings.some((l) => l.inStock);

      return ok({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        unit: product.unit,
        tags: product.tags,
        ratingAverage: product.ratingAverage,
        reviewCount: product.reviewCount,
        category: product.category,
        brand: product.brand,
        images: product.images,
        storeListings,
        bestPrice,
        inStock,
      });
    },
  );

  // ── Phase B29: Multi-Store Price Comparison ──────────────────────────
  const compareListingSchema = z.object({
    storeId: z.string().uuid(),
    storeName: z.string(),
    storeSlug: z.string(),
    storeRating: z.string(),
    storeReviewCount: z.number().int(),
    deliveryMinMinutes: z.number().int().nullable(),
    deliveryMaxMinutes: z.number().int().nullable(),
    price: z.string(),
    originalPrice: z.string(),
    discountPercentage: z.string().nullable(),
    savings: z.string(),
    available: z.number().int().nullable(),
    inStock: z.boolean(),
    deliveryFee: z.string(),
    finalCost: z.string(),
  });

  const compareResponseSchema = z.object({
    productId: z.string().uuid(),
    productName: z.string(),
    unit: z.string(),
    listings: z.array(compareListingSchema),
    summary: z.object({
      lowestPrice: z.string().nullable(),
      lowestFinalCost: z.string().nullable(),
      highestPrice: z.string().nullable(),
      maxSavings: z.string(),
      availableStores: z.number().int(),
      bestPriceStore: z.string().nullable(),
      bestFinalCostStore: z.string().nullable(),
    }),
  });

  app.get(
    "/:id/compare",
    {
      schema: {
        tags: ["Products"],
        summary: "Multi-store price comparison for a product",
        params: z.object({ id: z.string().uuid() }),
        response: { 200: successSchema(compareResponseSchema) },
      },
    },
    async (request) => {
      const db = getDb();

      const product = await db.query.products.findFirst({
        where: and(eq(products.id, request.params.id), eq(products.isActive, true)),
        columns: { id: true, name: true, unit: true },
      });
      if (!product) throw new NotFoundError("Product not found.");

      // Load delivery settings
      const settings = await db
        .select({ key: systemSettings.key, value: systemSettings.value })
        .from(systemSettings)
        .where(sql`${systemSettings.key} IN ('delivery.default_fee', 'delivery.free_threshold')`);

      const settingsMap = new Map(settings.map((s) => [s.key, s.value]));
      const defaultDeliveryFee = Number(settingsMap.get("delivery.default_fee") ?? "60");
      const freeThreshold = Number(settingsMap.get("delivery.free_threshold") ?? "500");

      const rows = await db
        .select({
          storeId: stores.id,
          storeName: stores.name,
          storeSlug: stores.slug,
          storeRating: stores.ratingAverage,
          storeReviewCount: stores.reviewCount,
          deliveryMinMinutes: stores.deliveryMinMinutes,
          deliveryMaxMinutes: stores.deliveryMaxMinutes,
          price: storeProducts.price,
          originalPrice: storeProducts.originalPrice,
          discountPercentage: storeProducts.discountPercentage,
          available: inventory.availableQuantity,
        })
        .from(storeProducts)
        .innerJoin(stores, eq(stores.id, storeProducts.storeId))
        .leftJoin(inventory, eq(inventory.storeProductId, storeProducts.id))
        .where(
          and(
            eq(storeProducts.productId, product.id),
            eq(storeProducts.isActive, true),
            eq(stores.status, "ACTIVE"),
          ),
        )
        .orderBy(asc(storeProducts.price));

      const listings = rows.map((r) => {
        const price = Number(r.price);
        const originalPrice = Number(r.originalPrice);
        const savings = Math.max(0, originalPrice - price);
        const deliveryFee = price >= freeThreshold ? 0 : defaultDeliveryFee;
        const finalCost = price + deliveryFee;

        return {
          storeId: r.storeId,
          storeName: r.storeName,
          storeSlug: r.storeSlug,
          storeRating: r.storeRating,
          storeReviewCount: r.storeReviewCount,
          deliveryMinMinutes: r.deliveryMinMinutes,
          deliveryMaxMinutes: r.deliveryMaxMinutes,
          price: r.price,
          originalPrice: r.originalPrice,
          discountPercentage: r.discountPercentage,
          savings: savings.toFixed(2),
          available: r.available,
          inStock: (r.available ?? 0) > 0,
          deliveryFee: deliveryFee.toFixed(2),
          finalCost: finalCost.toFixed(2),
        };
      });

      const inStockListings = listings.filter((l) => l.inStock);
      const lowestPriceListing = inStockListings[0] ?? null;
      const lowestFinalCostListing =
        inStockListings.length > 0
          ? inStockListings.reduce((best, l) =>
              Number(l.finalCost) < Number(best.finalCost) ? l : best,
            )
          : null;
      const highestPriceListing =
        inStockListings.length > 0 ? inStockListings[inStockListings.length - 1] : null;
      const maxSavings =
        inStockListings.length > 0
          ? Math.max(...inStockListings.map((l) => Number(l.savings))).toFixed(2)
          : "0.00";

      return ok({
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        listings,
        summary: {
          lowestPrice: lowestPriceListing?.price ?? null,
          lowestFinalCost: lowestFinalCostListing?.finalCost ?? null,
          highestPrice: highestPriceListing?.price ?? null,
          maxSavings,
          availableStores: inStockListings.length,
          bestPriceStore: lowestPriceListing?.storeName ?? null,
          bestFinalCostStore: lowestFinalCostListing?.storeName ?? null,
        },
      });
    },
  );
};
