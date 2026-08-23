import { and, desc, eq, gt, inArray, ne, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import { inventory, orderItems, orders, products, storeProducts, userEvents } from "@/db/schema";
import { getUser, optionalAuth } from "@/plugins/auth";
import { RATE_LIMITS } from "@/plugins/rate-limit";
import { CACHE_KEYS, CACHE_TTL, getCached, setCache } from "@/utils/cache";
import { ok, successSchema } from "@/utils/response";

const WEIGHTS = {
  categorySimilarity: 0.35,
  purchaseAffinity: 0.3,
  coPurchase: 0.2,
  priceSimilarity: 0.15,
} as const;

const recommendedProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  unit: z.string(),
  categoryId: z.string().uuid(),
  imageUrl: z.string().nullable(),
  minPrice: z.string().nullable(),
  originalPrice: z.string().nullable(),
  discountPercentage: z.string().nullable(),
  ratingAverage: z.string(),
  reviewCount: z.number().int(),
  reason: z.string(),
  score: z.number().optional(),
});

const recommendationSectionSchema = z.object({
  title: z.string(),
  items: z.array(recommendedProductSchema),
});

const recommendationsResponseSchema = z.object({
  sections: z.array(recommendationSectionSchema),
});

async function getProductWithPricing(db: ReturnType<typeof getDb>, productIds: string[]) {
  if (productIds.length === 0) return [];
  return db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      unit: products.unit,
      categoryId: products.categoryId,
      imageUrl: sql<string | null>`(
				SELECT image_url FROM product_images pi
				WHERE pi.product_id = "products"."id" AND pi.is_primary LIMIT 1
			)`,
      minPrice: sql<string | null>`(
				SELECT MIN(sp.price)::text FROM store_products sp
				INNER JOIN inventory inv ON inv.store_product_id = sp.id
				WHERE sp.product_id = "products"."id"
				  AND sp.is_active = true
				  AND inv.quantity - inv.reserved_quantity > 0
			)`,
      originalPrice: sql<string | null>`(
				SELECT MAX(sp.original_price)::text FROM store_products sp
				WHERE sp.product_id = "products"."id" AND sp.is_active = true
			)`,
      discountPercentage: sql<string | null>`(
				SELECT MAX(sp.discount_percentage)::text FROM store_products sp
				WHERE sp.product_id = "products"."id" AND sp.is_active = true
			)`,
      ratingAverage: products.ratingAverage,
      reviewCount: products.reviewCount,
    })
    .from(products)
    .where(and(inArray(products.id, productIds), eq(products.isActive, true)));
}

type ProductRow = Awaited<ReturnType<typeof getProductWithPricing>>[number];

function toRecommendedProduct(row: ProductRow, reason: string, score?: number) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    unit: row.unit,
    categoryId: row.categoryId,
    imageUrl: row.imageUrl,
    minPrice: row.minPrice,
    originalPrice: row.originalPrice,
    discountPercentage: row.discountPercentage,
    ratingAverage: row.ratingAverage,
    reviewCount: row.reviewCount,
    reason,
    score,
  };
}

export const recommendationRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/",
    {
      preHandler: [optionalAuth, RATE_LIMITS.recommendations],
      schema: {
        tags: ["Recommendations"],
        summary: "Personalized product recommendations",
        querystring: z.object({
          limit: z.coerce.number().int().min(1).max(30).default(10),
          productId: z.string().uuid().optional(),
        }),
        response: { 200: successSchema(recommendationsResponseSchema) },
      },
    },
    async (request) => {
      const db = getDb();
      const limit = request.query.limit;
      const contextProductId = request.query.productId;
      let userId: string | null = null;

      try {
        userId = getUser(request).profileId;
      } catch {
        // anonymous
      }

      const cacheKey = userId
        ? CACHE_KEYS.recommendations(userId)
        : CACHE_KEYS.coldStartRecommendations;
      type SectionItem = z.infer<typeof recommendedProductSchema>;
      type Section = { title: string; items: SectionItem[] };
      if (!contextProductId) {
        const cached = await getCached<{ sections: Section[] }>(cacheKey);
        if (cached) return ok(cached);
      }

      const sections: Array<{ title: string; items: typeof recommendedProducts }> = [];
      type RecommendedProduct = ReturnType<typeof toRecommendedProduct>;
      const recommendedProducts: RecommendedProduct[] = [];

      if (userId) {
        // ── recommendedForYou (weighted scoring) ─────────────────────
        const scored = await buildPersonalizedRecommendations(db, userId, limit);
        if (scored.length > 0) {
          sections.push({ title: "Recommended For You", items: scored });
        }

        // ── buyAgain ────────────────────────────────────────────────
        const buyAgainItems = await buildBuyAgain(db, userId, limit);
        if (buyAgainItems.length > 0) {
          sections.push({ title: "Buy Again", items: buyAgainItems });
        }
      }

      // ── frequentlyBoughtTogether (context-based) ──────────────────
      if (contextProductId) {
        const coItems = await buildFrequentlyBoughtTogether(db, contextProductId, limit);
        if (coItems.length > 0) {
          sections.push({
            title: "Frequently Bought Together",
            items: coItems,
          });
        }

        // ── similarProducts ──────────────────────────────────────────
        const similar = await buildSimilarProducts(db, contextProductId, limit);
        if (similar.length > 0) {
          sections.push({ title: "Similar Products", items: similar });
        }
      }

      // ── bestValue ────────────────────────────────────────────────
      const bestValue = await buildBestValue(db, limit);
      if (bestValue.length > 0) {
        sections.push({ title: "Best Value", items: bestValue });
      }

      // ── Cold start fallbacks ──────────────────────────────────────
      if (sections.length === 0 || (!userId && !contextProductId)) {
        const coldStart = await buildColdStartSections(db, limit);
        for (const s of coldStart) {
          if (!sections.some((existing) => existing.title === s.title) && s.items.length > 0) {
            sections.push(s);
          }
        }
      }

      const result = { sections };
      if (!contextProductId) {
        const ttl = userId ? CACHE_TTL.recommendations : CACHE_TTL.coldStart;
        await setCache(cacheKey, result, ttl);
      }
      return ok(result);
    },
  );
};

async function buildPersonalizedRecommendations(
  db: ReturnType<typeof getDb>,
  userId: string,
  limit: number,
) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // User's viewed/interacted category distribution
  const categoryAffinity = await db
    .select({
      categoryId: products.categoryId,
      weight: sql<number>`count(*)::int`,
    })
    .from(userEvents)
    .innerJoin(products, eq(products.id, userEvents.productId))
    .where(and(eq(userEvents.userId, userId), gt(userEvents.createdAt, thirtyDaysAgo)))
    .groupBy(products.categoryId)
    .orderBy(sql`count(*) DESC`)
    .limit(5);

  // User's purchased category distribution
  const purchasedCategories = await db
    .select({
      categoryId: products.categoryId,
      weight: sql<number>`count(*)::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(
      and(eq(orders.userId, userId), sql`${orders.orderStatus} NOT IN ('CANCELLED', 'REFUNDED')`),
    )
    .groupBy(products.categoryId)
    .orderBy(sql`count(*) DESC`)
    .limit(5);

  // Products this user already bought (to exclude)
  const purchasedProductIds = await db
    .select({ productId: orderItems.productId })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(eq(orders.userId, userId))
    .groupBy(orderItems.productId);

  const excludeIds = purchasedProductIds
    .map((r) => r.productId)
    .filter((id): id is string => id !== null);

  // User's average price from purchases
  const [avgPriceResult] = await db
    .select({
      avgPrice: sql<string>`COALESCE(AVG(${orderItems.unitPrice}), 0)::text`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(eq(orders.userId, userId));

  const userAvgPrice = Number(avgPriceResult?.avgPrice ?? 0);

  // Combine category IDs from both browsing and purchasing
  const allCategoryIds = [
    ...new Set([
      ...categoryAffinity.map((c) => c.categoryId),
      ...purchasedCategories.map((c) => c.categoryId),
    ]),
  ];

  if (allCategoryIds.length === 0) return [];

  // Category weight map (normalized)
  const categoryWeights = new Map<string, number>();
  const totalBrowse = categoryAffinity.reduce((s, c) => s + c.weight, 0) || 1;
  const totalPurchase = purchasedCategories.reduce((s, c) => s + c.weight, 0) || 1;

  for (const c of categoryAffinity) {
    categoryWeights.set(
      c.categoryId,
      (categoryWeights.get(c.categoryId) ?? 0) +
        (c.weight / totalBrowse) * WEIGHTS.categorySimilarity,
    );
  }
  for (const c of purchasedCategories) {
    categoryWeights.set(
      c.categoryId,
      (categoryWeights.get(c.categoryId) ?? 0) +
        (c.weight / totalPurchase) * WEIGHTS.purchaseAffinity,
    );
  }

  // Candidate products from those categories (that are in stock, not already purchased)
  const baseWhere = [inArray(products.categoryId, allCategoryIds), eq(products.isActive, true)];
  if (excludeIds.length > 0) {
    baseWhere.push(
      sql`${products.id} NOT IN (${sql.join(
        excludeIds.map((id) => sql`${id}`),
        sql`, `,
      )})`,
    );
  }

  const candidates = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      unit: products.unit,
      categoryId: products.categoryId,
      ratingAverage: products.ratingAverage,
      reviewCount: products.reviewCount,
      imageUrl: sql<string | null>`(
				SELECT image_url FROM product_images pi
				WHERE pi.product_id = "products"."id" AND pi.is_primary LIMIT 1
			)`,
      minPrice: sql<string | null>`(
				SELECT MIN(sp.price)::text FROM store_products sp
				INNER JOIN inventory inv ON inv.store_product_id = sp.id
				WHERE sp.product_id = "products"."id"
				  AND sp.is_active = true
				  AND inv.quantity - inv.reserved_quantity > 0
			)`,
      originalPrice: sql<string | null>`(
				SELECT MAX(sp.original_price)::text FROM store_products sp
				WHERE sp.product_id = "products"."id" AND sp.is_active = true
			)`,
      discountPercentage: sql<string | null>`(
				SELECT MAX(sp.discount_percentage)::text FROM store_products sp
				WHERE sp.product_id = "products"."id" AND sp.is_active = true
			)`,
      popularity: sql<number>`(
				SELECT count(*)::int FROM user_events ue
				WHERE ue.product_id = "products"."id"
				  AND ue.created_at > NOW() - INTERVAL '30 days'
			)`,
    })
    .from(products)
    .where(and(...baseWhere))
    .limit(50);

  // Score each candidate
  const scored = candidates
    .filter((c) => c.minPrice !== null)
    .map((c) => {
      const catScore = categoryWeights.get(c.categoryId) ?? 0;

      // Price similarity: 1 when price matches user average, decays with distance
      const price = Number(c.minPrice);
      const priceScore =
        userAvgPrice > 0
          ? Math.max(0, 1 - Math.abs(price - userAvgPrice) / userAvgPrice) * WEIGHTS.priceSimilarity
          : WEIGHTS.priceSimilarity * 0.5;

      // Co-purchase bonus (popularity as proxy)
      const popScore = Math.min(c.popularity / 10, 1) * WEIGHTS.coPurchase;

      const totalScore = catScore + priceScore + popScore;

      let reason = "Based on your browsing and purchase history";
      if (catScore > WEIGHTS.categorySimilarity * 0.5) {
        reason = "Matches your favorite categories";
      } else if (priceScore > WEIGHTS.priceSimilarity * 0.7) {
        reason = "In your usual price range";
      }

      return toRecommendedProduct(
        c as unknown as ProductRow,
        reason,
        Math.round(totalScore * 100) / 100,
      );
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, limit);

  return scored;
}

async function buildBuyAgain(db: ReturnType<typeof getDb>, userId: string, limit: number) {
  const rows = await db
    .select({
      productId: orderItems.productId,
      lastPurchased: sql<Date>`MAX(${orders.placedAt})`,
      purchaseCount: sql<number>`count(*)::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(
      and(
        eq(orders.userId, userId),
        sql`${orders.orderStatus} NOT IN ('CANCELLED', 'REFUNDED')`,
        sql`${orderItems.productId} IS NOT NULL`,
      ),
    )
    .groupBy(orderItems.productId)
    .orderBy(sql`MAX(${orders.placedAt}) DESC`)
    .limit(limit);

  const productIds = rows.map((r) => r.productId).filter((id): id is string => id !== null);
  if (productIds.length === 0) return [];

  const productRows = await getProductWithPricing(db, productIds);
  const productMap = new Map(productRows.map((p) => [p.id, p]));

  return rows
    .map((r) => {
      if (!r.productId) return null;
      const p = productMap.get(r.productId);
      if (!p || p.minPrice === null) return null;
      return toRecommendedProduct(
        p,
        r.purchaseCount > 1
          ? `Purchased ${r.purchaseCount} times before`
          : "You bought this before",
      );
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

async function buildFrequentlyBoughtTogether(
  db: ReturnType<typeof getDb>,
  productId: string,
  limit: number,
) {
  const coProducts = await db.execute<{ product_id: string; co_count: number }>(sql`
		SELECT oi2.product_id, count(*)::int AS co_count
		FROM order_items oi1
		INNER JOIN order_items oi2
		  ON oi2.order_id = oi1.order_id
		  AND oi2.product_id != ${productId}
		  AND oi2.product_id IS NOT NULL
		WHERE oi1.product_id = ${productId}
		GROUP BY oi2.product_id
		ORDER BY count(*) DESC
		LIMIT ${limit}
	`);

  const ids = coProducts.map((c) => c.product_id);
  if (ids.length === 0) return [];

  const productRows = await getProductWithPricing(db, ids);
  const productMap = new Map(productRows.map((p) => [p.id, p]));

  return ids
    .map((id) => {
      const p = productMap.get(id);
      if (!p || p.minPrice === null) return null;
      return toRecommendedProduct(p, "Often bought together");
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

async function buildSimilarProducts(
  db: ReturnType<typeof getDb>,
  productId: string,
  limit: number,
) {
  // Get the reference product's category and price
  const [ref] = await db
    .select({
      categoryId: products.categoryId,
      avgPrice: sql<string>`(
				SELECT AVG(sp.price)::text FROM store_products sp
				WHERE sp.product_id = "products"."id" AND sp.is_active = true
			)`,
    })
    .from(products)
    .where(eq(products.id, productId));

  if (!ref) return [];

  const refPrice = Number(ref.avgPrice ?? 0);

  const similar = await getProductWithPricing(
    db,
    (
      await db
        .select({ id: products.id })
        .from(products)
        .where(
          and(
            eq(products.categoryId, ref.categoryId),
            ne(products.id, productId),
            eq(products.isActive, true),
          ),
        )
        .orderBy(
          refPrice > 0
            ? sql`ABS((SELECT MIN(sp.price) FROM store_products sp WHERE sp.product_id = "products"."id" AND sp.is_active = true) - ${refPrice})`
            : desc(products.ratingAverage),
        )
        .limit(limit)
    ).map((r) => r.id),
  );

  return similar
    .filter((p) => p.minPrice !== null)
    .map((p) => toRecommendedProduct(p, "Similar to what you're viewing"));
}

async function buildBestValue(db: ReturnType<typeof getDb>, limit: number) {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      unit: products.unit,
      categoryId: products.categoryId,
      ratingAverage: products.ratingAverage,
      reviewCount: products.reviewCount,
      imageUrl: sql<string | null>`(
				SELECT image_url FROM product_images pi
				WHERE pi.product_id = "products"."id" AND pi.is_primary LIMIT 1
			)`,
      minPrice: sql<string | null>`MIN(${storeProducts.price})::text`,
      originalPrice: sql<string | null>`MAX(${storeProducts.originalPrice})::text`,
      discountPercentage: sql<string | null>`MAX(${storeProducts.discountPercentage})::text`,
    })
    .from(products)
    .innerJoin(
      storeProducts,
      and(eq(storeProducts.productId, products.id), eq(storeProducts.isActive, true)),
    )
    .innerJoin(inventory, eq(inventory.storeProductId, storeProducts.id))
    .where(
      and(
        eq(products.isActive, true),
        gt(sql`${storeProducts.discountPercentage}`, "0"),
        gt(sql`${inventory.quantity} - ${inventory.reservedQuantity}`, 0),
      ),
    )
    .groupBy(
      products.id,
      products.name,
      products.slug,
      products.unit,
      products.categoryId,
      products.ratingAverage,
      products.reviewCount,
    )
    .orderBy(sql`MAX(${storeProducts.discountPercentage}) DESC`)
    .limit(limit);

  return rows.map((r) =>
    toRecommendedProduct(r as unknown as ProductRow, `Up to ${r.discountPercentage}% off`),
  );
}

async function buildColdStartSections(db: ReturnType<typeof getDb>, limit: number) {
  const sections: Array<{ title: string; items: ReturnType<typeof toRecommendedProduct>[] }> = [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Popular (most viewed in last 30 days)
  const popularIds = await db
    .select({
      productId: userEvents.productId,
    })
    .from(userEvents)
    .where(
      and(
        sql`${userEvents.productId} IS NOT NULL`,
        gt(userEvents.createdAt, thirtyDaysAgo),
        inArray(userEvents.eventType, ["PRODUCT_VIEW", "PRODUCT_CLICK"]),
      ),
    )
    .groupBy(userEvents.productId)
    .orderBy(sql`count(*) DESC`)
    .limit(limit);

  const popIds = popularIds.map((r) => r.productId).filter((id): id is string => id !== null);
  if (popIds.length > 0) {
    const popular = await getProductWithPricing(db, popIds);
    sections.push({
      title: "Popular",
      items: popular
        .filter((p) => p.minPrice !== null)
        .map((p) => toRecommendedProduct(p, "Popular with shoppers")),
    });
  }

  // Trending (most added to cart recently)
  const trendingIds = await db
    .select({
      productId: userEvents.productId,
    })
    .from(userEvents)
    .where(
      and(
        sql`${userEvents.productId} IS NOT NULL`,
        gt(userEvents.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        eq(userEvents.eventType, "ADD_TO_CART"),
      ),
    )
    .groupBy(userEvents.productId)
    .orderBy(sql`count(*) DESC`)
    .limit(limit);

  const trendIds = trendingIds.map((r) => r.productId).filter((id): id is string => id !== null);
  if (trendIds.length > 0) {
    const trending = await getProductWithPricing(db, trendIds);
    sections.push({
      title: "Trending",
      items: trending
        .filter((p) => p.minPrice !== null)
        .map((p) => toRecommendedProduct(p, "Trending right now")),
    });
  }

  // Highly Rated
  const highlyRated = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      unit: products.unit,
      categoryId: products.categoryId,
      ratingAverage: products.ratingAverage,
      reviewCount: products.reviewCount,
      imageUrl: sql<string | null>`(
				SELECT image_url FROM product_images pi
				WHERE pi.product_id = "products"."id" AND pi.is_primary LIMIT 1
			)`,
      minPrice: sql<string | null>`(
				SELECT MIN(sp.price)::text FROM store_products sp
				INNER JOIN inventory inv ON inv.store_product_id = sp.id
				WHERE sp.product_id = "products"."id"
				  AND sp.is_active = true
				  AND inv.quantity - inv.reserved_quantity > 0
			)`,
      originalPrice: sql<string | null>`(
				SELECT MAX(sp.original_price)::text FROM store_products sp
				WHERE sp.product_id = "products"."id" AND sp.is_active = true
			)`,
      discountPercentage: sql<string | null>`(
				SELECT MAX(sp.discount_percentage)::text FROM store_products sp
				WHERE sp.product_id = "products"."id" AND sp.is_active = true
			)`,
    })
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        gt(products.reviewCount, 0),
        gt(sql`${products.ratingAverage}`, "3.5"),
      ),
    )
    .orderBy(desc(products.ratingAverage), desc(products.reviewCount))
    .limit(limit);

  if (highlyRated.length > 0) {
    sections.push({
      title: "Highly Rated",
      items: highlyRated
        .filter((p) => p.minPrice !== null)
        .map((p) =>
          toRecommendedProduct(p as unknown as ProductRow, `Rated ${p.ratingAverage} stars`),
        ),
    });
  }

  // Best Discount (reuse bestValue)
  return sections;
}
