'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Scale,
  Store as StoreIcon,
  Star,
  Clock,
  ShoppingCart,
  CheckCircle2,
  TrendingDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/context/toast-context';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/format';

export function StorePriceComparison({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { showToast } = useToast();

  const storeListings = product.storeListings || [
    {
      storeId: 'store-01',
      storeName: product.store || 'Shwapno Superstore',
      storeSlug: product.storeSlug || 'shwapno-superstore',
      price: product.price,
      originalPrice: product.originalPrice,
      discount: product.discount,
      stock: 45,
      rating: product.rating,
      deliveryTime: '25–40 min',
      available: true,
    },
    {
      storeId: 'store-02',
      storeName: 'Chaldal Express Hub',
      storeSlug: 'chaldal-express-hub',
      price: Math.max(Math.round(product.price * 0.95), 10),
      originalPrice: product.originalPrice,
      discount: Math.min(product.discount + 5, 35),
      stock: 28,
      rating: 4.8,
      deliveryTime: '20–35 min',
      available: true,
    },
    {
      storeId: 'store-03',
      storeName: 'Meena Bazar Outlet',
      storeSlug: 'meena-bazar-outlet',
      price: Math.round(product.price * 1.04),
      originalPrice: product.originalPrice,
      discount: Math.max(product.discount - 2, 0),
      stock: 19,
      rating: 4.9,
      deliveryTime: '30–45 min',
      available: true,
    },
  ];

  const sortedListings = [...storeListings].sort((a, b) => a.price - b.price);
  const bestDeal = sortedListings[0];
  const maxSavings = Math.max(...sortedListings.map((s) => s.price)) - bestDeal.price;

  const handleAddListing = (listing: typeof sortedListings[0]) => {
    addItem(
      {
        ...product,
        store: listing.storeName,
        storeId: listing.storeId,
        price: listing.price,
        originalPrice: listing.originalPrice,
      },
      1,
    );
    showToast({
      title: `Added from ${listing.storeName}`,
      description: `${product.name} (৳${listing.price}) added to cart`,
    });
  };

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-xs transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink-200 dark:border-ink-800 bg-ink-50/70 dark:bg-ink-850/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/60">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink-900 dark:text-ink-50">
              Multi-Store Price Comparison ({sortedListings.length} Stores)
            </h3>
            <p className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5">
              Live price transparency across verified local outlets in Dhaka
            </p>
          </div>
        </div>

        {maxSavings > 0 && (
          <span className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-full bg-emerald-500 text-white px-3 py-1 text-xs font-bold shadow-xs">
            <TrendingDown className="h-3.5 w-3.5" />
            Save up to ৳{maxSavings}
          </span>
        )}
      </div>

      {/* Comparison Rows */}
      <div className="divide-y divide-ink-100 dark:divide-ink-800">
        {sortedListings.map((listing, idx) => {
          const isBest = idx === 0;
          const priceDiff = listing.price - bestDeal.price;

          return (
            <div
              key={listing.storeId}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:px-5 sm:py-4 transition-colors ${
                isBest
                  ? 'border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                  : 'border-l-4 border-l-transparent hover:bg-ink-50/50 dark:hover:bg-ink-850/40'
              }`}
            >
              {/* Store Details */}
              <div className="flex items-center gap-3.5">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs ${
                    isBest
                      ? 'bg-emerald-500 text-white'
                      : 'bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300'
                  }`}
                >
                  <StoreIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-ink-900 dark:text-ink-50">
                      {listing.storeName}
                    </span>
                    {isBest && (
                      <span className="rounded-md bg-emerald-500 text-white px-2 py-0.5 text-[10px] font-bold shadow-2xs">
                        Best Price
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
                    <span className="flex items-center gap-1 font-semibold text-ink-800 dark:text-ink-200">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {listing.rating}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-ink-400 dark:text-ink-500" />
                      {listing.deliveryTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price and Purchase Action */}
              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-ink-100 dark:border-ink-800 pt-3 sm:pt-0">
                <div className="text-left sm:text-right">
                  <div
                    className={`text-base sm:text-lg font-extrabold ${
                      isBest
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-ink-900 dark:text-ink-50'
                    }`}
                  >
                    {formatPrice(listing.price)}
                  </div>
                  {listing.originalPrice > listing.price ? (
                    <div className="text-[11px] text-ink-400 dark:text-ink-500 line-through">
                      {formatPrice(listing.originalPrice)}
                    </div>
                  ) : priceDiff > 0 ? (
                    <div className="text-[10px] font-semibold text-ink-400 dark:text-ink-500">
                      +৳{priceDiff} higher
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => handleAddListing(listing)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all focus-ring shrink-0 ${
                    isBest
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-brand-500 hover:bg-brand-600 text-white'
                  }`}
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Buy from Store
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
