import { and, eq, inArray, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import {
  cartItems,
  carts,
  inventory,
  products,
  storeProducts,
  stores,
  systemSettings,
} from "@/db/schema";
import { authenticate, getUser } from "@/plugins/auth";
import { ok, successSchema } from "@/utils/response";

const optimizationModes = [
  "CHEAPEST",
  "SINGLE_STORE",
  "BEST_RATED",
  "FASTEST",
  "BALANCED",
] as const;

const optimizedItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  currentStoreId: z.string().uuid(),
  currentStoreName: z.string(),
  currentPrice: z.string(),
  suggestedStoreId: z.string().uuid(),
  suggestedStoreName: z.string(),
  suggestedPrice: z.string(),
  savings: z.string(),
  quantity: z.number().int(),
  changed: z.boolean(),
  reason: z.string(),
});

const optimizeResponseSchema = z.object({
  mode: z.enum(optimizationModes),
  currentTotal: z.string(),
  optimizedTotal: z.string(),
  savings: z.string(),
  currentDelivery: z.string(),
  optimizedDelivery: z.string(),
  deliverySavings: z.string(),
  items: z.array(optimizedItemSchema),
  storeCount: z.number().int(),
  explanation: z.string(),
});

export const basketOptimizerRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("preHandler", authenticate);

  app.post(
    "/optimize",
    {
      schema: {
        tags: ["Smart Shopping"],
        summary: "Optimize the current cart",
        body: z.object({
          mode: z.enum(optimizationModes).default("CHEAPEST"),
        }),
        response: { 200: successSchema(optimizeResponseSchema) },
      },
    },
    async (request) => {
      const db = getDb();
      const userId = getUser(request).profileId;
      const { mode } = request.body;

      // Load user's active cart
      const cart = await db.query.carts.findFirst({
        where: and(eq(carts.userId, userId), eq(carts.status, "ACTIVE")),
        columns: { id: true },
      });

      if (!cart) {
        return ok({
          mode,
          currentTotal: "0.00",
          optimizedTotal: "0.00",
          savings: "0.00",
          currentDelivery: "0.00",
          optimizedDelivery: "0.00",
          deliverySavings: "0.00",
          items: [],
          storeCount: 0,
          explanation: "Your cart is empty.",
        });
      }

      // Load cart items with current store product info
      const items = await db
        .select({
          cartItemId: cartItems.id,
          storeProductId: cartItems.storeProductId,
          quantity: cartItems.quantity,
          productId: products.id,
          productName: products.name,
          currentStoreId: stores.id,
          currentStoreName: stores.name,
          currentPrice: storeProducts.price,
          storeRating: stores.ratingAverage,
          deliveryMinMinutes: stores.deliveryMinMinutes,
        })
        .from(cartItems)
        .innerJoin(storeProducts, eq(storeProducts.id, cartItems.storeProductId))
        .innerJoin(products, eq(products.id, storeProducts.productId))
        .innerJoin(stores, eq(stores.id, storeProducts.storeId))
        .where(eq(cartItems.cartId, cart.id));

      if (items.length === 0) {
        return ok({
          mode,
          currentTotal: "0.00",
          optimizedTotal: "0.00",
          savings: "0.00",
          currentDelivery: "0.00",
          optimizedDelivery: "0.00",
          deliverySavings: "0.00",
          items: [],
          storeCount: 0,
          explanation: "Your cart is empty.",
        });
      }

      // Load delivery settings
      const settingsRows = await db
        .select({ key: systemSettings.key, value: systemSettings.value })
        .from(systemSettings)
        .where(sql`${systemSettings.key} IN ('delivery.default_fee', 'delivery.free_threshold')`);
      const sMap = new Map(settingsRows.map((s) => [s.key, s.value]));
      const defaultDeliveryFee = Number(sMap.get("delivery.default_fee") ?? "60");
      const freeThreshold = Number(sMap.get("delivery.free_threshold") ?? "500");

      // Get all alternative listings for the same products
      const productIds = [...new Set(items.map((i) => i.productId))];
      const allListings = await db
        .select({
          storeProductId: storeProducts.id,
          productId: storeProducts.productId,
          storeId: stores.id,
          storeName: stores.name,
          price: storeProducts.price,
          storeRating: stores.ratingAverage,
          deliveryMinMinutes: stores.deliveryMinMinutes,
          available: inventory.availableQuantity,
        })
        .from(storeProducts)
        .innerJoin(stores, eq(stores.id, storeProducts.storeId))
        .innerJoin(inventory, eq(inventory.storeProductId, storeProducts.id))
        .where(
          and(
            inArray(storeProducts.productId, productIds),
            eq(storeProducts.isActive, true),
            eq(stores.status, "ACTIVE"),
            sql`${inventory.quantity} - ${inventory.reservedQuantity} > 0`,
          ),
        );

      // Group by product
      const listingsByProduct = new Map<string, (typeof allListings)[number][]>();
      for (const l of allListings) {
        const existing = listingsByProduct.get(l.productId) ?? [];
        existing.push(l);
        listingsByProduct.set(l.productId, existing);
      }

      // Optimize per item based on mode
      const optimizedItems: z.infer<typeof optimizedItemSchema>[] = [];

      for (const item of items) {
        const candidates = listingsByProduct.get(item.productId) ?? [];
        const currentPrice = Number(item.currentPrice);

        let best = {
          storeProductId: item.storeProductId,
          storeId: item.currentStoreId,
          storeName: item.currentStoreName,
          price: currentPrice,
          reason: "Current selection",
        };

        const validCandidates = candidates.filter((c) => (c.available ?? 0) >= item.quantity);

        if (validCandidates.length === 0) {
          optimizedItems.push({
            productId: item.productId,
            productName: item.productName,
            currentStoreId: item.currentStoreId,
            currentStoreName: item.currentStoreName,
            currentPrice: item.currentPrice,
            suggestedStoreId: item.currentStoreId,
            suggestedStoreName: item.currentStoreName,
            suggestedPrice: item.currentPrice,
            savings: "0.00",
            quantity: item.quantity,
            changed: false,
            reason: "No alternative listings available",
          });
          continue;
        }

        switch (mode) {
          case "CHEAPEST": {
            const cheapest = validCandidates.reduce((a, b) =>
              Number(a.price) < Number(b.price) ? a : b,
            );
            if (Number(cheapest.price) < currentPrice) {
              best = {
                storeProductId: cheapest.storeProductId,
                storeId: cheapest.storeId,
                storeName: cheapest.storeName,
                price: Number(cheapest.price),
                reason: `Cheaper at ${cheapest.storeName}`,
              };
            }
            break;
          }
          case "BEST_RATED": {
            const bestRated = validCandidates.reduce((a, b) =>
              Number(a.storeRating) > Number(b.storeRating) ? a : b,
            );
            if (
              Number(bestRated.storeRating) > Number(item.storeRating) ||
              (Number(bestRated.storeRating) === Number(item.storeRating) &&
                Number(bestRated.price) < currentPrice)
            ) {
              best = {
                storeProductId: bestRated.storeProductId,
                storeId: bestRated.storeId,
                storeName: bestRated.storeName,
                price: Number(bestRated.price),
                reason: `Higher rated store (${bestRated.storeRating})`,
              };
            }
            break;
          }
          case "FASTEST": {
            const fastest = validCandidates
              .filter((c) => c.deliveryMinMinutes !== null)
              .reduce(
                (a, b) => ((a.deliveryMinMinutes ?? 999) < (b.deliveryMinMinutes ?? 999) ? a : b),
                validCandidates[0] as (typeof validCandidates)[number],
              );
            if (fastest && (fastest.deliveryMinMinutes ?? 999) < (item.deliveryMinMinutes ?? 999)) {
              best = {
                storeProductId: fastest.storeProductId,
                storeId: fastest.storeId,
                storeName: fastest.storeName,
                price: Number(fastest.price),
                reason: `Faster delivery (~${fastest.deliveryMinMinutes}min)`,
              };
            }
            break;
          }
          case "BALANCED": {
            const scored = validCandidates.map((c) => {
              const priceScore =
                currentPrice > 0 ? (currentPrice - Number(c.price)) / currentPrice : 0;
              const ratingScore = Number(c.storeRating) / 5;
              const speedScore = c.deliveryMinMinutes
                ? Math.max(0, 1 - c.deliveryMinMinutes / 120)
                : 0.5;
              return {
                ...c,
                totalScore: priceScore * 0.4 + ratingScore * 0.35 + speedScore * 0.25,
              };
            });
            const bestBalanced = scored.reduce((a, b) => (a.totalScore > b.totalScore ? a : b));
            if (bestBalanced.storeId !== item.currentStoreId && bestBalanced.totalScore > 0) {
              best = {
                storeProductId: bestBalanced.storeProductId,
                storeId: bestBalanced.storeId,
                storeName: bestBalanced.storeName,
                price: Number(bestBalanced.price),
                reason: "Best balanced option (price/rating/speed)",
              };
            }
            break;
          }
          case "SINGLE_STORE":
            break;
        }

        const changed = best.storeId !== item.currentStoreId;
        const savings = Math.max(0, currentPrice - best.price) * item.quantity;

        optimizedItems.push({
          productId: item.productId,
          productName: item.productName,
          currentStoreId: item.currentStoreId,
          currentStoreName: item.currentStoreName,
          currentPrice: item.currentPrice,
          suggestedStoreId: best.storeId,
          suggestedStoreName: best.storeName,
          suggestedPrice: best.price.toFixed(2),
          savings: savings.toFixed(2),
          quantity: item.quantity,
          changed,
          reason: best.reason,
        });
      }

      // For SINGLE_STORE mode, find the single store that covers the most items cheapest
      if (mode === "SINGLE_STORE") {
        const storeOptions = new Map<
          string,
          {
            storeName: string;
            total: number;
            covered: number;
            itemMap: Map<string, { price: number; storeProductId: string }>;
          }
        >();

        for (const [productId, candidates] of listingsByProduct) {
          for (const c of candidates) {
            const entry = storeOptions.get(c.storeId) ?? {
              storeName: c.storeName,
              total: 0,
              covered: 0,
              itemMap: new Map(),
            };
            if (!entry.itemMap.has(productId)) {
              entry.covered += 1;
              const item = items.find((i) => i.productId === productId);
              const qty = item?.quantity ?? 1;
              entry.total += Number(c.price) * qty;
              entry.itemMap.set(productId, {
                price: Number(c.price),
                storeProductId: c.storeProductId,
              });
            }
            storeOptions.set(c.storeId, entry);
          }
        }

        let bestOption: (typeof storeOptions extends Map<string, infer V> ? V : never) | null =
          null;
        let bestStoreId = "";
        for (const [storeId, option] of storeOptions) {
          if (
            !bestOption ||
            option.covered > bestOption.covered ||
            (option.covered === bestOption.covered && option.total < bestOption.total)
          ) {
            bestOption = option;
            bestStoreId = storeId;
          }
        }

        if (bestOption) {
          optimizedItems.length = 0;
          for (const item of items) {
            const suggestion = bestOption.itemMap.get(item.productId);
            const currentPrice = Number(item.currentPrice);

            if (suggestion) {
              const changed = bestStoreId !== item.currentStoreId;
              optimizedItems.push({
                productId: item.productId,
                productName: item.productName,
                currentStoreId: item.currentStoreId,
                currentStoreName: item.currentStoreName,
                currentPrice: item.currentPrice,
                suggestedStoreId: bestStoreId,
                suggestedStoreName: bestOption.storeName,
                suggestedPrice: suggestion.price.toFixed(2),
                savings: (Math.max(0, currentPrice - suggestion.price) * item.quantity).toFixed(2),
                quantity: item.quantity,
                changed,
                reason: changed
                  ? `Consolidate at ${bestOption.storeName}`
                  : "Already at optimal store",
              });
            } else {
              optimizedItems.push({
                productId: item.productId,
                productName: item.productName,
                currentStoreId: item.currentStoreId,
                currentStoreName: item.currentStoreName,
                currentPrice: item.currentPrice,
                suggestedStoreId: item.currentStoreId,
                suggestedStoreName: item.currentStoreName,
                suggestedPrice: item.currentPrice,
                savings: "0.00",
                quantity: item.quantity,
                changed: false,
                reason: `Not available at ${bestOption.storeName}`,
              });
            }
          }
        }
      }

      // Calculate totals
      const currentTotal = items.reduce((sum, i) => sum + Number(i.currentPrice) * i.quantity, 0);
      const optimizedTotal = optimizedItems.reduce(
        (sum, i) => sum + Number(i.suggestedPrice) * i.quantity,
        0,
      );

      // Delivery calculations
      const calcDelivery = (
        itemList: Array<{ storeId: string; price: number; quantity: number }>,
      ) => {
        const storeTotals = new Map<string, number>();
        for (const i of itemList) {
          storeTotals.set(i.storeId, (storeTotals.get(i.storeId) ?? 0) + i.price * i.quantity);
        }
        let total = 0;
        for (const [, subtotal] of storeTotals) {
          total += subtotal >= freeThreshold ? 0 : defaultDeliveryFee;
        }
        return total;
      };

      const currentDelivery = calcDelivery(
        items.map((i) => ({
          storeId: i.currentStoreId,
          price: Number(i.currentPrice),
          quantity: i.quantity,
        })),
      );
      const optimizedDelivery = calcDelivery(
        optimizedItems.map((i) => ({
          storeId: i.suggestedStoreId,
          price: Number(i.suggestedPrice),
          quantity: i.quantity,
        })),
      );

      const totalSavings = currentTotal + currentDelivery - (optimizedTotal + optimizedDelivery);
      const storeCount = new Set(optimizedItems.map((i) => i.suggestedStoreId)).size;

      const modeLabels: Record<string, string> = {
        CHEAPEST: "lowest prices",
        SINGLE_STORE: "single store consolidation",
        BEST_RATED: "highest rated stores",
        FASTEST: "fastest delivery",
        BALANCED: "best balance of price, rating, and speed",
      };

      const changedCount = optimizedItems.filter((i) => i.changed).length;
      const explanation =
        changedCount > 0
          ? `Optimized for ${modeLabels[mode]}. ${changedCount} item${changedCount > 1 ? "s" : ""} can be switched to save ৳${totalSavings.toFixed(2)} total.`
          : `Your cart is already optimized for ${modeLabels[mode]}.`;

      return ok({
        mode,
        currentTotal: currentTotal.toFixed(2),
        optimizedTotal: optimizedTotal.toFixed(2),
        savings: Math.max(0, currentTotal - optimizedTotal).toFixed(2),
        currentDelivery: currentDelivery.toFixed(2),
        optimizedDelivery: optimizedDelivery.toFixed(2),
        deliverySavings: Math.max(0, currentDelivery - optimizedDelivery).toFixed(2),
        items: optimizedItems,
        storeCount,
        explanation,
      });
    },
  );
};
