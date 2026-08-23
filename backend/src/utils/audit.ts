import type { FastifyRequest } from "fastify";
import { getDb } from "@/db";
import { auditLogs } from "@/db/schema";

interface AuditEntry {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  previousData?: unknown;
  newData?: unknown;
  request?: FastifyRequest;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  const db = getDb();

  await db.insert(auditLogs).values({
    actorId: entry.actorId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    previousData: entry.previousData ?? null,
    newData: entry.newData ?? null,
    ipAddress: entry.request?.ip ?? null,
  });
}
