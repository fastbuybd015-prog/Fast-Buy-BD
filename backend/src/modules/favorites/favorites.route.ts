import { and, eq, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import { favorites, products } from "@/db/schema";
import { NotFoundError } from "@/errors/app-error";
import { authenticate, getUser } from "@/plugins/auth";
import { ok, successSchema } from "@/utils/response";

const favoriteItemSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string(),
  productSlug: z.string(),
  unit: z.string(),
  imageUrl: z.string().nullable(),
  minPrice: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const favoriteRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("preHandler", authenticate);

  app.get(
    "/",
    {
      schema: {
        tags: ["Favorites"],
        summary: "List user favorites",
        response: { 200: successSchema(z.array(favoriteItemSchema)) },
      },
    },
    async (request) => {
      const db = getDb();
      const userId = getUser(request).profileId;

      const rows = await db
        .select({
          id: favorites.id,
          productId: favorites.productId,
          productName: products.name,
          productSlug: products.slug,
          unit: products.unit,
          imageUrl: sql<string | null>`(
            SELECT image_url FROM product_images pi
            WHERE pi.product_id = "products"."id" AND pi.is_primary LIMIT 1
          )`,
          minPrice: sql<string | null>`(
            SELECT MIN(sp.price) FROM store_products sp
            WHERE sp.product_id = "products"."id" AND sp.is_active = true
          )`,
          createdAt: favorites.createdAt,
        })
        .from(favorites)
        .innerJoin(products, eq(products.id, favorites.productId))
        .where(eq(favorites.userId, userId))
        .orderBy(sql`${favorites.createdAt} DESC`);

      return ok(rows);
    },
  );

  app.post(
    "/:productId",
    {
      schema: {
        tags: ["Favorites"],
        summary: "Add product to favorites",
        params: z.object({ productId: z.string().uuid() }),
        response: { 201: successSchema(z.object({ favorited: z.boolean() })) },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const userId = getUser(request).profileId;
      const { productId } = request.params;

      const product = await db.query.products.findFirst({
        where: eq(products.id, productId),
        columns: { id: true },
      });
      if (!product) throw new NotFoundError("Product not found.");

      const existing = await db.query.favorites.findFirst({
        where: and(eq(favorites.userId, userId), eq(favorites.productId, productId)),
        columns: { id: true },
      });
      if (existing) {
        return reply.status(201).send(ok({ favorited: true }));
      }

      await db.insert(favorites).values({ userId, productId });
      return reply.status(201).send(ok({ favorited: true }));
    },
  );

  app.delete(
    "/:productId",
    {
      schema: {
        tags: ["Favorites"],
        summary: "Remove product from favorites",
        params: z.object({ productId: z.string().uuid() }),
        response: { 200: successSchema(z.object({ removed: z.boolean() })) },
      },
    },
    async (request) => {
      const db = getDb();
      const userId = getUser(request).profileId;

      await db
        .delete(favorites)
        .where(
          and(eq(favorites.userId, userId), eq(favorites.productId, request.params.productId)),
        );

      return ok({ removed: true });
    },
  );
};
