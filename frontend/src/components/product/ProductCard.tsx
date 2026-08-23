'use client';

import Link from 'next/link';
import { Plus, Store as StoreIcon } from 'lucide-react';
import type { Product } from '@/types';
import { SmartImage } from '@/components/ui/SmartImage';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/context/toast-context';
import { formatPrice } from '@/lib/format';

export function ProductCard({ product }: { product: Product }) {
  const { addItem, setQuantity, getQuantity } = useCart();
  const { showToast } = useToast();
  const quantity = getQuantity(product.id);

  const handleAdd = () => {
    addItem(product, 1);
    showToast({
      title: `${product.name} added to cart`,
      description: `${product.unit} · ${formatPrice(product.price)}`,
    });
  };

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-ink-200 bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-card-hover dark:border-ink-800 dark:bg-ink-900 dark:shadow-none dark:hover:border-ink-700">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-ink-100 dark:bg-ink-800 focus-ring"
        aria-label={product.name}
      >
        <SmartImage
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />

        {product.discount > 0 ? (
          <span className="absolute left-2 top-2 rounded-md bg-accent-500 px-2 py-1 text-[11px] font-bold leading-none text-white shadow-sm">
            -{product.discount}%
          </span>
        ) : null}

        {!product.available ? (
          <span className="absolute inset-0 flex items-center justify-center bg-white/75 dark:bg-ink-900/75 text-sm font-semibold text-ink-600 dark:text-ink-300">
            Out of stock
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <Link
          href={`/store/${product.storeSlug}`}
          className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-sm text-xs text-ink-500 dark:text-ink-400 transition-colors hover:text-brand-700 dark:hover:text-brand-400 focus-ring"
        >
          <StoreIcon className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden />
          <span className="truncate">{product.store}</span>
        </Link>

        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2-safe rounded-sm text-sm font-medium leading-snug text-ink-900 dark:text-ink-50 transition-colors hover:text-brand-700 dark:hover:text-brand-400 focus-ring sm:text-[15px]"
        >
          {product.name}
        </Link>

        <div className="flex items-center gap-2">
          <Rating value={product.rating} />
          <span className="text-xs text-ink-400 dark:text-ink-500">· {product.unit}</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="min-w-0">
            <PriceDisplay price={product.price} originalPrice={product.originalPrice} />
            {product.discount > 0 ? (
              <Badge tone="brand" className="mt-1">
                Save {formatPrice(product.originalPrice - product.price)}
              </Badge>
            ) : null}
          </div>

          {!product.available ? (
            <span className="shrink-0 text-xs font-medium text-ink-400 dark:text-ink-500">Unavailable</span>
          ) : quantity === 0 ? (
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-brand-600 px-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 active:bg-brand-800 focus-ring"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add
            </button>
          ) : (
            <QuantitySelector
              value={quantity}
              size="sm"
              removable
              onChange={(next) => setQuantity(product.id, next)}
              label={`Quantity for ${product.name}`}
            />
          )}
        </div>
      </div>
    </article>
  );
}
