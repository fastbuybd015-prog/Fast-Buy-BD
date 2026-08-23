'use client';

import Link from 'next/link';
import { Store as StoreIcon, Trash2 } from 'lucide-react';
import type { CartItem } from '@/types';
import { SmartImage } from '@/components/ui/SmartImage';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/context/toast-context';
import { formatPrice } from '@/lib/format';

export function CartItemRow({ item }: { item: CartItem }) {
  const { setQuantity, removeItem } = useCart();
  const { showToast } = useToast();

  const handleRemove = () => {
    removeItem(item.productId);
    showToast({
      title: 'Removed from cart',
      description: item.name,
      variant: 'info',
    });
  };

  return (
    <li className="flex gap-3 p-4 sm:gap-4 border-b border-ink-100 dark:border-ink-800 last:border-b-0">
      <Link
        href={`/product/${item.slug}`}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-ink-100 dark:bg-ink-800 focus-ring sm:h-24 sm:w-24"
      >
        <SmartImage src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/product/${item.slug}`}
              className="line-clamp-2-safe rounded-sm text-sm font-medium text-ink-900 dark:text-ink-100 transition-colors hover:text-brand-700 dark:hover:text-brand-400 focus-ring sm:text-[15px]"
            >
              {item.name}
            </Link>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
              <StoreIcon className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" aria-hidden />
              {item.store} · {item.unit}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="shrink-0 rounded-md p-1.5 text-ink-400 dark:text-ink-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/60 hover:text-red-600 dark:hover:text-red-400 focus-ring"
            aria-label={`Remove ${item.name} from cart`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <QuantitySelector
            value={item.quantity}
            size="sm"
            removable
            onChange={(next) => setQuantity(item.productId, next)}
            label={`Quantity for ${item.name}`}
          />

          <div className="text-right">
            <p className="text-sm font-bold text-ink-900 dark:text-ink-50">
              {formatPrice(item.price * item.quantity)}
            </p>
            {item.originalPrice > item.price ? (
              <p className="flex items-baseline justify-end gap-1 text-xs text-ink-400 dark:text-ink-400">
                <PriceDisplay
                  price={item.price}
                  originalPrice={item.originalPrice}
                  size="sm"
                />
                each
              </p>
            ) : (
              <p className="text-xs text-ink-400 dark:text-ink-400">{formatPrice(item.price)} each</p>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
