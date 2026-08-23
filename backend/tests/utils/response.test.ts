import { describe, expect, test } from "bun:test";
import { buildPaginationMeta, fail, ok, paginated } from "@/utils/response";

describe("ok", () => {
  test("wraps data in success envelope", () => {
    const result = ok({ name: "test" });
    expect(result).toEqual({ success: true, data: { name: "test" } });
  });

  test("works with arrays", () => {
    const result = ok([1, 2, 3]);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([1, 2, 3]);
  });

  test("works with null", () => {
    const result = ok(null);
    expect(result).toEqual({ success: true, data: null });
  });
});

describe("paginated", () => {
  test("wraps data with pagination meta", () => {
    const meta = { page: 1, limit: 10, total: 25, totalPages: 3 };
    const result = paginated([{ id: "1" }], meta);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([{ id: "1" }]);
    expect(result.meta).toEqual(meta);
  });
});

describe("fail", () => {
  test("wraps error in failure envelope", () => {
    const result = fail("NOT_FOUND", "Not found");
    expect(result).toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: "Not found" },
    });
  });

  test("includes details when provided", () => {
    const result = fail("VALIDATION_ERROR", "Invalid", { field: "email" });
    expect(result.error.details).toEqual({ field: "email" });
  });

  test("omits details when undefined", () => {
    const result = fail("UNAUTHORIZED", "No token");
    expect(result.error).not.toHaveProperty("details");
  });
});

describe("buildPaginationMeta", () => {
  test("calculates totalPages correctly", () => {
    const meta = buildPaginationMeta({ page: 1, limit: 10, total: 25 });
    expect(meta).toEqual({ page: 1, limit: 10, total: 25, totalPages: 3 });
  });

  test("handles exact division", () => {
    const meta = buildPaginationMeta({ page: 1, limit: 10, total: 20 });
    expect(meta.totalPages).toBe(2);
  });

  test("handles zero total", () => {
    const meta = buildPaginationMeta({ page: 1, limit: 10, total: 0 });
    expect(meta.totalPages).toBe(0);
  });

  test("handles limit of zero gracefully", () => {
    const meta = buildPaginationMeta({ page: 1, limit: 0, total: 10 });
    expect(meta.totalPages).toBe(0);
  });

  test("handles single item", () => {
    const meta = buildPaginationMeta({ page: 1, limit: 20, total: 1 });
    expect(meta.totalPages).toBe(1);
  });
});
