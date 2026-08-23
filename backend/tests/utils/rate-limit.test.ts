import { describe, expect, test } from "bun:test";
import { RATE_LIMITS, rateLimit } from "@/plugins/rate-limit";

describe("RATE_LIMITS", () => {
  test("all expected rate limiters are defined", () => {
    expect(typeof RATE_LIMITS.paymentSubmit).toBe("function");
    expect(typeof RATE_LIMITS.orderCreate).toBe("function");
    expect(typeof RATE_LIMITS.search).toBe("function");
    expect(typeof RATE_LIMITS.recommendations).toBe("function");
    expect(typeof RATE_LIMITS.analytics).toBe("function");
  });

  test("rateLimit helper returns an async preHandler function", () => {
    const limiter = rateLimit({
      keyPrefix: "test",
      windowSeconds: 60,
      maxRequests: 10,
    });
    expect(typeof limiter).toBe("function");
  });

  test("rate limiter gracefully proceeds when Redis is not available", async () => {
    const limiter = rateLimit({
      keyPrefix: "test",
      windowSeconds: 60,
      maxRequests: 5,
    });

    const mockRequest = {
      ip: "127.0.0.1",
    } as never;

    const headers: Record<string, string | number> = {};
    let statusSent: number | null = null;
    let bodySent: unknown = null;

    const mockReply = {
      header: (name: string, value: string | number) => {
        headers[name] = value;
      },
      status: (code: number) => {
        statusSent = code;
        return {
          send: (body: unknown) => {
            bodySent = body;
          },
        };
      },
    } as never;

    // Must not throw when Redis is null / down
    await expect(limiter(mockRequest, mockReply)).resolves.toBeUndefined();
    expect(statusSent).toBeNull();
    expect(bodySent).toBeNull();
  });
});
