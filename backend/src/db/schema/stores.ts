import { boolean, index, integer, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { primaryId, rating, timestamps } from "./_shared";
import { storeStatusEnum } from "./enums";

/**
 * A local store selling on the platform.
 *
 * Stores are the reason FastShopBD can compare prices at all: the same
 * canonical product is listed by several stores through `store_products`.
 */
export const stores = pgTable(
  "stores",
  {
    id: primaryId(),

    name: text().notNull(),
    slug: text().notNull(),
    description: text(),

    logoUrl: text(),
    coverUrl: text(),

    phone: text(),
    email: text(),

    addressLine: text(),
    city: text(),
    area: text(),

    /**
     * Delivery estimate as a range, stored numerically rather than as the
     * display string "30–45 min", so the FASTEST basket-optimizer mode and
     * "sort by delivery speed" can actually order by it.
     */
    deliveryMinMinutes: integer(),
    deliveryMaxMinutes: integer(),

    /** Denormalised average of this store's review scores. */
    ratingAverage: rating().notNull().default("0"),
    reviewCount: integer().notNull().default(0),

    isVerified: boolean().notNull().default(false),
    status: storeStatusEnum().notNull().default("ACTIVE"),

    ...timestamps,
  },
  (t) => [
    uniqueIndex("stores_slug_key").on(t.slug),
    index("stores_status_idx").on(t.status),
    index("stores_city_idx").on(t.city),
  ],
);

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
