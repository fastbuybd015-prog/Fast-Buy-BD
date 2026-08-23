import { and, asc, eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { NotFoundError } from "@/errors/app-error";
import { CACHE_KEYS, CACHE_TTL, getCached, setCache } from "@/utils/cache";
import { ok, successSchema } from "@/utils/response";

const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  parentId: z.string().uuid().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});

export const categoryRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/",
    {
      schema: {
        tags: ["Categories"],
        summary: "List active categories",
        response: { 200: successSchema(z.array(categorySchema)) },
      },
    },
    async () => {
      type CategoryRow = {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        imageUrl: string | null;
        parentId: string | null;
        isActive: boolean;
        sortOrder: number;
      };
      const cached = await getCached<CategoryRow[]>(CACHE_KEYS.categories);
      if (cached) return ok(cached);

      const db = getDb();
      const rows = await db.query.categories.findMany({
        where: eq(categories.isActive, true),
        orderBy: [asc(categories.sortOrder), asc(categories.name)],
      });
      await setCache(CACHE_KEYS.categories, rows, CACHE_TTL.categories);
      return ok(rows);
    },
  );

  app.get(
    "/:slug",
    {
      schema: {
        tags: ["Categories"],
        summary: "Get category by slug",
        params: z.object({ slug: z.string() }),
        response: { 200: successSchema(categorySchema) },
      },
    },
    async (request) => {
      const db = getDb();
      const category = await db.query.categories.findFirst({
        where: and(eq(categories.slug, request.params.slug), eq(categories.isActive, true)),
      });
      if (!category) throw new NotFoundError("Category not found.");
      return ok(category);
    },
  );
};
