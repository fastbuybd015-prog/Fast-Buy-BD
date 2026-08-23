import type { Metadata } from 'next';
import { BadgePercent, Zap, Flame, Clock } from 'lucide-react';
import { products } from '@/data/products';
import { ProductBrowser } from '@/components/product/ProductBrowser';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Deals & Offers',
  description: 'Every discounted product on Fast Buy BD, updated every morning.',
};

export default function DealsPage() {
  const discounted = products.filter((product) => product.discount > 0);
  const biggestDiscount = Math.max(...discounted.map((product) => product.discount));

  return (
    <div className="container-page py-6">
      <Breadcrumbs items={[{ label: 'Deals & offers' }]} />

      <header className="mb-8 overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-6 sm:p-8 shadow-xs transition-colors">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-50 dark:bg-accent-950/80 border border-accent-200/80 dark:border-accent-800/80 px-3 py-1 text-xs font-bold text-accent-700 dark:text-accent-300">
              <Flame className="h-3.5 w-3.5 text-accent-500" />
              <span>Today's Verified Discounts</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink-900 dark:text-ink-50 tracking-tight">
              Deals & Offers
            </h1>
            <p className="max-w-xl text-sm sm:text-base text-ink-600 dark:text-ink-300 leading-relaxed">
              {discounted.length} products are on offer right now across local Dhaka merchants with savings up to{' '}
              <strong className="text-accent-600 dark:text-accent-400 font-bold">{biggestDiscount}%</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <span className="w-fit rounded-xl bg-accent-500 hover:bg-accent-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-colors">
              Up to {biggestDiscount}% OFF
            </span>
            <span className="text-[11px] text-ink-400 dark:text-ink-500 font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" /> Updated daily at 7:00 AM
            </span>
          </div>
        </div>
      </header>

      <ProductBrowser
        products={discounted}
        emptyMessage="No offers match these filters — try widening the price range."
      />
    </div>
  );
}
