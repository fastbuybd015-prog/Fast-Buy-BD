import { z } from "zod";
import type { ErrorCode } from "@/errors/error-codes";

/**
 * The single response envelope used by every FastShopBD endpoint.
 * See Backend Master Context §14.
 *
 *   success: { "success": true,  "data": {...}, "meta"?: {...} }
 *   failure: { "success": false, "error": { "code": "...", "message": "..." } }
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export function ok<T>(data: T): SuccessResponse<T> {
  return { success: true, data };
}

export function paginated<T>(data: T[], meta: PaginationMeta): SuccessResponse<T[]> {
  return { success: true, data, meta };
}

export function buildPaginationMeta(params: {
  page: number;
  limit: number;
  total: number;
}): PaginationMeta {
  return {
    page: params.page,
    limit: params.limit,
    total: params.total,
    totalPages: params.limit > 0 ? Math.ceil(params.total / params.limit) : 0,
  };
}

export function fail(code: ErrorCode, message: string, details?: unknown): ErrorResponse {
  return {
    success: false,
    error: { code, message, ...(details === undefined ? {} : { details }) },
  };
}

// --- OpenAPI schemas --------------------------------------------------------

/** Wraps a payload schema in the success envelope, for Swagger documentation. */
export function successSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  });
}

export const paginationMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

export function paginatedSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    meta: paginationMetaSchema,
  });
}

export const errorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
