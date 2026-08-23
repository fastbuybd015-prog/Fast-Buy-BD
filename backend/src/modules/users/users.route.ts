import { eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { NotFoundError } from "@/errors/app-error";
import { authenticate, getUser } from "@/plugins/auth";
import { ok, successSchema } from "@/utils/response";

const profileSchema = z.object({
  id: z.string().uuid(),
  role: z.string(),
  fullName: z.string(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.coerce.date(),
});

const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  phone: z.string().min(5).max(20).optional(),
  avatarUrl: z.string().url().optional(),
});

export const userRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/me",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Users"],
        summary: "Get current user profile",
        response: { 200: successSchema(profileSchema) },
      },
    },
    async (request) => {
      const db = getDb();
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.id, getUser(request).profileId),
        columns: {
          id: true,
          role: true,
          fullName: true,
          phone: true,
          avatarUrl: true,
          createdAt: true,
        },
      });
      if (!profile) throw new NotFoundError("Profile not found.");
      return ok(profile);
    },
  );

  app.patch(
    "/me",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Users"],
        summary: "Update current user profile",
        body: updateProfileSchema,
        response: { 200: successSchema(profileSchema) },
      },
    },
    async (request) => {
      const db = getDb();
      const [updated] = await db
        .update(profiles)
        .set({ ...request.body, updatedAt: new Date() })
        .where(eq(profiles.id, getUser(request).profileId))
        .returning({
          id: profiles.id,
          role: profiles.role,
          fullName: profiles.fullName,
          phone: profiles.phone,
          avatarUrl: profiles.avatarUrl,
          createdAt: profiles.createdAt,
        });
      if (!updated) throw new NotFoundError("Profile not found.");
      return ok(updated);
    },
  );
};
