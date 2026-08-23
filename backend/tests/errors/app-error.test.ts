import { describe, expect, test } from "bun:test";
import {
  AppError,
  ConflictError,
  ForbiddenError,
  isAppError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError,
} from "@/errors/app-error";

describe("AppError subclasses", () => {
  test("ValidationError has correct status and code", () => {
    const err = new ValidationError("Bad input", { field: "email" });
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.message).toBe("Bad input");
    expect(err.details).toEqual({ field: "email" });
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });

  test("UnauthorizedError defaults to 401", () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
  });

  test("ForbiddenError defaults to 403", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });

  test("NotFoundError defaults to 404", () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
  });

  test("ConflictError defaults to 409", () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });

  test("ServiceUnavailableError defaults to 503", () => {
    const err = new ServiceUnavailableError();
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe("SERVICE_UNAVAILABLE");
  });

  test("custom messages override defaults", () => {
    const err = new NotFoundError("Product not found.");
    expect(err.message).toBe("Product not found.");
  });
});

describe("isAppError", () => {
  test("returns true for AppError instances", () => {
    expect(isAppError(new ValidationError())).toBe(true);
    expect(isAppError(new NotFoundError())).toBe(true);
  });

  test("returns false for plain errors", () => {
    expect(isAppError(new Error("oops"))).toBe(false);
    expect(isAppError(new TypeError("bad"))).toBe(false);
  });

  test("returns false for non-errors", () => {
    expect(isAppError("string")).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
    expect(isAppError(42)).toBe(false);
  });
});
