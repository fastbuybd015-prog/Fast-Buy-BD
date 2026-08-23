'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Store as StoreIcon, ShieldCheck, MapPin, Phone, Star, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { stores as mockStores } from '@/data/stores';

export default function AdminStoresPage() {
  const [storesList, setStoresList] = useState(
    mockStores.map((s) => ({
      ...s,
      isVerified: true,
      phone: '01711-889900',
      totalSales: 485000,
    })),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50 tracking-tight">Verified Stores Network</h1>
          <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 mt-1">
            Manage local merchant profiles, geographical sector assignments, and fulfillment ratings
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-xs font-semibold text-white hover:bg-brand-700 shadow-xs transition-colors"
        >
          <Plus className="h-4 w-4" />
          Onboard New Merchant
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {storesList.map((store) => (
          <Card key={store.id} className="border-ink-200 dark:border-ink-800 hover:border-brand-300 dark:hover:border-brand-600 transition-colors shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-base shrink-0">
                    {store.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-ink-900 dark:text-ink-50 truncate">{store.name}</h3>
                    <div className="flex items-center gap-1 text-[11px] text-ink-500 dark:text-ink-400 mt-0.5 truncate">
                      <MapPin className="h-3 w-3 text-ink-400 dark:text-ink-500 shrink-0" />
                      <span className="truncate">{store.location}</span>
                    </div>
                  </div>
                </div>

                <Badge tone="success" className="gap-1 shrink-0">
                  <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  Verified
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 py-3.5 border-y border-ink-100 dark:border-ink-800 text-xs">
                <div>
                  <div className="text-ink-500 dark:text-ink-400 text-[11px]">Rating</div>
                  <div className="font-bold text-ink-900 dark:text-ink-100 flex items-center gap-1 mt-0.5">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    {store.rating}
                  </div>
                </div>
                <div>
                  <div className="text-ink-500 dark:text-ink-400 text-[11px]">Avg Delivery</div>
                  <div className="font-semibold text-ink-800 dark:text-ink-200 mt-0.5">{store.deliveryTime}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs pt-1">
                <span className="text-ink-500 dark:text-ink-400 font-medium">Total GMV: ৳{(store.totalSales / 1000).toFixed(0)}k</span>
                <Link
                  href={`/store/${store.slug}`}
                  className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                >
                  View Storefront →
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
