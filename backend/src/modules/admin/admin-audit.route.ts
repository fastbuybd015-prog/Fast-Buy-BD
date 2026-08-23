import { and, eq, gte, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import { auditLogs, profiles } from "@/db/schema";
import { authenticate, requireRole } from "@/plugins/auth";

const auditLogSchema = z.object({
  id: z.string().uuid(),
  actorId: z.string().uuid().nullable(),
  actorName: z.string().nullable(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().uuid().nullable(),
  previousData: z.unknown().nullable(),
  newData: z.unknown().nullable(),
  ipAddress: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const adminAuditRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requireRole("ADMIN"));

  app.get(
    "/",
    {
      schema: {
        tags: ["Admin - Audit"],
        summary: "List audit logs",
        querystring: z.object({
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(100).default(25),
          action: z.string().optional(),
          entityType: z.string().optional(),
          entityId: z.string().uuid().optional(),
          actorId: z.string().uuid().optional(),
          from: z.coerce.date().optional(),
        }),
        response: {
          200: z.object({
            success: z.literal(true),
            data: z.array(auditLogSchema),
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
      const { page, limit, action, entityType, entityId, actorId, from } = request.query;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (action) conditions.push(eq(auditLogs.action, action));
      if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
      if (entityId) conditions.push(eq(auditLogs.entityId, entityId));
      if (actorId) conditions.push(eq(auditLogs.actorId, actorId));
      if (from) conditions.push(gte(auditLogs.createdAt, from));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLogs)
        .where(whereClause);

      const total = countResult?.count ?? 0;

      const rows = await db
        .select({
          id: auditLogs.id,
          actorId: auditLogs.actorId,
          actorName: profiles.fullName,
          action: auditLogs.action,
          entityType: auditLogs.entityType,
          entityId: auditLogs.entityId,
          previousData: auditLogs.previousData,
          newData: auditLogs.newData,
          ipAddress: auditLogs.ipAddress,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .leftJoin(profiles, eq(profiles.id, auditLogs.actorId))
        .where(whereClause)
        .orderBy(sql`${auditLogs.createdAt} DESC`)
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
    "/actions",
    {
      schema: {
        tags: ["Admin - Audit"],
        summary: "List distinct audit log actions",
        response: {
          200: z.object({
            success: z.literal(true),
            data: z.array(z.string()),
          }),
        },
      },
    },
    async () => {
      const db = getDb();

      const rows = await db
        .select({
          action: auditLogs.action,
        })
        .from(auditLogs)
        .groupBy(auditLogs.action)
        .orderBy(auditLogs.action);

      return {
        success: true as const,
        data: rows.map((r) => r.action),
      };
    },
  );
};
