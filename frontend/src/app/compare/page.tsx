'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Scale,
  Search,
  CheckCircle2,
  TrendingDown,
  Store as StoreIcon,
  Clock,
  Star,
  ShoppingCart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SmartImage } from '@/components/ui/SmartImage';
import { enrichedProducts } from '@/lib/api/products';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/context/toast-context';
import type { Product } from '@/types';

export default function ComparePage() {
  const { addItem } = useCart();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product>(enrichedProducts[0]);

  const filteredProducts = searchQuery.trim()
    ? enrichedProducts.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : enrichedProducts.slice(0, 12);

  const listings = selectedProduct.storeListings || [];
  const sortedListings = [...listings].sort((a, b) => a.price - b.price);
  const bestDeal = sortedListings[0];

  const handleAddStoreListing = (listing: typeof sortedListings[0]) => {
    addItem(
      {
        id: selectedProduct.id,
        name: selectedProduct.name,
        slug: selectedProduct.slug,
        image: selectedProduct.image,
        store: listing.storeName,
        storeId: listing.storeId,
        unit: selectedProduct.unit,
        price: listing.price,
        originalPrice: listing.originalPrice,
        category: selectedProduct.category,
        storeSlug: listing.storeSlug,
        gallery: selectedProduct.gallery,
        discount: listing.discount,
        rating: listing.rating,
        reviews: selectedProduct.reviews,
        description: selectedProduct.description,
        tags: selectedProduct.tags,
        available: listing.available,
        popular: selectedProduct.popular,
      },
      1,
    );
    showToast(`Added ${selectedProduct.name} from ${listing.storeName} to cart!`, 'success');
  };

  return (
    <div className="container-page py-8 max-w-6xl">
      {/* Header Banner */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-6 sm:p-8 shadow-xs transition-colors">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-950/80 border border-amber-200/80 dark:border-amber-800/80 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
            <Scale className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span>Hyperlocal Price Transparency</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink-900 dark:text-ink-50 tracking-tight">
            Multi-Store Price Comparison
          </h1>
          <p className="text-sm sm:text-base text-ink-600 dark:text-ink-300 leading-relaxed">
            Compare live prices, delivery times, and merchant ratings across verified local stores in your
            area for any canonical product.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Product Picker */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 dark:text-ink-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product to compare..."
              className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850 py-2.5 pl-9 pr-4 text-sm text-ink-900 dark:text-ink-50 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <Card className="border-ink-200 dark:border-ink-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
                Select Product ({filteredProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex flex-col gap-1 max-h-[500px] overflow-y-auto divide-y divide-ink-100 dark:divide-ink-800">
              {filteredProducts.map((p) => {
                const isSelected = selectedProduct.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProduct(p)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-950/60 border border-brand-300 dark:border-brand-800'
                        : 'hover:bg-ink-50 dark:hover:bg-ink-800/60'
                    }`}
                  >
                    <div className="relative h-12 w-12 rounded-lg bg-ink-50 dark:bg-ink-800 overflow-hidden shrink-0">
                      <SmartImage src={p.image} alt={p.name} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs text-ink-900 dark:text-ink-50 truncate">{p.name}</div>
                      <div className="text-[11px] text-ink-500 dark:text-ink-400">{p.unit}</div>
                      <div className="text-xs font-bold text-brand-700 dark:text-brand-400 mt-0.5">
                        from ৳{p.price}
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Multi-Store Comparison View */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Selected Product Banner */}
          <Card className="border-ink-200 dark:border-ink-800 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <div className="relative h-28 w-28 rounded-xl bg-ink-50 dark:bg-ink-800 overflow-hidden shrink-0 border border-ink-100 dark:border-ink-700">
                  <SmartImage src={selectedProduct.image} alt={selectedProduct.name} fill sizes="112px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <Badge tone="brand">{selectedProduct.category.toUpperCase()}</Badge>
                  <h2 className="text-xl font-bold text-ink-900 dark:text-ink-50 mt-1">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-1 leading-relaxed">
                    {selectedProduct.description}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs font-medium text-ink-600 dark:text-ink-300">
                    <span>Pack size: <strong>{selectedProduct.unit}</strong></span>
                    <span>Available at: <strong>{listings.length} stores</strong></span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <Card className="border-ink-200 dark:border-ink-800 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-ink-900 dark:text-ink-50">
                  Store Price & Rating Matrix
                </CardTitle>
                {bestDeal && (
                  <Badge tone="deal">
                    Lowest: ৳{bestDeal.price} at {bestDeal.storeName}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-ink-200 dark:border-ink-800 bg-ink-50/70 dark:bg-ink-950/60 text-ink-500 dark:text-ink-400 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Verified Store</th>
                      <th className="py-3 px-4">Store Rating</th>
                      <th className="py-3 px-4">Estimated Delivery</th>
                      <th className="py-3 px-4">Stock Status</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                    {sortedListings.map((listing, idx) => {
                      const isBest = idx === 0;
                      return (
                        <tr
                          key={listing.storeId}
                          className={`transition-colors ${
                            isBest
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/30'
                              : 'hover:bg-ink-50/50 dark:hover:bg-ink-850/50'
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-lg bg-ink-100 dark:bg-ink-800 flex items-center justify-center text-ink-700 dark:text-ink-300 font-bold text-xs">
                                <StoreIcon className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <span className="font-semibold text-ink-900 dark:text-ink-100">{listing.storeName}</span>
                                {isBest && (
                                  <Badge tone="deal" className="ml-2 text-[10px]">
                                    Best Deal
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-ink-700 dark:text-ink-300">
                            <span className="flex items-center gap-1 font-medium">
                              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                              {listing.rating}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-ink-600 dark:text-ink-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-ink-400 dark:text-ink-500" />
                              {listing.deliveryTime}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge tone={listing.available ? 'success' : 'destructive'}>
                              {listing.available ? `${listing.stock} in stock` : 'Out of stock'}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-sm text-ink-900 dark:text-ink-50">৳{listing.price}</div>
                            {listing.originalPrice > listing.price && (
                              <div className="text-[10px] text-ink-400 dark:text-ink-500 line-through">
                                ৳{listing.originalPrice}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleAddStoreListing(listing)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                isBest
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                                  : 'bg-brand-600 text-white hover:bg-brand-700'
                              }`}
                            >
                              <ShoppingCart className="h-3 w-3" />
                              Buy from Store
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
