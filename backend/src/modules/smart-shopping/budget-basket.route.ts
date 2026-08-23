import { and, eq, inArray, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import { inventory, products, storeProducts, stores, systemSettings } from "@/db/schema";
import { authenticate } from "@/plugins/auth";
import { ok, successSchema } from "@/utils/response";

const basketItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  unit: z.string(),
  storeProductId: z.string().uuid(),
  storeId: z.string().uuid(),
  storeName: z.string(),
  price: z.string(),
  originalPrice: z.string(),
  savings: z.string(),
  reason: z.string(),
});

const basketResponseSchema = z.object({
  items: z.array(basketItemSchema),
  storeBreakdown: z.array(
    z.object({
      storeId: z.string().uuid(),
      storeName: z.string(),
      subtotal: z.string(),
      deliveryFee: z.string(),
      itemCount: z.number().int(),
    }),
  ),
  subtotal: z.string(),
  deliveryTotal: z.string(),
  grandTotal: z.string(),
  budget: z.string(),
  remaining: z.string(),
  overBudget: z.boolean(),
  coveredCategories: z.number().int(),
  requestedCategories: z.number().int(),
  explanation: z.string(),
  alternatives: z.array(
    z.object({
      productId: z.string().uuid(),
      productName: z.string(),
      price: z.string(),
      storeName: z.string(),
      reason: z.string(),
    }),
  ),
});

export const budgetBasketRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("preHandler", authenticate);

  app.post(
    "/",
    {
      schema: {
        tags: ["Smart Shopping"],
        summary: "Generate a budget-optimized basket",
        body: z.object({
          budget: z.number().min(1),
          items: z
            .array(
              z.object({
                productId: z.string().uuid().optional(),
                categoryId: z.string().uuid().optional(),
                quantity: z.number().int().min(1).default(1),
              }),
            )
            .min(1),
          preferences: z
            .object({
              preferCheapest: z.boolean().default(true),
              preferHighRated: z.boolean().default(false),
              preferSingleStore: z.boolean().default(false),
            })
            .default({
              preferCheapest: true,
              preferHighRated: false,
              preferSingleStore: false,
            }),
        }),
        response: { 200: successSchema(basketResponseSchema) },
      },
    },
    async (request) => {
      const db = getDb();
      const { budget, items: requestedItems, preferences } = request.body;

      // Load delivery settings
      const settingsRows = await db
        .select({ key: systemSettings.key, value: systemSettings.value })
        .from(systemSettings)
        .where(sql`${systemSettings.key} IN ('delivery.default_fee', 'delivery.free_threshold')`);
      const sMap = new Map(settingsRows.map((s) => [s.key, s.value]));
      const deliveryFee = Number(sMap.get("delivery.default_fee") ?? "60");
      const freeThreshold = Number(sMap.get("delivery.free_threshold") ?? "500");

      // Collect product IDs and category IDs
      const directProductIds = requestedItems
        .filter((i) => i.productId)
        .map((i) => i.productId as string);

      const categoryIds = requestedItems
        .filter((i) => i.categoryId && !i.productId)
        .map((i) => i.categoryId as string);

      // For category requests, pick one product per category (cheapest in stock)
      const categoryProductIds: string[] = [];
      if (categoryIds.length > 0) {
        const catProducts = await db.execute<{
          product_id: string;
          category_id: string;
          price: string;
        }>(sql`
					SELECT DISTINCT ON (p.category_id)
						p.id AS product_id,
						p.category_id,
						sp.price
					FROM products p
					INNER JOIN store_products sp ON sp.product_id = p.id AND sp.is_active = true
					INNER JOIN inventory inv ON inv.store_product_id = sp.id
					WHERE p.category_id IN (${sql.join(
            categoryIds.map((id) => sql`${id}`),
            sql`, `,
          )})
					  AND p.is_active = true
					  AND inv.quantity - inv.reserved_quantity > 0
					ORDER BY p.category_id, sp.price ASC
				`);
        for (const cp of catProducts) {
          categoryProductIds.push(cp.product_id);
        }
      }

      const allProductIds = [...new Set([...directProductIds, ...categoryProductIds])];
      if (allProductIds.length === 0) {
        return ok({
          items: [],
          storeBreakdown: [],
          subtotal: "0.00",
          deliveryTotal: "0.00",
          grandTotal: "0.00",
          budget: budget.toFixed(2),
          remaining: budget.toFixed(2),
          overBudget: false,
          coveredCategories: 0,
          requestedCategories: categoryIds.length + directProductIds.length,
          explanation: "No matching products found in stock.",
          alternatives: [],
        });
      }

      // Get all store listings for these products, sorted by price or rating
      const orderClause = preferences.preferHighRated
        ? sql`s.rating_average DESC, sp.price ASC`
        : sql`sp.price ASC`;

      const listings = await db
        .select({
          productId: products.id,
          productName: products.name,
          categoryId: products.categoryId,
          unit: products.unit,
          storeProductId: storeProducts.id,
          storeId: stores.id,
          storeName: stores.name,
          price: storeProducts.price,
          originalPrice: storeProducts.originalPrice,
          available: inventory.availableQuantity,
          storeRating: stores.ratingAverage,
        })
        .from(storeProducts)
        .innerJoin(products, eq(products.id, storeProducts.productId))
        .innerJoin(stores, eq(stores.id, storeProducts.storeId))
        .innerJoin(inventory, eq(inventory.storeProductId, storeProducts.id))
        .where(
          and(
            inArray(storeProducts.productId, allProductIds),
            eq(storeProducts.isActive, true),
            eq(stores.status, "ACTIVE"),
            sql`${inventory.quantity} - ${inventory.reservedQuantity} > 0`,
          ),
        )
        .orderBy(orderClause);

      // Group listings by product
      const listingsByProduct = new Map<string, (typeof listings)[number][]>();
      for (const l of listings) {
        const existing = listingsByProduct.get(l.productId) ?? [];
        existing.push(l);
        listingsByProduct.set(l.productId, existing);
      }

      // Greedy selection: pick cheapest listing per product within budget
      type SelectedItem = {
        productId: string;
        productName: string;
        unit: string;
        storeProductId: string;
        storeId: string;
        storeName: string;
        price: number;
        originalPrice: string;
        savings: string;
        reason: string;
        categoryId: string;
      };

      const selected: SelectedItem[] = [];
      const alternatives: Array<{
        productId: string;
        productName: string;
        price: string;
        storeName: string;
        reason: string;
      }> = [];
      let runningTotal = 0;

      // If preferSingleStore, pick the store with most products at best combined price
      if (preferences.preferSingleStore) {
        const storeScores = new Map<
          string,
          { storeName: string; total: number; items: SelectedItem[] }
        >();
        for (const [, pListings] of listingsByProduct) {
          for (const l of pListings) {
            const entry = storeScores.get(l.storeId) ?? {
              storeName: l.storeName,
              total: 0,
              items: [],
            };
            const price = Number(l.price);
            entry.total += price;
            entry.items.push({
              productId: l.productId,
              productName: l.productName,
              unit: l.unit,
              storeProductId: l.storeProductId,
              storeId: l.storeId,
              storeName: l.storeName,
              price,
              originalPrice: l.originalPrice,
              savings: (Number(l.originalPrice) - price).toFixed(2),
              reason: "Best single-store option",
              categoryId: l.categoryId,
            });
            storeScores.set(l.storeId, entry);
          }
        }

        // Pick the store covering the most products within budget
        let bestStore: { storeName: string; total: number; items: SelectedItem[] } | null = null;
        for (const [, entry] of storeScores) {
          if (
            !bestStore ||
            entry.items.length > bestStore.items.length ||
            (entry.items.length === bestStore.items.length && entry.total < bestStore.total)
          ) {
            if (entry.total <= budget) {
              bestStore = entry;
            }
          }
        }

        if (bestStore) {
          // Deduplicate by productId
          const seen = new Set<string>();
          for (const item of bestStore.items) {
            if (!seen.has(item.productId)) {
              selected.push(item);
              seen.add(item.productId);
            }
          }
          runningTotal = selected.reduce((sum, i) => sum + i.price, 0);
        }
      }

      if (selected.length === 0) {
        // Default greedy: cheapest per product
        const quantityMap = new Map<string, number>();
        for (const ri of requestedItems) {
          const pid = ri.productId ?? categoryProductIds.find(() => true);
          if (pid) quantityMap.set(pid, ri.quantity);
        }

        for (const productId of allProductIds) {
          const pListings = listingsByProduct.get(productId);
          if (!pListings || pListings.length === 0) continue;

          const best = pListings[0];
          if (!best) continue;
          const price = Number(best.price);
          const qty = quantityMap.get(productId) ?? 1;
          const itemCost = price * qty;

          if (runningTotal + itemCost <= budget) {
            for (let i = 0; i < qty; i++) {
              selected.push({
                productId: best.productId,
                productName: best.productName,
                unit: best.unit,
                storeProductId: best.storeProductId,
                storeId: best.storeId,
                storeName: best.storeName,
                price,
                originalPrice: best.originalPrice,
                savings: (Number(best.originalPrice) - price).toFixed(2),
                reason: "Cheapest available option",
                categoryId: best.categoryId,
              });
            }
            runningTotal += itemCost;
          } else {
            // Over budget — add as alternative
            alternatives.push({
              productId: best.productId,
              productName: best.productName,
              price: best.price,
              storeName: best.storeName,
              reason: "Exceeds remaining budget",
            });
          }
        }
      }

      // Calculate store-level delivery
      const storeSubtotals = new Map<
        string,
        { storeName: string; subtotal: number; count: number }
      >();
      for (const item of selected) {
        const entry = storeSubtotals.get(item.storeId) ?? {
          storeName: item.storeName,
          subtotal: 0,
          count: 0,
        };
        entry.subtotal += item.price;
        entry.count += 1;
        storeSubtotals.set(item.storeId, entry);
      }

      let deliveryTotal = 0;
      const storeBreakdown: Array<{
        storeId: string;
        storeName: string;
        subtotal: string;
        deliveryFee: string;
        itemCount: number;
      }> = [];

      for (const [storeId, entry] of storeSubtotals) {
        const fee = entry.subtotal >= freeThreshold ? 0 : deliveryFee;
        deliveryTotal += fee;
        storeBreakdown.push({
          storeId,
          storeName: entry.storeName,
          subtotal: entry.subtotal.toFixed(2),
          deliveryFee: fee.toFixed(2),
          itemCount: entry.count,
        });
      }

      const subtotal = runningTotal;
      const grandTotal = subtotal + deliveryTotal;
      const remaining = budget - grandTotal;

      const coveredCategories = new Set(selected.map((i) => i.categoryId)).size;
      const requestedCount = categoryIds.length + directProductIds.length;

      let explanation: string;
      if (selected.length === 0) {
        explanation = "No products could fit within your budget.";
      } else if (remaining >= 0 && coveredCategories >= requestedCount) {
        explanation = `All ${requestedCount} requested items fit within your ৳${budget.toLocaleString()} budget with ৳${remaining.toFixed(2)} remaining.`;
      } else if (remaining >= 0) {
        explanation = `${selected.length} of ${requestedCount} items fit within your ৳${budget.toLocaleString()} budget.`;
      } else {
        explanation = `Selected items exceed your budget by ৳${Math.abs(remaining).toFixed(2)}.`;
      }

      return ok({
        items: selected.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          unit: i.unit,
          storeProductId: i.storeProductId,
          storeId: i.storeId,
          storeName: i.storeName,
          price: i.price.toFixed(2),
          originalPrice: i.originalPrice,
          savings: i.savings,
          reason: i.reason,
        })),
        storeBreakdown,
        subtotal: subtotal.toFixed(2),
        deliveryTotal: deliveryTotal.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        budget: budget.toFixed(2),
        remaining: remaining.toFixed(2),
        overBudget: remaining < 0,
        coveredCategories,
        requestedCategories: requestedCount,
        explanation,
        alternatives,
      });
    },
  );
};
