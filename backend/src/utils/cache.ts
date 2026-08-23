import { getRedis } from "@/config/redis";

const NAMESPACE = "fastshopbd";

function cacheKey(...parts: string[]): string {
  return `${NAMESPACE}:${parts.join(":")}`;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const value = await redis.get(cacheKey(key));
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(cacheKey(key), JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Redis failure — silently skip caching
  }
}

export async function invalidateCache(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.del(cacheKey(key));
  } catch {
    // Redis failure — silently skip
  }
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    const keys = await redis.keys(cacheKey(pattern));
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Redis failure — silently skip
  }
}

export const CACHE_KEYS = {
  recommendations: (userId: string) => `recommendations:user:${userId}`,
  coldStartRecommendations: "recommendations:cold-start",
  adminAnalytics: (range: string) => `analytics:admin:${range}`,
  storeAnalytics: (storeId: string, range: string) => `analytics:store:${storeId}:${range}`,
  popularProducts: "products:popular:v1",
  categories: "categories:tree",
  brands: "brands:all",
  publicSettings: "settings:public",
  productSearch: (hash: string) => `products:search:${hash}`,
  storeDetail: (slug: string) => `store:detail:${slug}`,
  bestValue: (limit: number) => `recommendations:best-value:${limit}`,
  expiryDeals: (days: number, limit: number) => `expiry-deals:${days}:${limit}`,
} as const;

export const CACHE_TTL = {
  recommendations: 300,
  coldStart: 600,
  analytics: 120,
  popularProducts: 600,
  categories: 900,
  brands: 900,
  publicSettings: 1800,
  productSearch: 180,
  storeDetail: 300,
  expiryDeals: 300,
} as const;
