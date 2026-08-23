import { and, eq } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { getSupabaseAdmin } from "@/config/supabase";
import { getDb } from "@/db";
import { profiles, storeMembers } from "@/db/schema";
import { ForbiddenError, UnauthorizedError } from "@/errors/app-error";

export interface RequestUser {
  authUserId: string;
  profileId: string;
  role: "CUSTOMER" | "STORE_OWNER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "DISABLED";
  fullName: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user: RequestUser | null;
  }
}

type UserRole = RequestUser["role"];

async function resolveUser(token: string): Promise<RequestUser> {
  const supabase = getSupabaseAdmin();

  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !authUser) {
    throw new UnauthorizedError("Invalid or expired access token.");
  }

  const db = getDb();

  let profile = await db.query.profiles.findFirst({
    where: eq(profiles.authUserId, authUser.id),
  });

  if (!profile) {
    const meta = authUser.user_metadata ?? {};
    const fullName =
      (meta.full_name as string) ||
      (meta.name as string) ||
      authUser.email?.split("@")[0] ||
      "User";

    const rows = await db
      .insert(profiles)
      .values({ authUserId: authUser.id, fullName, phone: (meta.phone as string) || null })
      .returning();

    profile = rows[0] as NonNullable<(typeof rows)[number]>;
  }

  if (profile.status !== "ACTIVE") {
    throw new ForbiddenError("Your account has been suspended or disabled.");
  }

  return {
    authUserId: profile.authUserId,
    profileId: profile.id,
    role: profile.role as UserRole,
    status: profile.status as RequestUser["status"],
    fullName: profile.fullName,
  };
}

function extractToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

async function authPlugin(app: FastifyInstance): Promise<void> {
  app.decorateRequest("user", null);
}

export default fp(authPlugin, { name: "fastshopbd-auth" });

export function getUser(request: FastifyRequest): RequestUser {
  if (!request.user) throw new UnauthorizedError();
  return request.user;
}

export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const token = extractToken(request);
  if (!token) throw new UnauthorizedError("Missing Authorization header.");
  request.user = await resolveUser(token);
}

export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const token = extractToken(request);
  if (!token) return;
  try {
    request.user = await resolveUser(token);
  } catch {
    // Silently skip — the route works without auth.
  }
}

export function requireRole(...allowed: UserRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.user) throw new UnauthorizedError();
    if (!allowed.includes(request.user.role)) {
      throw new ForbiddenError("You do not have the required role for this action.");
    }
  };
}

export async function requireStoreAccess(
  request: FastifyRequest<{ Params: { storeId: string } }>,
  _reply: FastifyReply,
): Promise<void> {
  const user = request.user;
  if (!user) throw new UnauthorizedError();

  if (user.role === "ADMIN") return;

  const db = getDb();
  const membership = await db.query.storeMembers.findFirst({
    where: and(
      eq(storeMembers.userId, user.profileId),
      eq(storeMembers.storeId, request.params.storeId),
    ),
  });

  if (!membership) {
    throw new ForbiddenError("You do not have access to this store.");
  }
}
