'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, ArrowLeft } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { enrichedProducts } from '@/lib/api/products';

export default function FavoritesPage() {
  // In demo / initial load, show a curated set of user's favorite staple items
  const [favoriteItems, setFavoriteItems] = useState(enrichedProducts.slice(0, 6));

  return (
    <div className="container-page py-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500 fill-red-500" />
            <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Your Saved Favorites</h1>
          </div>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            Quickly re-order products you love from your preferred local stores
          </p>
        </div>

        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-xl bg-ink-100 dark:bg-ink-850 px-4 py-2 text-xs font-semibold text-ink-700 dark:text-ink-200 hover:bg-ink-200 dark:hover:bg-ink-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Continue Shopping
        </Link>
      </div>

      {favoriteItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 text-center">
          <div className="rounded-full bg-red-50 p-4 mb-3 text-red-400">
            <Heart className="h-8 w-8" />
          </div>
          <h3 className="text-base font-semibold text-ink-900 dark:text-ink-50 mb-1">Your wishlist is empty</h3>
          <p className="text-sm text-ink-500 dark:text-ink-400 max-w-xs mb-5">
            Click the heart icon on any product card to save it for quick re-ordering.
          </p>
          <Link
            href="/search"
            className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-xs"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {favoriteItems.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
