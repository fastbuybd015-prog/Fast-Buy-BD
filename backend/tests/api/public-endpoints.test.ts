import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { FastifyInstance } from "fastify";
import { buildApp } from "@/app";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("GET /api/v1/categories", () => {
  test("returns success envelope with array", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/categories" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("each category has required fields", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/categories" });
    const body = res.json();
    if (body.data.length > 0) {
      const cat = body.data[0];
      expect(cat).toHaveProperty("id");
      expect(cat).toHaveProperty("name");
      expect(cat).toHaveProperty("slug");
      expect(cat).toHaveProperty("isActive");
    }
  });
});

describe("GET /api/v1/categories/:slug", () => {
  test("returns 404 for nonexistent slug", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/categories/does-not-exist-xyz",
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().success).toBe(false);
  });
});

describe("GET /api/v1/products", () => {
  test("returns paginated envelope", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/products?page=1&limit=5",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toHaveProperty("page");
    expect(body.meta).toHaveProperty("limit");
    expect(body.meta).toHaveProperty("total");
    expect(body.meta).toHaveProperty("totalPages");
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(5);
  });

  test("returns valid product items", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/products?limit=2",
    });
    const body = res.json();
    if (body.data.length > 0) {
      const p = body.data[0];
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("name");
      expect(p).toHaveProperty("slug");
      expect(p).toHaveProperty("unit");
      expect(p).toHaveProperty("ratingAverage");
    }
  });

  test("respects search query", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/products?q=nonexistent_product_xyz_12345",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBe(0);
    expect(body.meta.total).toBe(0);
  });

  test("rejects invalid page parameter", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/products?page=0",
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });
});

describe("GET /api/v1/products/:slug", () => {
  test("returns 404 for nonexistent slug", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/products/does-not-exist-xyz",
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().success).toBe(false);
  });
});

describe("GET /api/v1/stores", () => {
  test("returns active stores array", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/stores",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("store items have required fields", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/stores" });
    const body = res.json();
    if (body.data.length > 0) {
      const store = body.data[0];
      expect(store).toHaveProperty("id");
      expect(store).toHaveProperty("name");
      expect(store).toHaveProperty("slug");
    }
  });
});

describe("GET /api/v1/stores/:slug", () => {
  test("returns 404 for nonexistent store", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/stores/does-not-exist-xyz",
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().success).toBe(false);
  });
});

describe("GET /api/v1/recommendations", () => {
  test("returns sections array for anonymous user", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/recommendations",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("sections");
    expect(Array.isArray(body.data.sections)).toBe(true);
  });

  test("sections have title and items", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/recommendations",
    });
    const body = res.json();
    for (const section of body.data.sections) {
      expect(section).toHaveProperty("title");
      expect(Array.isArray(section.items)).toBe(true);
    }
  });
});

describe("GET /api/v1/expiry-deals", () => {
  test("returns deals array", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/expiry-deals",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("deals");
    expect(body.data).toHaveProperty("total");
    expect(Array.isArray(body.data.deals)).toBe(true);
  });
});

describe("auth-protected endpoints reject anonymous requests", () => {
  const protectedPaths = [
    { method: "GET" as const, url: "/api/v1/cart" },
    { method: "GET" as const, url: "/api/v1/favorites" },
    { method: "GET" as const, url: "/api/v1/orders" },
    { method: "GET" as const, url: "/api/v1/notifications" },
    { method: "GET" as const, url: "/api/v1/admin/audit-logs" },
  ];

  for (const { method, url } of protectedPaths) {
    test(`${method} ${url} returns 401`, async () => {
      const res = await app.inject({ method, url });
      expect(res.statusCode).toBe(401);
      expect(res.json().success).toBe(false);
      expect(res.json().error.code).toBe("UNAUTHORIZED");
    });
  }
});
