import { and, asc, eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import { addresses } from "@/db/schema";
import { ForbiddenError, NotFoundError } from "@/errors/app-error";
import { authenticate, getUser } from "@/plugins/auth";
import { ok, successSchema } from "@/utils/response";

const addressSchema = z.object({
  id: z.string().uuid(),
  label: z.string().nullable(),
  recipientName: z.string(),
  phone: z.string(),
  addressLine: z.string(),
  city: z.string(),
  area: z.string().nullable(),
  postalCode: z.string().nullable(),
  isDefault: z.boolean(),
});

const createAddressSchema = z.object({
  label: z.string().max(50).optional(),
  recipientName: z.string().min(1).max(200),
  phone: z.string().min(5).max(20),
  addressLine: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  area: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  isDefault: z.boolean().default(false),
});

const updateAddressSchema = createAddressSchema.partial();

export const addressRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook("preHandler", authenticate);

  app.get(
    "/",
    {
      schema: {
        tags: ["Addresses"],
        summary: "List user addresses",
        response: { 200: successSchema(z.array(addressSchema)) },
      },
    },
    async (request) => {
      const db = getDb();
      const rows = await db.query.addresses.findMany({
        where: eq(addresses.userId, getUser(request).profileId),
        orderBy: [asc(addresses.createdAt)],
        columns: {
          id: true,
          label: true,
          recipientName: true,
          phone: true,
          addressLine: true,
          city: true,
          area: true,
          postalCode: true,
          isDefault: true,
        },
      });
      return ok(rows);
    },
  );

  app.post(
    "/",
    {
      schema: {
        tags: ["Addresses"],
        summary: "Create address",
        body: createAddressSchema,
        response: { 201: successSchema(addressSchema) },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const userId = getUser(request).profileId;

      if (request.body.isDefault) {
        await db
          .update(addresses)
          .set({ isDefault: false })
          .where(and(eq(addresses.userId, userId), eq(addresses.isDefault, true)));
      }

      const [created] = await db
        .insert(addresses)
        .values({ ...request.body, userId })
        .returning({
          id: addresses.id,
          label: addresses.label,
          recipientName: addresses.recipientName,
          phone: addresses.phone,
          addressLine: addresses.addressLine,
          city: addresses.city,
          area: addresses.area,
          postalCode: addresses.postalCode,
          isDefault: addresses.isDefault,
        });

      return reply.status(201).send(ok(created as NonNullable<typeof created>));
    },
  );

  app.patch(
    "/:id",
    {
      schema: {
        tags: ["Addresses"],
        summary: "Update address",
        params: z.object({ id: z.string().uuid() }),
        body: updateAddressSchema,
        response: { 200: successSchema(addressSchema) },
      },
    },
    async (request) => {
      const db = getDb();
      const userId = getUser(request).profileId;

      const existing = await db.query.addresses.findFirst({
        where: eq(addresses.id, request.params.id),
        columns: { userId: true },
      });
      if (!existing) throw new NotFoundError("Address not found.");
      if (existing.userId !== userId) throw new ForbiddenError();

      if (request.body.isDefault) {
        await db
          .update(addresses)
          .set({ isDefault: false })
          .where(and(eq(addresses.userId, userId), eq(addresses.isDefault, true)));
      }

      const [updated] = await db
        .update(addresses)
        .set({ ...request.body, updatedAt: new Date() })
        .where(eq(addresses.id, request.params.id))
        .returning({
          id: addresses.id,
          label: addresses.label,
          recipientName: addresses.recipientName,
          phone: addresses.phone,
          addressLine: addresses.addressLine,
          city: addresses.city,
          area: addresses.area,
          postalCode: addresses.postalCode,
          isDefault: addresses.isDefault,
        });

      if (!updated) throw new NotFoundError("Address not found.");
      return ok(updated);
    },
  );

  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Addresses"],
        summary: "Delete address",
        params: z.object({ id: z.string().uuid() }),
        response: { 200: successSchema(z.object({ deleted: z.boolean() })) },
      },
    },
    async (request) => {
      const db = getDb();
      const userId = getUser(request).profileId;

      const existing = await db.query.addresses.findFirst({
        where: eq(addresses.id, request.params.id),
        columns: { userId: true },
      });
      if (!existing) throw new NotFoundError("Address not found.");
      if (existing.userId !== userId) throw new ForbiddenError();

      await db.delete(addresses).where(eq(addresses.id, request.params.id));
      return ok({ deleted: true });
    },
  );

  app.patch(
    "/:id/default",
    {
      schema: {
        tags: ["Addresses"],
        summary: "Set address as default",
        params: z.object({ id: z.string().uuid() }),
        response: { 200: successSchema(addressSchema) },
      },
    },
    async (request) => {
      const db = getDb();
      const userId = getUser(request).profileId;

      const existing = await db.query.addresses.findFirst({
        where: eq(addresses.id, request.params.id),
        columns: { userId: true },
      });
      if (!existing) throw new NotFoundError("Address not found.");
      if (existing.userId !== userId) throw new ForbiddenError();

      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(and(eq(addresses.userId, userId), eq(addresses.isDefault, true)));

      const [updated] = await db
        .update(addresses)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(addresses.id, request.params.id))
        .returning({
          id: addresses.id,
          label: addresses.label,
          recipientName: addresses.recipientName,
          phone: addresses.phone,
          addressLine: addresses.addressLine,
          city: addresses.city,
          area: addresses.area,
          postalCode: addresses.postalCode,
          isDefault: addresses.isDefault,
        });

      if (!updated) throw new NotFoundError("Address not found.");
      return ok(updated);
    },
  );
};
