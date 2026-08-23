import { and, eq, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import {
  cartItems,
  carts,
  coupons,
  inventory,
  products,
  storeProducts,
  stores,
  systemSettings,
} from "@/db/schema";
import { NotFoundError, ValidationError } from "@/errors/app-error";
import { authenticate, getUser } from "@/plugins/auth";
import { ok, successSchema } from "@/utils/response";

type WarningType =
  | "PRICE_CHANGED"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "PRODUCT_UNAVAILABLE"
  | "STORE_UNAVAILABLE"
  | "COUPON_INVALID";

interface CheckoutWarning {
  type: WarningType;
  message: string;
  itemId?: string;
  storeProductId?: string;
}

const warningSchema = z.object({
  type: z.enum([
    "PRICE_CHANGED",
    "LOW_STOCK",
    "OUT_OF_STOCK",
    "PRODUCT_UNAVAILABLE",
    "STORE_UNAVAILABLE",
    "COUPON_INVALID",
  ]),
  message: z.string(),
  itemId: z.string().uuid().optional(),
  storeProductId: z.string().uuid().optional(),
});

const previewItemSchema = z.object({
  cartItemId: z.string().uuid(),
  storeProductId: z.string().uuid(),
  productName: z.string(),
  productSlug: z.string(),
  unit: z.string(),
  storeName: z.string(),
  storeSlug: z.string(),
  storeId: z.string().uuid(),
  quantity: z.number().int(),
  unitPrice: z.string(),
  originalUnitPrice: z.string(),
  discountPercentage: z.string().nullable(),
  lineTotal: z.string(),
  lineDiscount: z.string(),
  imageUrl: z.string().nullable(),
  available: z.number().int().nullable(),
  inStock: z.boolean(),
});

const storeBreakdownSchema = z.object({
  storeId: z.string().uuid(),
  storeName: z.string(),
  subtotal: z.string(),
  discountTotal: z.string(),
  deliveryFee: z.string(),
  total: z.string(),
  itemCount: z.number().int(),
});

const couponResultSchema = z.object({
  code: z.string(),
  valid: z.boolean(),
  type: z.string().optional(),
  discountAmount: z.string().optional(),
  reason: z.string().optional(),
});

const checkoutPreviewSchema = z.object({
  items: z.array(previewItemSchema),
  storeBreakdowns: z.array(storeBreakdownSchema),
  subtotal: z.string(),
  discountTotal: z.string(),
  deliveryTotal: z.string(),
  couponDiscount: z.string(),
  grandTotal: z.string(),
  itemCount: z.number().int(),
  coupon: couponResultSchema.nullable(),
  warnings: z.array(warningSchema),
});

async function getDeliverySetting(key: string): Promise<string | null> {
  const db = getDb();
  const row = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, key),
    columns: { value: true },
  });
  return row?.value ?? null;
}

export const checkoutRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("preHandler", authenticate);

  app.post(
    "/preview",
    {
      schema: {
        tags: ["Checkout"],
        summary: "Server-authoritative checkout preview",
        body: z.object({
          couponCode: z.string().max(50).optional(),
        }),
        response: { 200: successSchema(checkoutPreviewSchema) },
      },
    },
    async (request) => {
      const db = getDb();
      const userId = getUser(request).profileId;

      const cart = await db.query.carts.findFirst({
        where: and(eq(carts.userId, userId), eq(carts.status, "ACTIVE")),
      });
      if (!cart) throw new NotFoundError("No active cart found.");

      const rawItems = await db
        .select({
          cartItemId: cartItems.id,
          storeProductId: cartItems.storeProductId,
          quantity: cartItems.quantity,
          productId: products.id,
          productName: products.name,
          productSlug: products.slug,
          unit: products.unit,
          productActive: products.isActive,
          storeId: stores.id,
          storeName: stores.name,
          storeSlug: stores.slug,
          storeStatus: stores.status,
          listingActive: storeProducts.isActive,
          price: storeProducts.price,
          originalPrice: storeProducts.originalPrice,
          discountPercentage: storeProducts.discountPercentage,
          imageUrl: sql<string | null>`(
						SELECT image_url FROM product_images pi
						WHERE pi.product_id = "products"."id" AND pi.is_primary LIMIT 1
					)`,
          available: inventory.availableQuantity,
        })
        .from(cartItems)
        .innerJoin(storeProducts, eq(storeProducts.id, cartItems.storeProductId))
        .innerJoin(products, eq(products.id, storeProducts.productId))
        .innerJoin(stores, eq(stores.id, storeProducts.storeId))
        .leftJoin(inventory, eq(inventory.storeProductId, storeProducts.id))
        .where(eq(cartItems.cartId, cart.id));

      if (rawItems.length === 0) {
        throw new ValidationError("Your cart is empty.");
      }

      const warnings: CheckoutWarning[] = [];
      const validItems: typeof rawItems = [];

      for (const item of rawItems) {
        if (item.storeStatus !== "ACTIVE") {
          warnings.push({
            type: "STORE_UNAVAILABLE",
            message: `Store "${item.storeName}" is currently unavailable.`,
            itemId: item.cartItemId,
            storeProductId: item.storeProductId,
          });
          continue;
        }

        if (!item.productActive || !item.listingActive) {
          warnings.push({
            type: "PRODUCT_UNAVAILABLE",
            message: `"${item.productName}" is no longer available at ${item.storeName}.`,
            itemId: item.cartItemId,
            storeProductId: item.storeProductId,
          });
          continue;
        }

        const available = item.available ?? 0;
        if (available <= 0) {
          warnings.push({
            type: "OUT_OF_STOCK",
            message: `"${item.productName}" is out of stock at ${item.storeName}.`,
            itemId: item.cartItemId,
            storeProductId: item.storeProductId,
          });
          continue;
        }

        if (available < item.quantity) {
          warnings.push({
            type: "LOW_STOCK",
            message: `Only ${available} unit(s) of "${item.productName}" available at ${item.storeName}.`,
            itemId: item.cartItemId,
            storeProductId: item.storeProductId,
          });
        }

        validItems.push(item);
      }

      if (validItems.length === 0) {
        throw new ValidationError("No items in your cart are available for checkout.", {
          warnings,
        });
      }

      const previewItems = validItems.map((item) => {
        const unitPrice = Number(item.price);
        const originalUnitPrice = Number(item.originalPrice);
        const lineTotal = unitPrice * item.quantity;
        const lineDiscount = (originalUnitPrice - unitPrice) * item.quantity;
        return {
          cartItemId: item.cartItemId,
          storeProductId: item.storeProductId,
          productName: item.productName,
          productSlug: item.productSlug,
          unit: item.unit,
          storeName: item.storeName,
          storeSlug: item.storeSlug,
          storeId: item.storeId,
          quantity: item.quantity,
          unitPrice: unitPrice.toFixed(2),
          originalUnitPrice: originalUnitPrice.toFixed(2),
          discountPercentage: item.discountPercentage,
          lineTotal: lineTotal.toFixed(2),
          lineDiscount: lineDiscount.toFixed(2),
          imageUrl: item.imageUrl,
          available: item.available,
          inStock: (item.available ?? 0) > 0,
        };
      });

      const storeMap = new Map<
        string,
        { storeName: string; subtotal: number; discountTotal: number; itemCount: number }
      >();
      for (const item of previewItems) {
        const existing = storeMap.get(item.storeId);
        if (existing) {
          existing.subtotal += Number(item.lineTotal);
          existing.discountTotal += Number(item.lineDiscount);
          existing.itemCount += 1;
        } else {
          storeMap.set(item.storeId, {
            storeName: item.storeName,
            subtotal: Number(item.lineTotal),
            discountTotal: Number(item.lineDiscount),
            itemCount: 1,
          });
        }
      }

      const defaultFeeStr = await getDeliverySetting("delivery.default_fee");
      const freeThresholdStr = await getDeliverySetting("delivery.free_threshold");
      const defaultFee = defaultFeeStr ? Number(defaultFeeStr) : 60;
      const freeThreshold = freeThresholdStr ? Number(freeThresholdStr) : 500;

      let deliveryTotal = 0;
      const storeBreakdowns = [...storeMap.entries()].map(
        ([storeId, { storeName, subtotal, discountTotal, itemCount }]) => {
          const deliveryFee = subtotal >= freeThreshold ? 0 : defaultFee;
          deliveryTotal += deliveryFee;
          const total = subtotal - discountTotal + deliveryFee;
          return {
            storeId,
            storeName,
            subtotal: subtotal.toFixed(2),
            discountTotal: discountTotal.toFixed(2),
            deliveryFee: deliveryFee.toFixed(2),
            total: total.toFixed(2),
            itemCount,
          };
        },
      );

      const subtotal = previewItems.reduce((sum, i) => sum + Number(i.lineTotal), 0);
      const discountTotal = previewItems.reduce((sum, i) => sum + Number(i.lineDiscount), 0);

      let couponDiscount = 0;
      let couponResult: z.infer<typeof couponResultSchema> | null = null;
      const { couponCode } = request.body;

      if (couponCode) {
        const coupon = await db.query.coupons.findFirst({
          where: eq(coupons.code, couponCode),
        });

        if (!coupon?.isActive) {
          couponResult = {
            code: couponCode,
            valid: false,
            reason: "Coupon not found or inactive.",
          };
          warnings.push({ type: "COUPON_INVALID", message: "Coupon not found or inactive." });
        } else {
          const now = new Date();
          if (coupon.startsAt && now < coupon.startsAt) {
            couponResult = { code: couponCode, valid: false, reason: "Coupon is not yet active." };
            warnings.push({ type: "COUPON_INVALID", message: "Coupon is not yet active." });
          } else if (coupon.expiresAt && now > coupon.expiresAt) {
            couponResult = { code: couponCode, valid: false, reason: "Coupon has expired." };
            warnings.push({ type: "COUPON_INVALID", message: "Coupon has expired." });
          } else if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
            couponResult = {
              code: couponCode,
              valid: false,
              reason: "Coupon usage limit reached.",
            };
            warnings.push({ type: "COUPON_INVALID", message: "Coupon usage limit reached." });
          } else if (Number(coupon.minimumOrder) > subtotal) {
            couponResult = {
              code: couponCode,
              valid: false,
              reason: `Minimum order of ৳${coupon.minimumOrder} required.`,
            };
            warnings.push({
              type: "COUPON_INVALID",
              message: `Minimum order of ৳${coupon.minimumOrder} required.`,
            });
          } else {
            if (coupon.type === "PERCENTAGE") {
              couponDiscount = (subtotal * Number(coupon.value)) / 100;
              if (coupon.maximumDiscount) {
                couponDiscount = Math.min(couponDiscount, Number(coupon.maximumDiscount));
              }
            } else {
              couponDiscount = Number(coupon.value);
            }
            couponDiscount = Math.min(couponDiscount, subtotal);
            couponDiscount = Math.round(couponDiscount * 100) / 100;

            couponResult = {
              code: couponCode,
              valid: true,
              type: coupon.type,
              discountAmount: couponDiscount.toFixed(2),
            };
          }
        }
      }

      const grandTotal = subtotal - couponDiscount + deliveryTotal;

      return ok({
        items: previewItems,
        storeBreakdowns,
        subtotal: subtotal.toFixed(2),
        discountTotal: discountTotal.toFixed(2),
        deliveryTotal: deliveryTotal.toFixed(2),
        couponDiscount: couponDiscount.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        itemCount: previewItems.length,
        coupon: couponResult,
        warnings,
      });
    },
  );
};
