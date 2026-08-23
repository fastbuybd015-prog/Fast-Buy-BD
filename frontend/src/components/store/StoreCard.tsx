import Link from 'next/link';
import { MapPin, Clock } from 'lucide-react';
import type { Store } from '@/types';
import { SmartImage } from '@/components/ui/SmartImage';
import { Rating } from '@/components/ui/Rating';
import { buttonStyles } from '@/components/ui/Button';

export function StoreCard({
  store,
  productCount,
}: {
  store: Store;
  productCount: number;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-card border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      <div className="relative h-24 bg-ink-100 dark:bg-ink-800">
        <SmartImage
          src={store.cover}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-ink-900/45 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <span className="relative -mt-12 h-14 w-14 overflow-hidden rounded-xl border-2 border-white dark:border-ink-850 bg-ink-100 dark:bg-ink-800 shadow-card">
          <SmartImage src={store.logo} alt="" fill sizes="56px" className="object-cover" />
        </span>

        <div className="mb-3 mt-3 flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-base font-semibold text-ink-900 dark:text-ink-50">
            {store.name}
          </h3>
          <Rating value={store.rating} className="mt-0.5 shrink-0" />
        </div>

        <ul className="space-y-1.5 text-xs text-ink-500 dark:text-ink-400">
          <li className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-400 dark:text-ink-500" aria-hidden />
            <span className="truncate">{store.location}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-ink-400 dark:text-ink-500" aria-hidden />
            <span>Delivery in {store.deliveryTime}</span>
          </li>
        </ul>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink-100 dark:border-ink-800 pt-3">
          <span className="text-xs font-medium text-ink-600 dark:text-ink-400">{productCount} products</span>
          <Link href={`/store/${store.slug}`} className={buttonStyles('secondary', 'sm')}>
            View store
          </Link>
        </div>
      </div>
    </article>
  );
}
