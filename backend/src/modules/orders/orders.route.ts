import { and, eq, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import type { Database } from "@/db";
import { getDb } from "@/db";
import {
  addresses,
  cartItems,
  carts,
  coupons,
  couponUsage,
  inventory,
  inventoryMovements,
  orderItems,
  orderStatusHistory,
  orders,
  products,
  storeOrders,
  storeProducts,
  stores,
  systemSettings,
} from "@/db/schema";
import { ConflictError, NotFoundError, ValidationError } from "@/errors/app-error";
import { authenticate, getUser } from "@/plugins/auth";
import { RATE_LIMITS } from "@/plugins/rate-limit";
import { subscribeToOrder } from "@/plugins/websocket";
import { CACHE_KEYS, invalidateCache, invalidateCachePattern } from "@/utils/cache";
import { ok, successSchema } from "@/utils/response";

function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `FSB-${y}${m}${d}-${code}`;
}

async function getDeliverySetting(db: Database, key: string): Promise<string | null> {
  const row = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, key),
    columns: { value: true },
  });
  return row?.value ?? null;
}

const orderItemResponseSchema = z.object({
  id: z.string().uuid(),
  productNameSnapshot: z.string(),
  storeNameSnapshot: z.string(),
  unitSnapshot: z.string(),
  imageUrlSnapshot: z.string().nullable(),
  quantity: z.number().int(),
  unitPrice: z.string(),
  originalUnitPrice: z.string(),
  discountAmount: z.string(),
  lineTotal: z.string(),
});

const storeOrderResponseSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid(),
  storeName: z.string().optional(),
  subtotal: z.string(),
  discountTotal: z.string(),
  deliveryFee: z.string(),
  total: z.string(),
  status: z.string(),
  items: z.array(orderItemResponseSchema),
});

const orderResponseSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  subtotal: z.string(),
  discountTotal: z.string(),
  deliveryTotal: z.string(),
  grandTotal: z.string(),
  couponCodeSnapshot: z.string().nullable(),
  paymentStatus: z.string(),
  orderStatus: z.string(),
  recipientNameSnapshot: z.string(),
  phoneSnapshot: z.string(),
  addressLineSnapshot: z.string(),
  citySnapshot: z.string(),
  areaSnapshot: z.string().nullable(),
  postalCodeSnapshot: z.string().nullable(),
  notes: z.string().nullable(),
  placedAt: z.coerce.date(),
  storeOrders: z.array(storeOrderResponseSchema),
});

export const orderRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("preHandler", authenticate);

  app.post(
    "/",
    {
      preHandler: [RATE_LIMITS.orderCreate],
      schema: {
        tags: ["Orders"],
        summary: "Create order from cart",
        body: z.object({
          addressId: z.string().uuid(),
          couponCode: z.string().max(50).optional(),
          notes: z.string().max(500).optional(),
          idempotencyKey: z.string().max(100).optional(),
        }),
        response: { 201: successSchema(orderResponseSchema) },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const userId = getUser(request).profileId;

      if (request.body.idempotencyKey) {
        const existing = await db.query.orders.findFirst({
          where: eq(orders.idempotencyKey, request.body.idempotencyKey),
          columns: { id: true, userId: true },
        });
        if (existing) {
          if (existing.userId !== userId) {
            throw new ConflictError("Invalid idempotency key.");
          }
          const existingOrder = await loadOrderResponse(db, existing.id);
          return reply.status(201).send(ok(existingOrder));
        }
      }

      const address = await db.query.addresses.findFirst({
        where: and(eq(addresses.id, request.body.addressId), eq(addresses.userId, userId)),
      });
      if (!address) throw new NotFoundError("Address not found.");

      const cart = await db.query.carts.findFirst({
        where: and(eq(carts.userId, userId), eq(carts.status, "ACTIVE")),
      });
      if (!cart) throw new NotFoundError("No active cart found.");

      const cartRows = await db
        .select({
          cartItemId: cartItems.id,
          storeProductId: cartItems.storeProductId,
          quantity: cartItems.quantity,
          productId: products.id,
          productName: products.name,
          unit: products.unit,
          productActive: products.isActive,
          storeId: stores.id,
          storeName: stores.name,
          storeStatus: stores.status,
          listingActive: storeProducts.isActive,
          price: storeProducts.price,
          originalPrice: storeProducts.originalPrice,
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

      if (cartRows.length === 0) {
        throw new ValidationError("Your cart is empty.");
      }

      for (const item of cartRows) {
        if (item.storeStatus !== "ACTIVE") {
          throw new ValidationError(`Store "${item.storeName}" is not active.`);
        }
        if (!item.productActive || !item.listingActive) {
          throw new ValidationError(`"${item.productName}" is no longer available.`);
        }
        const available = item.available ?? 0;
        if (available < item.quantity) {
          throw new ValidationError(
            `Insufficient stock for "${item.productName}". Available: ${available}, requested: ${item.quantity}.`,
          );
        }
      }

      const defaultFeeStr = await getDeliverySetting(db, "delivery.default_fee");
      const freeThresholdStr = await getDeliverySetting(db, "delivery.free_threshold");
      const defaultFee = defaultFeeStr ? Number(defaultFeeStr) : 60;
      const freeThreshold = freeThresholdStr ? Number(freeThresholdStr) : 500;

      const storeGroups = new Map<
        string,
        {
          storeName: string;
          items: typeof cartRows;
        }
      >();
      for (const row of cartRows) {
        const group = storeGroups.get(row.storeId);
        if (group) {
          group.items.push(row);
        } else {
          storeGroups.set(row.storeId, { storeName: row.storeName, items: [row] });
        }
      }

      let couponId: string | null = null;
      let couponDiscount = 0;
      let couponCodeSnapshot: string | null = null;
      const { couponCode } = request.body;

      let overallSubtotal = 0;
      for (const [, group] of storeGroups) {
        for (const item of group.items) {
          overallSubtotal += Number(item.price) * item.quantity;
        }
      }

      if (couponCode) {
        const coupon = await db.query.coupons.findFirst({
          where: eq(coupons.code, couponCode),
        });
        if (!coupon?.isActive) {
          throw new ValidationError("Coupon not found or inactive.");
        }
        const now = new Date();
        if (coupon.startsAt && now < coupon.startsAt) {
          throw new ValidationError("Coupon is not yet active.");
        }
        if (coupon.expiresAt && now > coupon.expiresAt) {
          throw new ValidationError("Coupon has expired.");
        }
        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
          throw new ValidationError("Coupon usage limit reached.");
        }
        if (Number(coupon.minimumOrder) > overallSubtotal) {
          throw new ValidationError(`Minimum order of ৳${coupon.minimumOrder} required.`);
        }

        if (coupon.perUserLimit !== null) {
          const [userUsage] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(couponUsage)
            .where(and(eq(couponUsage.couponId, coupon.id), eq(couponUsage.userId, userId)));
          if (userUsage && userUsage.count >= coupon.perUserLimit) {
            throw new ValidationError("You have reached the usage limit for this coupon.");
          }
        }

        if (coupon.type === "PERCENTAGE") {
          couponDiscount = (overallSubtotal * Number(coupon.value)) / 100;
          if (coupon.maximumDiscount) {
            couponDiscount = Math.min(couponDiscount, Number(coupon.maximumDiscount));
          }
        } else {
          couponDiscount = Number(coupon.value);
        }
        couponDiscount = Math.min(couponDiscount, overallSubtotal);
        couponDiscount = Math.round(couponDiscount * 100) / 100;

        couponId = coupon.id;
        couponCodeSnapshot = coupon.code;
      }

      let deliveryTotal = 0;
      const storeDeliveryFees = new Map<string, number>();
      for (const [storeId, group] of storeGroups) {
        let storeSubtotal = 0;
        for (const item of group.items) {
          storeSubtotal += Number(item.price) * item.quantity;
        }
        const fee = storeSubtotal >= freeThreshold ? 0 : defaultFee;
        storeDeliveryFees.set(storeId, fee);
        deliveryTotal += fee;
      }

      const grandTotal = overallSubtotal - couponDiscount + deliveryTotal;
      const orderNumber = generateOrderNumber();

      const result = await db.transaction(async (tx) => {
        const [parentOrder] = await tx
          .insert(orders)
          .values({
            orderNumber,
            userId,
            addressId: address.id,
            recipientNameSnapshot: address.recipientName,
            phoneSnapshot: address.phone,
            addressLineSnapshot: address.addressLine,
            citySnapshot: address.city,
            areaSnapshot: address.area ?? null,
            postalCodeSnapshot: address.postalCode ?? null,
            subtotal: overallSubtotal.toFixed(2),
            discountTotal: couponDiscount.toFixed(2),
            deliveryTotal: deliveryTotal.toFixed(2),
            grandTotal: grandTotal.toFixed(2),
            couponCodeSnapshot,
            notes: request.body.notes ?? null,
            idempotencyKey: request.body.idempotencyKey ?? null,
          })
          .returning();

        const order = parentOrder as NonNullable<typeof parentOrder>;

        const createdStoreOrders: Array<{
          id: string;
          storeId: string;
          storeName: string;
          subtotal: string;
          discountTotal: string;
          deliveryFee: string;
          total: string;
          status: string;
          items: Array<{
            id: string;
            productNameSnapshot: string;
            storeNameSnapshot: string;
            unitSnapshot: string;
            imageUrlSnapshot: string | null;
            quantity: number;
            unitPrice: string;
            originalUnitPrice: string;
            discountAmount: string;
            lineTotal: string;
          }>;
        }> = [];

        for (const [storeId, group] of storeGroups) {
          let storeSubtotal = 0;
          let storeDiscountTotal = 0;
          for (const item of group.items) {
            const up = Number(item.price);
            const origUp = Number(item.originalPrice);
            storeSubtotal += up * item.quantity;
            storeDiscountTotal += (origUp - up) * item.quantity;
          }
          const deliveryFee = storeDeliveryFees.get(storeId) ?? 0;
          const storeTotal = storeSubtotal - storeDiscountTotal + deliveryFee;

          const [so] = await tx
            .insert(storeOrders)
            .values({
              orderId: order.id,
              storeId,
              subtotal: storeSubtotal.toFixed(2),
              discountTotal: storeDiscountTotal.toFixed(2),
              deliveryFee: deliveryFee.toFixed(2),
              total: storeTotal.toFixed(2),
            })
            .returning();

          const storeOrder = so as NonNullable<typeof so>;
          const soItems: (typeof createdStoreOrders)[number]["items"] = [];

          for (const item of group.items) {
            const unitPrice = Number(item.price);
            const originalUnitPrice = Number(item.originalPrice);
            const discountAmount = (originalUnitPrice - unitPrice) * item.quantity;
            const lineTotal = unitPrice * item.quantity;

            const [oi] = await tx
              .insert(orderItems)
              .values({
                orderId: order.id,
                storeOrderId: storeOrder.id,
                productId: item.productId,
                storeProductId: item.storeProductId,
                productNameSnapshot: item.productName,
                storeNameSnapshot: item.storeName,
                unitSnapshot: item.unit,
                imageUrlSnapshot: item.imageUrl,
                quantity: item.quantity,
                unitPrice: unitPrice.toFixed(2),
                originalUnitPrice: originalUnitPrice.toFixed(2),
                discountAmount: discountAmount.toFixed(2),
                lineTotal: lineTotal.toFixed(2),
              })
              .returning({ id: orderItems.id });

            soItems.push({
              id: (oi as NonNullable<typeof oi>).id,
              productNameSnapshot: item.productName,
              storeNameSnapshot: item.storeName,
              unitSnapshot: item.unit,
              imageUrlSnapshot: item.imageUrl,
              quantity: item.quantity,
              unitPrice: unitPrice.toFixed(2),
              originalUnitPrice: originalUnitPrice.toFixed(2),
              discountAmount: discountAmount.toFixed(2),
              lineTotal: lineTotal.toFixed(2),
            });

            const reserved = await tx
              .update(inventory)
              .set({
                reservedQuantity: sql`${inventory.reservedQuantity} + ${item.quantity}`,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(inventory.storeProductId, item.storeProductId),
                  sql`${inventory.quantity} - ${inventory.reservedQuantity} >= ${item.quantity}`,
                ),
              )
              .returning({ id: inventory.id });

            if (reserved.length === 0) {
              throw new ValidationError(
                `Insufficient stock for "${item.productName}". Please try again.`,
              );
            }

            await tx.insert(inventoryMovements).values({
              storeProductId: item.storeProductId,
              type: "ORDER_RESERVED",
              quantity: -item.quantity,
              referenceType: "order",
              referenceId: order.id,
            });
          }

          createdStoreOrders.push({
            id: storeOrder.id,
            storeId,
            storeName: group.storeName,
            subtotal: storeSubtotal.toFixed(2),
            discountTotal: storeDiscountTotal.toFixed(2),
            deliveryFee: deliveryFee.toFixed(2),
            total: storeTotal.toFixed(2),
            status: storeOrder.status,
            items: soItems,
          });

          await tx.insert(orderStatusHistory).values({
            orderId: order.id,
            storeOrderId: storeOrder.id,
            newStatus: "PENDING_PAYMENT",
          });
        }

        await tx.insert(orderStatusHistory).values({
          orderId: order.id,
          newStatus: "PENDING_PAYMENT",
        });

        if (couponId) {
          await tx.insert(couponUsage).values({
            couponId,
            userId,
            orderId: order.id,
            discountAmount: couponDiscount.toFixed(2),
          });

          await tx
            .update(coupons)
            .set({ usedCount: sql`${coupons.usedCount} + 1` })
            .where(eq(coupons.id, couponId));
        }

        await tx
          .update(carts)
          .set({ status: "CONVERTED", updatedAt: new Date() })
          .where(eq(carts.id, cart.id));

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          subtotal: order.subtotal,
          discountTotal: order.discountTotal,
          deliveryTotal: order.deliveryTotal,
          grandTotal: order.grandTotal,
          couponCodeSnapshot: order.couponCodeSnapshot,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
          recipientNameSnapshot: order.recipientNameSnapshot,
          phoneSnapshot: order.phoneSnapshot,
          addressLineSnapshot: order.addressLineSnapshot,
          citySnapshot: order.citySnapshot,
          areaSnapshot: order.areaSnapshot,
          postalCodeSnapshot: order.postalCodeSnapshot,
          notes: order.notes,
          placedAt: order.placedAt,
          storeOrders: createdStoreOrders,
        };
      });

      // Invalidate relevant analytics and recommendation caches asynchronously
      void invalidateCachePattern("analytics:admin:*");
      void invalidateCachePattern("analytics:store:*");
      void invalidateCache(CACHE_KEYS.recommendations(userId));

      return reply.status(201).send(ok(result));
    },
  );

  app.get(
    "/",
    {
      schema: {
        tags: ["Orders"],
        summary: "List current user's orders",
        querystring: z.object({
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(50).default(10),
        }),
        response: {
          200: z.object({
            success: z.literal(true),
            data: z.array(
              z.object({
                id: z.string().uuid(),
                orderNumber: z.string(),
                grandTotal: z.string(),
                paymentStatus: z.string(),
                orderStatus: z.string(),
                itemCount: z.number().int(),
                placedAt: z.coerce.date(),
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
      const userId = getUser(request).profileId;
      const { page, limit } = request.query;
      const offset = (page - 1) * limit;

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(eq(orders.userId, userId));

      const total = countResult?.count ?? 0;

      const rows = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          grandTotal: orders.grandTotal,
          paymentStatus: orders.paymentStatus,
          orderStatus: orders.orderStatus,
          placedAt: orders.placedAt,
          itemCount: sql<number>`(
            SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = ${orders.id}
          )`,
        })
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(sql`${orders.placedAt} DESC`)
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
    "/:id",
    {
      schema: {
        tags: ["Orders"],
        summary: "Get order details",
        params: z.object({ id: z.string().uuid() }),
        response: { 200: successSchema(orderResponseSchema) },
      },
    },
    async (request) => {
      const db = getDb();
      const userId = getUser(request).profileId;

      const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, request.params.id), eq(orders.userId, userId)),
      });
      if (!order) throw new NotFoundError("Order not found.");

      const result = await loadOrderResponse(db, order.id);
      return ok(result);
    },
  );

  // Real-time WebSocket Order Tracking Live Stream
  app.get("/:id/ws", { websocket: true }, (socket, request) => {
    const orderId = (request.params as { id: string }).id;
    subscribeToOrder(orderId, socket);
    socket.send(
      JSON.stringify({
        event: "CONNECTED",
        orderId,
        message: `Subscribed to live WebSocket tracking for order ${orderId}`,
        timestamp: new Date().toISOString(),
      }),
    );
  });
};

async function loadOrderResponse(db: Database, orderId: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });
  if (!order) throw new NotFoundError("Order not found.");

  const soRows = await db
    .select({
      id: storeOrders.id,
      storeId: storeOrders.storeId,
      subtotal: storeOrders.subtotal,
      discountTotal: storeOrders.discountTotal,
      deliveryFee: storeOrders.deliveryFee,
      total: storeOrders.total,
      status: storeOrders.status,
      storeName: stores.name,
    })
    .from(storeOrders)
    .innerJoin(stores, eq(stores.id, storeOrders.storeId))
    .where(eq(storeOrders.orderId, orderId));

  const oiRows = await db
    .select({
      id: orderItems.id,
      storeOrderId: orderItems.storeOrderId,
      productNameSnapshot: orderItems.productNameSnapshot,
      storeNameSnapshot: orderItems.storeNameSnapshot,
      unitSnapshot: orderItems.unitSnapshot,
      imageUrlSnapshot: orderItems.imageUrlSnapshot,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      originalUnitPrice: orderItems.originalUnitPrice,
      discountAmount: orderItems.discountAmount,
      lineTotal: orderItems.lineTotal,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const soResult = soRows.map((so) => ({
    id: so.id,
    storeId: so.storeId,
    storeName: so.storeName,
    subtotal: so.subtotal,
    discountTotal: so.discountTotal,
    deliveryFee: so.deliveryFee,
    total: so.total,
    status: so.status,
    items: oiRows.filter((oi) => oi.storeOrderId === so.id),
  }));

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    subtotal: order.subtotal,
    discountTotal: order.discountTotal,
    deliveryTotal: order.deliveryTotal,
    grandTotal: order.grandTotal,
    couponCodeSnapshot: order.couponCodeSnapshot,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    recipientNameSnapshot: order.recipientNameSnapshot,
    phoneSnapshot: order.phoneSnapshot,
    addressLineSnapshot: order.addressLineSnapshot,
    citySnapshot: order.citySnapshot,
    areaSnapshot: order.areaSnapshot,
    postalCodeSnapshot: order.postalCodeSnapshot,
    notes: order.notes,
    placedAt: order.placedAt,
    storeOrders: soResult,
  };
}
