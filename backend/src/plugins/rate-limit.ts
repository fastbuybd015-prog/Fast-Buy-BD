import type { FastifyReply, FastifyRequest } from "fastify";
import { getRedis } from "@/config/redis";

const NAMESPACE = "fastshopbd:ratelimit";

interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix: string;
}

function getRateLimitKey(prefix: string, identifier: string): string {
  return `${NAMESPACE}:${prefix}:${identifier}`;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowSeconds, maxRequests, keyPrefix } = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const redis = getRedis();
    if (!redis) return;

    const identifier =
      ((request as unknown as Record<string, unknown>).userId as string | undefined) ?? request.ip;
    const key = getRateLimitKey(keyPrefix, identifier);

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      reply.header("X-RateLimit-Limit", maxRequests);
      reply.header("X-RateLimit-Remaining", Math.max(0, maxRequests - current));

      if (current > maxRequests) {
        const ttl = await redis.ttl(key);
        reply.header("Retry-After", ttl > 0 ? ttl : windowSeconds);
        reply.status(429).send({
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please try again later.",
          },
        });
      }
    } catch {
      // Redis failure — allow the request through
    }
  };
}

export const RATE_LIMITS = {
  paymentSubmit: rateLimit({
    keyPrefix: "payment",
    windowSeconds: 60,
    maxRequests: 5,
  }),
  orderCreate: rateLimit({
    keyPrefix: "orders",
    windowSeconds: 60,
    maxRequests: 10,
  }),
  search: rateLimit({
    keyPrefix: "search",
    windowSeconds: 60,
    maxRequests: 30,
  }),
  recommendations: rateLimit({
    keyPrefix: "recommendations",
    windowSeconds: 60,
    maxRequests: 20,
  }),
  analytics: rateLimit({
    keyPrefix: "analytics",
    windowSeconds: 60,
    maxRequests: 10,
  }),
} as const;
