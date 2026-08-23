import { and, eq, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { NotFoundError } from "@/errors/app-error";
import { authenticate, getUser } from "@/plugins/auth";
import { ok, successSchema } from "@/utils/response";

const notificationSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  referenceType: z.string().nullable(),
  referenceId: z.string().uuid().nullable(),
  isRead: z.boolean(),
  createdAt: z.coerce.date(),
});

export const notificationRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("preHandler", authenticate);

  app.get(
    "/",
    {
      schema: {
        tags: ["Notifications"],
        summary: "List notifications",
        querystring: z.object({
          unreadOnly: z.coerce.boolean().optional(),
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(50).default(20),
        }),
        response: {
          200: z.object({
            success: z.literal(true),
            data: z.array(notificationSchema),
            meta: z.object({
              page: z.number().int(),
              limit: z.number().int(),
              total: z.number().int(),
              totalPages: z.number().int(),
              unreadCount: z.number().int(),
            }),
          }),
        },
      },
    },
    async (request) => {
      const db = getDb();
      const userId = getUser(request).profileId;
      const { unreadOnly, page, limit } = request.query;
      const offset = (page - 1) * limit;

      const conditions = [eq(notifications.userId, userId)];
      if (unreadOnly) {
        conditions.push(eq(notifications.isRead, false));
      }

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(and(...conditions));

      const [unreadResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

      const total = countResult?.count ?? 0;
      const unreadCount = unreadResult?.count ?? 0;

      const rows = await db
        .select({
          id: notifications.id,
          type: notifications.type,
          title: notifications.title,
          message: notifications.message,
          referenceType: notifications.referenceType,
          referenceId: notifications.referenceId,
          isRead: notifications.isRead,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(and(...conditions))
        .orderBy(sql`${notifications.createdAt} DESC`)
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
          unreadCount,
        },
      };
    },
  );

  app.patch(
    "/:id/read",
    {
      schema: {
        tags: ["Notifications"],
        summary: "Mark notification as read",
        params: z.object({ id: z.string().uuid() }),
        response: { 200: successSchema(z.object({ read: z.boolean() })) },
      },
    },
    async (request) => {
      const db = getDb();
      const userId = getUser(request).profileId;

      const notification = await db.query.notifications.findFirst({
        where: and(eq(notifications.id, request.params.id), eq(notifications.userId, userId)),
        columns: { id: true },
      });
      if (!notification) throw new NotFoundError("Notification not found.");

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, notification.id));

      return ok({ read: true });
    },
  );

  app.post(
    "/read-all",
    {
      schema: {
        tags: ["Notifications"],
        summary: "Mark all notifications as read",
        response: {
          200: successSchema(z.object({ updatedCount: z.number().int() })),
        },
      },
    },
    async (request) => {
      const db = getDb();
      const userId = getUser(request).profileId;

      const result = await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
        .returning({ id: notifications.id });

      return ok({ updatedCount: result.length });
    },
  );
};
