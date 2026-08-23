/**
 * Application error codes returned to clients.
 *
 * These are part of the public API contract — the frontend maps them to
 * user-facing messages. Add new codes here rather than inventing ad-hoc
 * strings inside services. See Backend Master Context §15.
 */
export const ERROR_CODES = {
  // --- Generic -------------------------------------------------------------
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",

  // --- Catalog / inventory -------------------------------------------------
  PRODUCT_UNAVAILABLE: "PRODUCT_UNAVAILABLE",
  STORE_UNAVAILABLE: "STORE_UNAVAILABLE",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",

  // --- Cart / checkout -----------------------------------------------------
  CART_EMPTY: "CART_EMPTY",
  PRICE_CHANGED: "PRICE_CHANGED",
  INVALID_COUPON: "INVALID_COUPON",

  // --- Orders --------------------------------------------------------------
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
  ORDER_NOT_CANCELLABLE: "ORDER_NOT_CANCELLABLE",

  // --- Payments ------------------------------------------------------------
  PAYMENT_ALREADY_SUBMITTED: "PAYMENT_ALREADY_SUBMITTED",
  PAYMENT_ALREADY_VERIFIED: "PAYMENT_ALREADY_VERIFIED",
  DUPLICATE_TRANSACTION_ID: "DUPLICATE_TRANSACTION_ID",

  // --- Multi-tenant access -------------------------------------------------
  STORE_ACCESS_DENIED: "STORE_ACCESS_DENIED",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
