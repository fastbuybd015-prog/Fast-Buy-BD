import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Postgres enum types.
 *
 * Declared as real database enums rather than free text so invalid states are
 * impossible at the storage layer, not merely discouraged in application code.
 */

// --- Identity ---------------------------------------------------------------

export const userRoleEnum = pgEnum("user_role", ["CUSTOMER", "STORE_OWNER", "ADMIN"]);

export const userStatusEnum = pgEnum("user_status", ["ACTIVE", "SUSPENDED", "DISABLED"]);

// --- Stores -----------------------------------------------------------------

export const storeStatusEnum = pgEnum("store_status", ["ACTIVE", "INACTIVE", "SUSPENDED"]);

/** V1 only uses OWNER, but the model allows a store to grow a team. */
export const storeMemberRoleEnum = pgEnum("store_member_role", ["OWNER", "MANAGER", "STAFF"]);

// --- Inventory --------------------------------------------------------------

export const inventoryMovementTypeEnum = pgEnum("inventory_movement_type", [
  "STOCK_IN",
  "STOCK_OUT",
  "ORDER_RESERVED",
  "ORDER_RELEASED",
  "ORDER_SOLD",
  "MANUAL_ADJUSTMENT",
  "RETURN",
]);

// --- Cart -------------------------------------------------------------------

export const cartStatusEnum = pgEnum("cart_status", ["ACTIVE", "CONVERTED", "ABANDONED"]);

// --- Orders -----------------------------------------------------------------

/**
 * Fulfilment status. Deliberately separate from payment status — an order can
 * be paid but unshipped, or shipped as cash-on-delivery but unpaid.
 */
export const orderStatusEnum = pgEnum("order_status", [
  "PENDING_PAYMENT",
  "PAYMENT_SUBMITTED",
  "PAYMENT_VERIFIED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "SUBMITTED",
  "VERIFIED",
  "REJECTED",
  "REFUNDED",
]);

/** Manual mobile financial services plus cash on delivery. */
export const paymentMethodEnum = pgEnum("payment_method", ["BKASH", "NAGAD", "ROCKET", "COD"]);

// --- Commerce extras --------------------------------------------------------

export const couponTypeEnum = pgEnum("coupon_type", ["PERCENTAGE", "FIXED"]);

export const reviewStatusEnum = pgEnum("review_status", ["PENDING", "APPROVED", "HIDDEN"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "TRIAL",
  "ACTIVE",
  "EXPIRED",
  "CANCELLED",
]);

// --- Behaviour & platform ---------------------------------------------------

/**
 * PURCHASE is written by the order service from committed order data — a
 * client-sent PURCHASE event is never trusted (Backend Master Context §107).
 */
export const userEventTypeEnum = pgEnum("user_event_type", [
  "PRODUCT_VIEW",
  "PRODUCT_CLICK",
  "SEARCH",
  "ADD_TO_CART",
  "REMOVE_FROM_CART",
  "FAVORITE",
  "RECOMMENDATION_CLICK",
  "PURCHASE",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "PAYMENT_VERIFIED",
  "PAYMENT_REJECTED",
  "ORDER_PROCESSING",
  "ORDER_PACKED",
  "ORDER_SHIPPED",
  "ORDER_OUT_FOR_DELIVERY",
  "ORDER_DELIVERED",
  "ORDER_CANCELLED",
  "NEW_STORE_ORDER",
  "LOW_STOCK",
]);

export const settingValueTypeEnum = pgEnum("setting_value_type", [
  "STRING",
  "NUMBER",
  "BOOLEAN",
  "JSON",
]);
