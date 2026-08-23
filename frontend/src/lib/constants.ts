/**
 * Shared demo constants.
 *
 * These live outside the context modules on purpose: a `'use client'` module
 * only exposes client references to server components, so a plain value
 * imported from one would arrive as `undefined` during server rendering.
 */

/** Monthly membership price in BDT. */
export const SUBSCRIPTION_PRICE = 50;

/** Free trial length — one day. */
export const TRIAL_DURATION_MS = 24 * 60 * 60 * 1000;

/** Orders below this amount pay a delivery fee. */
export const FREE_DELIVERY_THRESHOLD = 1000;

export const DELIVERY_FEE = 60;
