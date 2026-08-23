import { and, eq, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import { cartItems, carts, inventory, products, storeProducts, stores } from "@/db/schema";
import { NotFoundError } from "@/errors/app-error";
import { authenticate, getUser } from "@/plugins/auth";
import { ok, successSchema } from "@/utils/response";

const cartItemSchema = z.object({
  id: z.string().uuid(),
  storeProductId: z.string().uuid(),
  quantity: z.number().int(),
  productName: z.string(),
  productSlug: z.string(),
  unit: z.string(),
  storeName: z.string(),
  storeSlug: z.string(),
  price: z.string(),
  originalPrice: z.string(),
  discountPercentage: z.string().nullable(),
  primaryImage: z.string().nullable(),
  available: z.number().int().nullable(),
  inStock: z.boolean(),
});

const cartSchema = z.object({
  id: z.string().uuid(),
  items: z.array(cartItemSchema),
  itemCount: z.number().int(),
});

async function getOrCreateCart(userId: string) {
  const db = getDb();
  let cart = await db.query.carts.findFirst({
    where: and(eq(carts.userId, userId), eq(carts.status, "ACTIVE")),
  });
  if (!cart) {
    const [created] = await db.insert(carts).values({ userId }).returning();
    cart = created as NonNullable<typeof created>;
  }
  return cart;
}

async function getCartWithItems(cartId: string) {
  const db = getDb();
  const items = await db
    .select({
      id: cartItems.id,
      storeProductId: cartItems.storeProductId,
      quantity: cartItems.quantity,
      productName: products.name,
      productSlug: products.slug,
      unit: products.unit,
      storeName: stores.name,
      storeSlug: stores.slug,
      price: storeProducts.price,
      originalPrice: storeProducts.originalPrice,
      discountPercentage: storeProducts.discountPercentage,
      primaryImage: sql<string | null>`(
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
    .where(eq(cartItems.cartId, cartId));

  return {
    id: cartId,
    items: items.map((i) => ({
      ...i,
      inStock: (i.available ?? 0) > 0,
    })),
    itemCount: items.length,
  };
}

export const cartRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("preHandler", authenticate);

  app.get(
    "/",
    {
      schema: {
        tags: ["Cart"],
        summary: "Get current cart",
        response: { 200: successSchema(cartSchema) },
      },
    },
    async (request) => {
      const cart = await getOrCreateCart(getUser(request).profileId);
      return ok(await getCartWithItems(cart.id));
    },
  );

  app.post(
    "/items",
    {
      schema: {
        tags: ["Cart"],
        summary: "Add item to cart",
        body: z.object({
          storeProductId: z.string().uuid(),
          quantity: z.number().int().min(1).default(1),
        }),
        response: { 200: successSchema(cartSchema) },
      },
    },
    async (request) => {
      const db = getDb();
      const { storeProductId, quantity } = request.body;

      const listing = await db.query.storeProducts.findFirst({
        where: eq(storeProducts.id, storeProductId),
        columns: { id: true, isActive: true, productId: true, storeId: true },
      });
      if (!listing) throw new NotFoundError("Product listing not found.");
      if (!listing.isActive) throw new NotFoundError("Product listing is inactive.");

      const product = await db.query.products.findFirst({
        where: eq(products.id, listing.productId),
        columns: { isActive: true },
      });
      if (!product?.isActive) throw new NotFoundError("Product is not available.");

      const store = await db.query.stores.findFirst({
        where: eq(stores.id, listing.storeId),
        columns: { status: true },
      });
      if (store?.status !== "ACTIVE") throw new NotFoundError("Store is not active.");

      const cart = await getOrCreateCart(getUser(request).profileId);

      const existing = await db.query.cartItems.findFirst({
        where: and(eq(cartItems.cartId, cart.id), eq(cartItems.storeProductId, storeProductId)),
      });

      if (existing) {
        await db
          .update(cartItems)
          .set({ quantity: existing.quantity + quantity, updatedAt: new Date() })
          .where(eq(cartItems.id, existing.id));
      } else {
        await db.insert(cartItems).values({ cartId: cart.id, storeProductId, quantity });
      }

      return ok(await getCartWithItems(cart.id));
    },
  );

  app.patch(
    "/items/:id",
    {
      schema: {
        tags: ["Cart"],
        summary: "Update cart item quantity",
        params: z.object({ id: z.string().uuid() }),
        body: z.object({ quantity: z.number().int().min(1) }),
        response: { 200: successSchema(cartSchema) },
      },
    },
    async (request) => {
      const db = getDb();
      const cart = await getOrCreateCart(getUser(request).profileId);

      const item = await db.query.cartItems.findFirst({
        where: and(eq(cartItems.id, request.params.id), eq(cartItems.cartId, cart.id)),
      });
      if (!item) throw new NotFoundError("Cart item not found.");

      await db
        .update(cartItems)
        .set({ quantity: request.body.quantity, updatedAt: new Date() })
        .where(eq(cartItems.id, item.id));

      return ok(await getCartWithItems(cart.id));
    },
  );

  app.delete(
    "/items/:id",
    {
      schema: {
        tags: ["Cart"],
        summary: "Remove item from cart",
        params: z.object({ id: z.string().uuid() }),
        response: { 200: successSchema(cartSchema) },
      },
    },
    async (request) => {
      const db = getDb();
      const cart = await getOrCreateCart(getUser(request).profileId);

      const item = await db.query.cartItems.findFirst({
        where: and(eq(cartItems.id, request.params.id), eq(cartItems.cartId, cart.id)),
      });
      if (!item) throw new NotFoundError("Cart item not found.");

      await db.delete(cartItems).where(eq(cartItems.id, item.id));

      return ok(await getCartWithItems(cart.id));
    },
  );

  app.delete(
    "/",
    {
      schema: {
        tags: ["Cart"],
        summary: "Clear cart",
        response: { 200: successSchema(z.object({ cleared: z.boolean() })) },
      },
    },
    async (request) => {
      const db = getDb();
      const cart = await getOrCreateCart(getUser(request).profileId);
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      return ok({ cleared: true });
    },
  );

  app.post(
    "/merge",
    {
      schema: {
        tags: ["Cart"],
        summary: "Merge guest cart items after login",
        body: z.object({
          items: z.array(
            z.object({
              storeProductId: z.string().uuid(),
              quantity: z.number().int().min(1),
            }),
          ),
        }),
        response: { 200: successSchema(cartSchema) },
      },
    },
    async (request) => {
      const db = getDb();
      const cart = await getOrCreateCart(getUser(request).profileId);

      for (const item of request.body.items) {
        const listing = await db.query.storeProducts.findFirst({
          where: and(eq(storeProducts.id, item.storeProductId), eq(storeProducts.isActive, true)),
          columns: { id: true },
        });
        if (!listing) continue;

        const existing = await db.query.cartItems.findFirst({
          where: and(
            eq(cartItems.cartId, cart.id),
            eq(cartItems.storeProductId, item.storeProductId),
          ),
        });

        if (existing) {
          await db
            .update(cartItems)
            .set({ quantity: existing.quantity + item.quantity, updatedAt: new Date() })
            .where(eq(cartItems.id, existing.id));
        } else {
          await db.insert(cartItems).values({
            cartId: cart.id,
            storeProductId: item.storeProductId,
            quantity: item.quantity,
          });
        }
      }

      return ok(await getCartWithItems(cart.id));
    },
  );
};
