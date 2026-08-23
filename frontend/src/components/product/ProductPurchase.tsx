'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ShoppingCart, Store as StoreIcon, Truck } from 'lucide-react';
import type { Product } from '@/types';
import { SmartImage } from '@/components/ui/SmartImage';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/context/toast-context';
import { classNames, formatPrice } from '@/lib/format';

export function ProductPurchase({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem, getQuantity } = useCart();
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product.gallery[0] ?? product.image);
  const inCart = getQuantity(product.id);

  const handleAdd = () => {
    addItem(product, quantity);
    showToast({
      title: `${quantity} × ${product.name} added`,
      description: `Subtotal ${formatPrice(product.price * quantity)}`,
    });
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    router.push('/checkout');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
      {/* Gallery */}
      <div>
        <div className="relative aspect-square overflow-hidden rounded-card border border-ink-200 dark:border-ink-800 bg-ink-100 dark:bg-ink-850">
          <SmartImage
            src={activeImage}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover"
          />
          {product.discount > 0 ? (
            <span className="absolute left-3 top-3 rounded-md bg-accent-500 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm">
              -{product.discount}% OFF
            </span>
          ) : null}
        </div>

        {product.gallery.length > 1 ? (
          <div className="mt-3 flex gap-3">
            {product.gallery.map((image) => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveImage(image)}
                className={classNames(
                  'relative h-20 w-20 overflow-hidden rounded-lg border-2 bg-ink-100 dark:bg-ink-850 transition-colors focus-ring',
                  activeImage === image
                    ? 'border-brand-600 dark:border-brand-500'
                    : 'border-ink-200 dark:border-ink-800 hover:border-ink-300 dark:hover:border-ink-700',
                )}
                aria-label={`View image of ${product.name}`}
                aria-pressed={activeImage === image}
              >
                <SmartImage src={image} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Details */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/store/${product.storeSlug}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200/80 dark:border-brand-800/80 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300 transition-colors hover:bg-brand-100 dark:hover:bg-brand-900/60 focus-ring shadow-2xs"
          >
            <StoreIcon className="h-3.5 w-3.5" aria-hidden />
            {product.store}
          </Link>
          {product.available ? (
            <Badge tone="brand">
              <Check className="h-3 w-3" aria-hidden />
              In stock
            </Badge>
          ) : (
            <Badge tone="danger">Out of stock</Badge>
          )}
        </div>

        <h1 className="mt-3 text-2xl font-bold leading-tight text-ink-900 dark:text-ink-50 sm:text-3xl">
          {product.name}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Rating value={product.rating} reviews={product.reviews} size="md" />
          <span className="text-sm text-ink-400 dark:text-ink-600">·</span>
          <span className="text-sm text-ink-500 dark:text-ink-400 font-medium">{product.unit}</span>
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <PriceDisplay
            price={product.price}
            originalPrice={product.originalPrice}
            size="lg"
          />
          {product.discount > 0 ? (
            <Badge tone="accent" className="mb-1">
              Save {formatPrice(product.originalPrice - product.price)} ({product.discount}%)
            </Badge>
          ) : null}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{product.description}</p>

        {/* Purchase Card with full Dark Mode support */}
        <div className="mt-6 rounded-card border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 shadow-card dark:shadow-none">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                Quantity
              </p>
              <QuantitySelector
                value={quantity}
                onChange={(next) => setQuantity(Math.max(1, next))}
                min={1}
                max={20}
              />
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Total</p>
              <p className="text-xl font-bold text-ink-900 dark:text-ink-50">
                {formatPrice(product.price * quantity)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <Button onClick={handleAdd} disabled={!product.available} size="lg">
              <ShoppingCart className="h-4 w-4" aria-hidden />
              Add to cart
            </Button>
            <Button
              onClick={handleBuyNow}
              disabled={!product.available}
              variant="accent"
              size="lg"
            >
              Buy now
            </Button>
          </div>

          {inCart > 0 ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-brand-700 dark:text-brand-400">
              <Check className="h-3.5 w-3.5" aria-hidden />
              {inCart} already in your cart ·{' '}
              <Link href="/cart" className="underline underline-offset-2">
                view cart
              </Link>
            </p>
          ) : null}
        </div>

        <ul className="mt-5 space-y-2 text-sm text-ink-600 dark:text-ink-300">
          <li className="flex items-center gap-2">
            <Truck className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
            Delivered from {product.store} · free over {formatPrice(1000)}
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
            Cash on delivery available · easy return on delivery
          </li>
        </ul>
      </div>
    </div>
  );
}
