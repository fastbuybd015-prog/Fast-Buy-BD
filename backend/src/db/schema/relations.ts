import { relations } from "drizzle-orm";

import { addresses } from "./addresses";
import { auditLogs } from "./audit-logs";
import { brands } from "./brands";
import { cartItems } from "./cart-items";
import { carts } from "./carts";
import { categories } from "./categories";
import { couponUsage } from "./coupon-usage";
import { coupons } from "./coupons";
import { favorites } from "./favorites";
import { inventory } from "./inventory";
import { inventoryMovements } from "./inventory-movements";
import { notifications } from "./notifications";
import { orderItems } from "./order-items";
import { orderStatusHistory } from "./order-status-history";
import { orders } from "./orders";
import { payments } from "./payments";
import { productImages } from "./product-images";
import { products } from "./products";
import { profiles } from "./profiles";
import { reviews } from "./reviews";
import { searchHistory } from "./search-history";
import { storeMembers } from "./store-members";
import { storeOrders } from "./store-orders";
import { storeProducts } from "./store-products";
import { stores } from "./stores";
import { subscriptionPlans } from "./subscription-plans";
import { subscriptions } from "./subscriptions";
import { userEvents } from "./user-events";

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export const profilesRelations = relations(profiles, ({ many }) => ({
  addresses: many(addresses),
  storeMembers: many(storeMembers),
  carts: many(carts),
  orders: many(orders),
  payments: many(payments, { relationName: "paymentUser" }),
  verifiedPayments: many(payments, { relationName: "paymentVerifier" }),
  favorites: many(favorites),
  reviews: many(reviews),
  subscriptions: many(subscriptions),
  couponUsage: many(couponUsage),
  userEvents: many(userEvents),
  searchHistory: many(searchHistory),
  notifications: many(notifications),
}));

export const addressesRelations = relations(addresses, ({ one, many }) => ({
  user: one(profiles, { fields: [addresses.userId], references: [profiles.id] }),
  orders: many(orders),
}));

// ---------------------------------------------------------------------------
// Stores
// ---------------------------------------------------------------------------

export const storesRelations = relations(stores, ({ many }) => ({
  members: many(storeMembers),
  storeProducts: many(storeProducts),
  storeOrders: many(storeOrders),
}));

export const storeMembersRelations = relations(storeMembers, ({ one }) => ({
  store: one(stores, { fields: [storeMembers.storeId], references: [stores.id] }),
  user: one(profiles, { fields: [storeMembers.userId], references: [profiles.id] }),
}));

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryParent",
  }),
  children: many(categories, { relationName: "categoryParent" }),
  products: many(products),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  images: many(productImages),
  storeProducts: many(storeProducts),
  favorites: many(favorites),
  reviews: many(reviews),
  orderItems: many(orderItems),
  userEvents: many(userEvents),
  searchHistoryClicks: many(searchHistory),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

// ---------------------------------------------------------------------------
// Store listings & stock
// ---------------------------------------------------------------------------

export const storeProductsRelations = relations(storeProducts, ({ one, many }) => ({
  store: one(stores, { fields: [storeProducts.storeId], references: [stores.id] }),
  product: one(products, { fields: [storeProducts.productId], references: [products.id] }),
  inventory: one(inventory),
  inventoryMovements: many(inventoryMovements),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
  userEvents: many(userEvents),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  storeProduct: one(storeProducts, {
    fields: [inventory.storeProductId],
    references: [storeProducts.id],
  }),
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  storeProduct: one(storeProducts, {
    fields: [inventoryMovements.storeProductId],
    references: [storeProducts.id],
  }),
  createdByUser: one(profiles, {
    fields: [inventoryMovements.createdBy],
    references: [profiles.id],
  }),
}));

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(profiles, { fields: [carts.userId], references: [profiles.id] }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  storeProduct: one(storeProducts, {
    fields: [cartItems.storeProductId],
    references: [storeProducts.id],
  }),
}));

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(profiles, { fields: [orders.userId], references: [profiles.id] }),
  address: one(addresses, { fields: [orders.addressId], references: [addresses.id] }),
  storeOrders: many(storeOrders),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
  payments: many(payments),
  couponUsage: many(couponUsage),
}));

export const storeOrdersRelations = relations(storeOrders, ({ one, many }) => ({
  order: one(orders, { fields: [storeOrders.orderId], references: [orders.id] }),
  store: one(stores, { fields: [storeOrders.storeId], references: [stores.id] }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  storeOrder: one(storeOrders, {
    fields: [orderItems.storeOrderId],
    references: [storeOrders.id],
  }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
  storeProduct: one(storeProducts, {
    fields: [orderItems.storeProductId],
    references: [storeProducts.id],
  }),
  review: one(reviews),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
  storeOrder: one(storeOrders, {
    fields: [orderStatusHistory.storeOrderId],
    references: [storeOrders.id],
  }),
  changedByUser: one(profiles, {
    fields: [orderStatusHistory.changedBy],
    references: [profiles.id],
  }),
}));

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
  user: one(profiles, {
    fields: [payments.userId],
    references: [profiles.id],
    relationName: "paymentUser",
  }),
  verifiedByUser: one(profiles, {
    fields: [payments.verifiedBy],
    references: [profiles.id],
    relationName: "paymentVerifier",
  }),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  usage: many(couponUsage),
}));

export const couponUsageRelations = relations(couponUsage, ({ one }) => ({
  coupon: one(coupons, { fields: [couponUsage.couponId], references: [coupons.id] }),
  user: one(profiles, { fields: [couponUsage.userId], references: [profiles.id] }),
  order: one(orders, { fields: [couponUsage.orderId], references: [orders.id] }),
}));

// ---------------------------------------------------------------------------
// Customer engagement
// ---------------------------------------------------------------------------

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(profiles, { fields: [favorites.userId], references: [profiles.id] }),
  product: one(products, { fields: [favorites.productId], references: [products.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(profiles, { fields: [reviews.userId], references: [profiles.id] }),
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  orderItem: one(orderItems, { fields: [reviews.orderItemId], references: [orderItems.id] }),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(profiles, { fields: [subscriptions.userId], references: [profiles.id] }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

// ---------------------------------------------------------------------------
// Behavioural signals
// ---------------------------------------------------------------------------

export const userEventsRelations = relations(userEvents, ({ one }) => ({
  user: one(profiles, { fields: [userEvents.userId], references: [profiles.id] }),
  product: one(products, { fields: [userEvents.productId], references: [products.id] }),
  storeProduct: one(storeProducts, {
    fields: [userEvents.storeProductId],
    references: [storeProducts.id],
  }),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(profiles, { fields: [searchHistory.userId], references: [profiles.id] }),
  clickedProduct: one(products, {
    fields: [searchHistory.clickedProductId],
    references: [products.id],
  }),
}));

// ---------------------------------------------------------------------------
// Platform
// ---------------------------------------------------------------------------

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, { fields: [notifications.userId], references: [profiles.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(profiles, { fields: [auditLogs.actorId], references: [profiles.id] }),
}));
