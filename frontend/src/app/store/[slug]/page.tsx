import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Clock, MapPin, Star, Truck } from 'lucide-react';
import { getStoreBySlug, stores } from '@/data/stores';
import { getProductsByStore } from '@/data/products';
import { ProductBrowser } from '@/components/product/ProductBrowser';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SmartImage } from '@/components/ui/SmartImage';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return stores.map((store) => ({ slug: store.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = getStoreBySlug(slug);

  if (!store) return { title: 'Store not found' };

  return { title: store.name, description: store.description };
}

export default async function StorePage({ params }: PageProps) {
  const { slug } = await params;
  const store = getStoreBySlug(slug);

  if (!store) notFound();

  const products = getProductsByStore(store.id);

  return (
    <div className="container-page py-6">
      <Breadcrumbs items={[{ label: 'Stores', href: '/stores' }, { label: store.name }]} />

      <div className="mb-6 overflow-hidden rounded-card border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-card dark:shadow-none">
        <div className="relative h-36 bg-ink-100 dark:bg-ink-850 sm:h-48">
          <SmartImage src={store.cover} alt="" fill sizes="100vw" className="object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-ink-900/50 to-transparent" />
        </div>

        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:p-6">
          <span className="relative -mt-16 h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white dark:border-ink-900 bg-ink-100 dark:bg-ink-850 shadow-card dark:shadow-none sm:-mt-20 sm:h-24 sm:w-24">
            <SmartImage src={store.logo} alt={store.name} fill sizes="96px" className="object-cover" />
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-ink-900 dark:text-ink-50 sm:text-2xl">{store.name}</h1>
            <p className="mt-1 max-w-2xl text-sm text-ink-500 dark:text-ink-400">{store.description}</p>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:w-72 sm:shrink-0">
            <Stat icon={<Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />} label="Rating" value={store.rating.toFixed(1)} />
            <Stat icon={<Truck className="h-4 w-4 text-brand-600" aria-hidden />} label="Products" value={String(products.length)} />
            <Stat icon={<Clock className="h-4 w-4 text-brand-600" aria-hidden />} label="Delivery" value={store.deliveryTime} />
            <Stat icon={<MapPin className="h-4 w-4 text-brand-600" aria-hidden />} label="Area" value={store.location.split(',')[0]} />
          </dl>
        </div>
      </div>

      <ProductBrowser
        products={products}
        showStoreFilter={false}
        emptyMessage="This store has no products matching your filters right now."
      />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-ink-100 dark:border-ink-800 bg-ink-50 dark:bg-ink-950 px-3 py-2">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-400">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm font-semibold text-ink-900 dark:text-ink-50">{value}</dd>
    </div>
  );
}
