import { and, eq, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getDb } from "@/db";
import { subscriptionPlans, subscriptions } from "@/db/schema";
import { ConflictError, NotFoundError } from "@/errors/app-error";
import { authenticate, getUser, optionalAuth } from "@/plugins/auth";
import { ok, successSchema } from "@/utils/response";

const planSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  price: z.string(),
  durationDays: z.number().int(),
  trialHours: z.number().int(),
});

const subscriptionSchema = z.object({
  id: z.string().uuid(),
  planId: z.string().uuid(),
  planName: z.string(),
  status: z.string(),
  trialStartedAt: z.coerce.date().nullable(),
  trialExpiresAt: z.coerce.date().nullable(),
  startedAt: z.coerce.date().nullable(),
  expiresAt: z.coerce.date().nullable(),
  isTrialExpired: z.boolean(),
  isExpired: z.boolean(),
});

export const subscriptionRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/plans",
    {
      preHandler: [optionalAuth],
      schema: {
        tags: ["Subscriptions"],
        summary: "List subscription plans",
        response: { 200: successSchema(z.array(planSchema)) },
      },
    },
    async () => {
      const db = getDb();
      const plans = await db.query.subscriptionPlans.findMany({
        where: eq(subscriptionPlans.isActive, true),
        columns: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          durationDays: true,
          trialHours: true,
        },
      });
      return ok(plans);
    },
  );

  app.get(
    "/me",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Subscriptions"],
        summary: "Get current user subscription",
        response: { 200: successSchema(subscriptionSchema.nullable()) },
      },
    },
    async (request) => {
      const db = getDb();
      const userId = getUser(request).profileId;

      const sub = await db
        .select({
          id: subscriptions.id,
          planId: subscriptions.planId,
          planName: subscriptionPlans.name,
          status: subscriptions.status,
          trialStartedAt: subscriptions.trialStartedAt,
          trialExpiresAt: subscriptions.trialExpiresAt,
          startedAt: subscriptions.startedAt,
          expiresAt: subscriptions.expiresAt,
        })
        .from(subscriptions)
        .innerJoin(subscriptionPlans, eq(subscriptionPlans.id, subscriptions.planId))
        .where(
          and(
            eq(subscriptions.userId, userId),
            sql`${subscriptions.status} IN ('TRIAL', 'ACTIVE')`,
          ),
        )
        .limit(1);

      const s = sub[0];
      if (!s) {
        return ok(null);
      }

      const now = new Date();
      return ok({
        id: s.id,
        planId: s.planId,
        planName: s.planName,
        status: s.status,
        trialStartedAt: s.trialStartedAt,
        trialExpiresAt: s.trialExpiresAt,
        startedAt: s.startedAt,
        expiresAt: s.expiresAt,
        isTrialExpired: s.trialExpiresAt ? now > s.trialExpiresAt : false,
        isExpired: s.expiresAt ? now > s.expiresAt : false,
      });
    },
  );

  app.post(
    "/start-trial",
    {
      preHandler: [authenticate],
      schema: {
        tags: ["Subscriptions"],
        summary: "Start free trial",
        body: z.object({
          planId: z.string().uuid(),
        }),
        response: { 201: successSchema(subscriptionSchema) },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const userId = getUser(request).profileId;

      const existingSub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, userId),
        columns: { id: true, status: true },
      });
      if (existingSub) {
        throw new ConflictError("You already have or had a subscription. Trial is one-time only.");
      }

      const plan = await db.query.subscriptionPlans.findFirst({
        where: and(
          eq(subscriptionPlans.id, request.body.planId),
          eq(subscriptionPlans.isActive, true),
        ),
        columns: { id: true, name: true, trialHours: true },
      });
      if (!plan) throw new NotFoundError("Plan not found.");

      const now = new Date();
      const trialExpiresAt = new Date(now.getTime() + plan.trialHours * 60 * 60 * 1000);

      const [created] = await db
        .insert(subscriptions)
        .values({
          userId,
          planId: plan.id,
          status: "TRIAL",
          trialStartedAt: now,
          trialExpiresAt,
        })
        .returning();

      const sub = created as NonNullable<typeof created>;

      return reply.status(201).send(
        ok({
          id: sub.id,
          planId: sub.planId,
          planName: plan.name,
          status: sub.status,
          trialStartedAt: sub.trialStartedAt,
          trialExpiresAt: sub.trialExpiresAt,
          startedAt: sub.startedAt,
          expiresAt: sub.expiresAt,
          isTrialExpired: false,
          isExpired: false,
        }),
      );
    },
  );
};
