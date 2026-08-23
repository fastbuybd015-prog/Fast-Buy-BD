import { eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import { systemSettings } from "@/db/schema";
import { CACHE_KEYS, CACHE_TTL, getCached, setCache } from "@/utils/cache";
import { ok, successSchema } from "@/utils/response";

export const settingsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/",
    {
      schema: {
        tags: ["Settings"],
        summary: "Get public system settings",
        response: {
          200: successSchema(
            z.record(
              z.string(),
              z.object({
                value: z.string(),
                valueType: z.string(),
                label: z.string().nullable(),
              }),
            ),
          ),
        },
      },
    },
    async () => {
      type SettingsResult = Record<
        string,
        { value: string; valueType: string; label: string | null }
      >;
      const cached = await getCached<SettingsResult>(CACHE_KEYS.publicSettings);
      if (cached) return ok(cached);

      const db = getDb();

      const rows = await db.query.systemSettings.findMany({
        where: eq(systemSettings.isPublic, true),
        columns: {
          key: true,
          value: true,
          valueType: true,
          label: true,
        },
      });

      const result: SettingsResult = {};
      for (const row of rows) {
        result[row.key] = {
          value: row.value,
          valueType: row.valueType,
          label: row.label,
        };
      }

      await setCache(CACHE_KEYS.publicSettings, result, CACHE_TTL.publicSettings);
      return ok(result);
    },
  );
};
