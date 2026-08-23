/**
 * Drizzle schema barrel.
 *
 * `drizzle.config.ts` and `src/db/index.ts` both read the database structure
 * from this file, so every table module must be re-exported here.
 *
 * Layers, in dependency order:
 *   identity   profiles, addresses
 *   stores     stores, store_members
 *   catalog    categories, brands, products, product_images
 *   listings   store_products, inventory, inventory_movements
 *   cart       carts, cart_items
 *   orders     orders, store_orders, order_items, order_status_history
 *   payment    payments, coupons, coupon_usage
 *   customer   favorites, reviews, subscription_plans, subscriptions
 *   signals    user_events, search_history
 *   platform   notifications, system_settings, audit_logs
 */

export * from "./addresses";
export * from "./audit-logs";
export * from "./brands";
export * from "./cart-items";
// --- Cart -------------------------------------------------------------------
export * from "./carts";

// --- Catalog ----------------------------------------------------------------
export * from "./categories";
export * from "./coupon-usage";
export * from "./coupons";
// --- Shared -----------------------------------------------------------------
export * from "./enums";
// --- Customer engagement ----------------------------------------------------
export * from "./favorites";
export * from "./inventory";
export * from "./inventory-movements";
// --- Platform ---------------------------------------------------------------
export * from "./notifications";
export * from "./order-items";
export * from "./order-status-history";
// --- Orders -----------------------------------------------------------------
export * from "./orders";
// --- Payment ----------------------------------------------------------------
export * from "./payments";
export * from "./product-images";
export * from "./products";
// --- Identity ---------------------------------------------------------------
export * from "./profiles";
// --- Relations (Drizzle query API) ------------------------------------------
export * from "./relations";
export * from "./reviews";
export * from "./search-history";
export * from "./store-members";
export * from "./store-orders";
// --- Store listings & stock -------------------------------------------------
export * from "./store-products";
// --- Stores -----------------------------------------------------------------
export * from "./stores";
export * from "./subscription-plans";
export * from "./subscriptions";
export * from "./system-settings";
// --- Behavioural signals ----------------------------------------------------
export * from "./user-events";
