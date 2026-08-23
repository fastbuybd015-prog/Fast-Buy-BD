import { asc, eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import { brands } from "@/db/schema";
import { CACHE_KEYS, CACHE_TTL, getCached, setCache } from "@/utils/cache";
import { ok, successSchema } from "@/utils/response";

const brandSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().nullable(),
  isActive: z.boolean(),
});

export const brandRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/",
    {
      schema: {
        tags: ["Brands"],
        summary: "List active brands",
        response: { 200: successSchema(z.array(brandSchema)) },
      },
    },
    async () => {
      type BrandRow = z.infer<typeof brandSchema>;
      const cached = await getCached<BrandRow[]>(CACHE_KEYS.brands);
      if (cached) return ok(cached);

      const db = getDb();
      const rows = await db.query.brands.findMany({
        where: eq(brands.isActive, true),
        orderBy: [asc(brands.name)],
      });
      await setCache(CACHE_KEYS.brands, rows, CACHE_TTL.brands);
      return ok(rows);
    },
  );
};
