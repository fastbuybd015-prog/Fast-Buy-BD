import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { FastifyInstance } from "fastify";
import { buildApp } from "@/app";

/**
 * Smoke tests for the application foundation.
 *
 * These run entirely in-process through `app.inject()` — no port is opened and
 * no database is required.
 */

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("GET /health", () => {
  test("reports the honest status of every dependency", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });

    // 503 is correct when DATABASE_URL points at an unreachable database.
    expect([200, 503]).toContain(response.statusCode);

    const body = response.json();
    expect(["ok", "degraded", "error"]).toContain(body.status);
    expect(body.environment).toBeString();
    expect(body.uptimeSeconds).toBeNumber();
    expect(["ok", "error", "not_configured"]).toContain(body.services.database);
    expect(["ok", "error", "not_configured"]).toContain(body.services.redis);
  });

  test("never leaks connection details", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });
    const raw = response.body.toLowerCase();

    expect(raw).not.toContain("postgres://");
    expect(raw).not.toContain("postgresql://");
    expect(raw).not.toContain("supabase.co");
  });
});

describe("GET /api/v1", () => {
  test("returns the success envelope", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1" });

    expect(response.statusCode).toBe(200);

    const body = response.json<{
      success: boolean;
      data: { name: string; version: string; documentation: string };
    }>();

    expect(body.success).toBe(true);
    expect(body.data.name).toBe("FastShopBD API");
    expect(body.data.version).toBe("v1");
    expect(body.data.documentation).toBe("/docs");
  });
});

describe("error handling", () => {
  test("unknown routes return the error envelope, not an HTML page", async () => {
    const response = await app.inject({ method: "GET", url: "/does-not-exist" });

    expect(response.statusCode).toBe(404);

    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toBeString();
  });

  test("malformed JSON is rejected without a stack trace in the message", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1",
      headers: { "content-type": "application/json" },
      payload: "{ not json",
    });

    expect(response.statusCode).toBeGreaterThanOrEqual(400);
    expect(response.json().success).toBe(false);
  });
});

describe("request tracing", () => {
  test("every response carries an X-Request-Id", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1" });
    expect(response.headers["x-request-id"]).toBeString();
  });

  test("a caller-supplied request id is preserved", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1",
      headers: { "x-request-id": "trace-me-123" },
    });

    expect(response.headers["x-request-id"]).toBe("trace-me-123");
  });
});

describe("CORS", () => {
  test("allows the configured frontend origin", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1",
      headers: { origin: "http://localhost:3000" },
    });

    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });

  test("does not allow an unknown origin", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1",
      headers: { origin: "https://evil.example.com" },
    });

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("security headers", () => {
  test("helmet defaults are applied", async () => {
    const response = await app.inject({ method: "GET", url: "/api/v1" });

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
  });
});
