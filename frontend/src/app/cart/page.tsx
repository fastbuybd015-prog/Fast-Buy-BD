'use client';

import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Trash2, TrendingDown, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { OrderSummary } from '@/components/cart/OrderSummary';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { EmptyState } from '@/components/ui/EmptyState';
import { buttonStyles } from '@/components/ui/Button';

export default function CartPage() {
  const { items, itemCount, totals, hydrated, clearCart } = useCart();

  return (
    <div className="container-page py-6">
      <Breadcrumbs items={[{ label: 'Shopping cart' }]} />

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50 sm:text-3xl">Shopping cart</h1>
          <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
            {hydrated
              ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'} in your basket`
              : 'Loading your basket…'}
          </p>
        </div>

        {items.length > 0 ? (
          <button
            type="button"
            onClick={clearCart}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-500 dark:text-ink-400 transition-colors hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 focus-ring"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Clear cart
          </button>
        ) : null}
      </header>

      {!hydrated ? (
        <CartSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" aria-hidden />}
          title="Your cart is empty"
          description="Browse today's deals or try our Smart Budget Basket builder."
          actionLabel="Start shopping"
          actionHref="/search"
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="space-y-4 lg:col-span-8">
            {/* Smart Basket Optimizer Prompt Banner */}
            <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="rounded-xl bg-emerald-500 text-white p-2.5 shadow-xs">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-ink-900 dark:text-ink-50">Save money on this cart?</h3>
                  <p className="text-xs text-ink-600 dark:text-ink-400 mt-0.5">
                    Compare this basket against other verified local stores across Dhaka.
                  </p>
                </div>
              </div>

              <Link
                href="/basket-optimizer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition-all shrink-0"
              >
                <TrendingDown className="h-3.5 w-3.5" />
                Optimize Basket
              </Link>
            </div>

            <div className="overflow-hidden rounded-card border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 shadow-card dark:shadow-none">
              <ul className="divide-y divide-ink-100 dark:divide-ink-800">
                {items.map((item) => (
                  <CartItemRow key={item.productId} item={item} />
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-4 lg:sticky lg:top-32">
            <OrderSummary totals={totals} itemCount={itemCount}>
              <div className="space-y-2.5">
                <Link href="/checkout" className={`${buttonStyles('primary', 'lg')} w-full`}>
                  Proceed to checkout
                </Link>
                <Link href="/search" className={`${buttonStyles('outline', 'md')} w-full`}>
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Continue shopping
                </Link>
              </div>
            </OrderSummary>

            <div className="rounded-xl bg-ink-50 dark:bg-ink-950 p-3.5 border border-ink-100 dark:border-ink-800 text-xs text-ink-600 dark:text-ink-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-ink-900 dark:text-ink-50">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                100% Quality & Freshness Guarantee
              </div>
              <p className="text-[11px] text-ink-500 dark:text-ink-400">
                Hand-picked by verified local stores. Inspect your order on delivery with full return
                right at your doorstep.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-3 lg:col-span-8">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex gap-4 rounded-card border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 p-4">
            <div className="h-20 w-20 animate-pulse rounded-lg bg-ink-100 dark:bg-ink-800" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 w-2/3 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
              <div className="h-8 w-24 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-card bg-white dark:bg-ink-900" />
    </div>
  );
}
