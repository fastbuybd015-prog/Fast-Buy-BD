/**
 * Application-wide constants.
 *
 * Only put values here that are genuinely fixed for the codebase.
 * Business configuration that an admin should be able to change at runtime
 * (delivery fee, free-delivery threshold, payment receiver numbers, trial
 * duration, subscription price, ...) belongs in the `system_settings` table,
 * NOT here. See Master Project Context §55.
 */

export const APP_NAME = "FastShopBD";

/** All application routes are mounted under this prefix. */
export const API_PREFIX = "/api/v1";

/** Swagger UI location. */
export const DOCS_ROUTE = "/docs";

export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  /** Hard ceiling so a client cannot request the entire table. */
  maxLimit: 100,
} as const;

/** How long a health check waits on a dependency before calling it unhealthy. */
export const HEALTH_CHECK_TIMEOUT_MS = 2_000;
