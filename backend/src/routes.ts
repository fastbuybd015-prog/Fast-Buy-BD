import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { DOCS_ROUTE } from "@/config/constants";
import { addressRoutes } from "@/modules/addresses/addresses.route";
import { adminAnalyticsRoutes } from "@/modules/admin/admin-analytics.route";
import { adminAuditRoutes } from "@/modules/admin/admin-audit.route";
import { adminCouponRoutes } from "@/modules/admin/admin-coupons.route";
import { adminOrderRoutes } from "@/modules/admin/admin-orders.route";
import { adminPaymentRoutes } from "@/modules/admin/admin-payments.route";
import { brandRoutes } from "@/modules/brands/brands.route";
import { cartRoutes } from "@/modules/cart/cart.route";
import { categoryRoutes } from "@/modules/categories/categories.route";
import { chatRoutes } from "@/modules/chat/chat.route";
import { checkoutRoutes } from "@/modules/checkout/checkout.route";
import { couponRoutes } from "@/modules/coupons/coupons.route";
import { eventRoutes } from "@/modules/events/events.route";
import { favoriteRoutes } from "@/modules/favorites/favorites.route";
import { notificationRoutes } from "@/modules/notifications/notifications.route";
import { orderRoutes } from "@/modules/orders/orders.route";
import { paymentRoutes } from "@/modules/payments/payments.route";
import { productRoutes } from "@/modules/products/products.route";
import { recommendationRoutes } from "@/modules/recommendations/recommendations.route";
import { reviewRoutes } from "@/modules/reviews/reviews.route";
import { settingsRoutes } from "@/modules/settings/settings.route";
import { basketOptimizerRoutes } from "@/modules/smart-shopping/basket-optimizer.route";
import { budgetBasketRoutes } from "@/modules/smart-shopping/budget-basket.route";
import { expiryDealsRoutes } from "@/modules/smart-shopping/expiry-deals.route";
import { storeAnalyticsRoutes } from "@/modules/store-dashboard/store-analytics.route";
import { storeDashboardRoutes } from "@/modules/store-dashboard/store-dashboard.route";
import { storeRoutes } from "@/modules/stores/stores.route";
import { subscriptionRoutes } from "@/modules/subscriptions/subscriptions.route";
import { userRoutes } from "@/modules/users/users.route";
import { successSchema } from "@/utils/response";

export const apiRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    "/",
    {
      schema: {
        tags: ["Health"],
        summary: "API index",
        description: "Metadata about this API version.",
        response: {
          200: successSchema(
            z.object({
              name: z.string(),
              version: z.string(),
              documentation: z.string(),
            }),
          ),
        },
      },
    },
    async () => ({
      success: true as const,
      data: {
        name: "FastShopBD API",
        version: "v1",
        documentation: DOCS_ROUTE,
      },
    }),
  );

  // Catalog
  await app.register(categoryRoutes, { prefix: "/categories" });
  await app.register(brandRoutes, { prefix: "/brands" });
  await app.register(productRoutes, { prefix: "/products" });
  await app.register(storeRoutes, { prefix: "/stores" });

  // Users & Addresses
  await app.register(userRoutes, { prefix: "/users" });
  await app.register(addressRoutes, { prefix: "/addresses" });

  // Cart & Checkout
  await app.register(cartRoutes, { prefix: "/cart" });
  await app.register(checkoutRoutes, { prefix: "/checkout" });

  // Orders & Payments
  await app.register(orderRoutes, { prefix: "/orders" });
  await app.register(paymentRoutes, { prefix: "/payments" });

  // Coupons
  await app.register(couponRoutes, { prefix: "/coupons" });

  // Favorites & Reviews
  await app.register(favoriteRoutes, { prefix: "/favorites" });
  await app.register(reviewRoutes, { prefix: "/products" });

  // Subscriptions
  await app.register(subscriptionRoutes, { prefix: "/subscriptions" });

  // Notifications
  await app.register(notificationRoutes, { prefix: "/notifications" });

  // Recommendations
  await app.register(recommendationRoutes, { prefix: "/recommendations" });

  // Smart Shopping
  await app.register(budgetBasketRoutes, { prefix: "/budget-basket" });
  await app.register(basketOptimizerRoutes, { prefix: "/basket" });
  await app.register(expiryDealsRoutes, { prefix: "/expiry-deals" });

  // Events & Tracking
  await app.register(eventRoutes, { prefix: "/events" });

  // AI Customer Assistant (Gemini)
  await app.register(chatRoutes, { prefix: "/chat" });

  // Settings
  await app.register(settingsRoutes, { prefix: "/settings" });

  // Store Dashboard
  await app.register(storeDashboardRoutes, { prefix: "/store" });
  await app.register(storeAnalyticsRoutes, { prefix: "/store/analytics" });

  // Admin
  await app.register(adminPaymentRoutes, { prefix: "/admin/payments" });
  await app.register(adminOrderRoutes, { prefix: "/admin/orders" });
  await app.register(adminCouponRoutes, { prefix: "/admin/coupons" });
  await app.register(adminAnalyticsRoutes, { prefix: "/admin/analytics" });
  await app.register(adminAuditRoutes, { prefix: "/admin/audit-logs" });
};
