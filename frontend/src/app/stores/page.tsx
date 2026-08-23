import type { Metadata } from 'next';
import { stores } from '@/data/stores';
import { countProductsByStore } from '@/data/products';
import { StoreCard } from '@/components/store/StoreCard';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

export const metadata: Metadata = {
  title: 'All stores',
  description:
    'Browse every verified store on Fast Buy BD and shop your daily needs directly from your neighbourhood market.',
};

export default function StoresPage() {
  return (
    <div className="container-page py-6">
      <Breadcrumbs items={[{ label: 'Stores' }]} />

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50 sm:text-3xl">Our stores</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-500 dark:text-ink-400">
          {stores.length} verified partner stores across Dhaka and Chattogram. Mix products
          from different stores in a single basket — we handle the rest.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <StoreCard
            key={store.id}
            store={store}
            productCount={countProductsByStore(store.id)}
          />
        ))}
      </div>
    </div>
  );
}
