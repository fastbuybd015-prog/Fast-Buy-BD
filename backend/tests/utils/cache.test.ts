import { describe, expect, test } from "bun:test";
import { CACHE_KEYS, CACHE_TTL } from "@/utils/cache";

describe("CACHE_KEYS", () => {
  test("recommendations key includes user id", () => {
    const key = CACHE_KEYS.recommendations("user-123");
    expect(key).toBe("recommendations:user:user-123");
  });

  test("adminAnalytics key includes range", () => {
    expect(CACHE_KEYS.adminAnalytics("7d")).toBe("analytics:admin:7d");
  });

  test("storeAnalytics key includes store and range", () => {
    expect(CACHE_KEYS.storeAnalytics("store-1", "30d")).toBe("analytics:store:store-1:30d");
  });

  test("storeDetail key includes slug", () => {
    expect(CACHE_KEYS.storeDetail("my-store")).toBe("store:detail:my-store");
  });

  test("expiryDeals key includes days and limit", () => {
    expect(CACHE_KEYS.expiryDeals(7, 20)).toBe("expiry-deals:7:20");
  });

  test("productSearch key includes hash", () => {
    expect(CACHE_KEYS.productSearch("abc123")).toBe("products:search:abc123");
  });

  test("bestValue key includes limit", () => {
    expect(CACHE_KEYS.bestValue(10)).toBe("recommendations:best-value:10");
  });

  test("static keys are strings", () => {
    expect(CACHE_KEYS.categories).toBe("categories:tree");
    expect(CACHE_KEYS.brands).toBe("brands:all");
    expect(CACHE_KEYS.publicSettings).toBe("settings:public");
    expect(CACHE_KEYS.coldStartRecommendations).toBe("recommendations:cold-start");
    expect(CACHE_KEYS.popularProducts).toBe("products:popular:v1");
  });
});

describe("CACHE_TTL", () => {
  test("all TTLs are positive integers", () => {
    for (const [, value] of Object.entries(CACHE_TTL)) {
      expect(value).toBeGreaterThan(0);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  test("recommendations TTL is 5 minutes", () => {
    expect(CACHE_TTL.recommendations).toBe(300);
  });

  test("coldStart TTL is longer than personalized", () => {
    expect(CACHE_TTL.coldStart).toBeGreaterThan(CACHE_TTL.recommendations);
  });

  test("categories and brands TTL is 15 minutes", () => {
    expect(CACHE_TTL.categories).toBe(900);
    expect(CACHE_TTL.brands).toBe(900);
  });

  test("publicSettings TTL is 30 minutes", () => {
    expect(CACHE_TTL.publicSettings).toBe(1800);
  });
});
