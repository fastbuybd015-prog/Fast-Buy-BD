'use client';

import { useMemo, useState } from 'react';
import { PackageSearch, SlidersHorizontal, X } from 'lucide-react';
import type { Product, SortOption } from '@/types';
import { stores } from '@/data/stores';
import { ProductGrid } from '@/components/product/ProductGrid';
import { SelectInput } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { classNames, formatPrice } from '@/lib/format';

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'popular', label: 'Most popular' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'discount', label: 'Biggest discount' },
  { value: 'rating', label: 'Top rated' },
];

const PRICE_RANGES = [
  { id: 'all', label: 'All prices', min: 0, max: Infinity },
  { id: 'under-200', label: 'Under ৳200', min: 0, max: 200 },
  { id: '200-500', label: '৳200 – ৳500', min: 200, max: 500 },
  { id: '500-1000', label: '৳500 – ৳1,000', min: 500, max: 1000 },
  { id: 'over-1000', label: 'Over ৳1,000', min: 1000, max: Infinity },
];

interface Filters {
  priceRange: string;
  storeIds: string[];
  discountedOnly: boolean;
  minRating: number;
  inStockOnly: boolean;
}

const DEFAULT_FILTERS: Filters = {
  priceRange: 'all',
  storeIds: [],
  discountedOnly: false,
  minRating: 0,
  inStockOnly: false,
};

export function ProductBrowser({
  products,
  /** Hidden on store pages, where every product shares one store. */
  showStoreFilter = true,
  emptyMessage = 'Try clearing a filter or browsing another category.',
}: {
  products: Product[];
  showStoreFilter?: boolean;
  emptyMessage?: string;
}) {
  const [sort, setSort] = useState<SortOption>('popular');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [panelOpen, setPanelOpen] = useState(false);

  const availableStores = useMemo(() => {
    const ids = new Set(products.map((product) => product.storeId));
    return stores.filter((store) => ids.has(store.id));
  }, [products]);

  const visible = useMemo(() => {
    const range = PRICE_RANGES.find((item) => item.id === filters.priceRange) ?? PRICE_RANGES[0];

    const filtered = products.filter((product) => {
      if (product.price < range.min || product.price > range.max) return false;
      if (filters.storeIds.length && !filters.storeIds.includes(product.storeId)) return false;
      if (filters.discountedOnly && product.discount <= 0) return false;
      if (product.rating < filters.minRating) return false;
      if (filters.inStockOnly && !product.available) return false;
      return true;
    });

    const sorted = [...filtered];
    switch (sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'discount':
        sorted.sort((a, b) => b.discount - a.discount);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      default:
        sorted.sort(
          (a, b) => Number(b.popular) - Number(a.popular) || b.rating - a.rating,
        );
    }

    return sorted;
  }, [products, filters, sort]);

  const activeFilterCount =
    (filters.priceRange !== 'all' ? 1 : 0) +
    filters.storeIds.length +
    (filters.discountedOnly ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0);

  const toggleStore = (storeId: string) => {
    setFilters((current) => ({
      ...current,
      storeIds: current.storeIds.includes(storeId)
        ? current.storeIds.filter((id) => id !== storeId)
        : [...current.storeIds, storeId],
    }));
  };

  const filterPanel = (
    <div className="space-y-6">
      <FilterGroup title="Price">
        <div className="space-y-2">
          {PRICE_RANGES.map((range) => (
            <label key={range.id} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700 dark:text-ink-200">
              <input
                type="radio"
                name="price-range"
                checked={filters.priceRange === range.id}
                onChange={() => setFilters((current) => ({ ...current, priceRange: range.id }))}
                className="h-4 w-4 accent-brand-600"
              />
              <span>{range.label}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      {showStoreFilter && availableStores.length > 1 ? (
        <FilterGroup title="Store">
          <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            {availableStores.map((store) => (
              <label key={store.id} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700 dark:text-ink-200">
                <input
                  type="checkbox"
                  checked={filters.storeIds.includes(store.id)}
                  onChange={() => toggleStore(store.id)}
                  className="h-4 w-4 rounded accent-brand-600"
                />
                <span className="truncate">{store.name}</span>
              </label>
            ))}
          </div>
        </FilterGroup>
      ) : null}

      <FilterGroup title="Rating">
        <div className="space-y-2">
          {[0, 4, 4.5].map((rating) => (
            <label key={rating} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700 dark:text-ink-200">
              <input
                type="radio"
                name="min-rating"
                checked={filters.minRating === rating}
                onChange={() => setFilters((current) => ({ ...current, minRating: rating }))}
                className="h-4 w-4 accent-brand-600"
              />
              <span>{rating === 0 ? 'All ratings' : `${rating}★ and above`}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Offers">
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700 dark:text-ink-200">
            <input
              type="checkbox"
              checked={filters.discountedOnly}
              onChange={(event) =>
                setFilters((current) => ({ ...current, discountedOnly: event.target.checked }))
              }
              className="h-4 w-4 rounded accent-brand-600"
            />
            <span>Discounted items only</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700 dark:text-ink-200">
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={(event) =>
                setFilters((current) => ({ ...current, inStockOnly: event.target.checked }))
              }
              className="h-4 w-4 rounded accent-brand-600"
            />
            <span>In stock only</span>
          </label>
        </div>
      </FilterGroup>

      <Button
        variant="outline"
        size="sm"
        fullWidth
        onClick={() => setFilters(DEFAULT_FILTERS)}
        disabled={activeFilterCount === 0}
      >
        Clear filters
      </Button>
    </div>
  );

  const priceSummary = useMemo(() => {
    if (visible.length === 0) return null;
    const prices = visible.map((product) => product.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [visible]);

  return (
    <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8">
      {/* Desktop Sticky Sidebar Filter */}
      <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
        <div className="sticky top-28 rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 shadow-xs space-y-6 transition-colors">
          <div className="flex items-center justify-between pb-3.5 border-b border-ink-100 dark:border-ink-800">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900 dark:text-ink-50">
              <SlidersHorizontal className="h-4 w-4 text-brand-600 dark:text-brand-400" aria-hidden />
              Filters
            </h2>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline"
              >
                Reset ({activeFilterCount})
              </button>
            )}
          </div>
          {filterPanel}
        </div>
      </aside>

      {/* Main Products Area */}
      <div className="flex-1 min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-500 dark:text-ink-400">
            <span className="font-semibold text-ink-900 dark:text-ink-50">{visible.length}</span>{' '}
            {visible.length === 1 ? 'product' : 'products'}
            {priceSummary ? (
              <span className="hidden sm:inline">
                {' '}
                · {formatPrice(priceSummary.min)} – {formatPrice(priceSummary.max)}
              </span>
            ) : null}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden inline-flex items-center gap-1.5"
              onClick={() => setPanelOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              <span>Filters</span>
              {activeFilterCount > 0 ? (
                <span className="ml-1 rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>

            <SelectInput
              label="Sort by"
              hideLabel
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              options={SORT_OPTIONS}
              className="w-[170px]"
            />
          </div>
        </div>

        {visible.length > 0 ? (
          <ProductGrid products={visible} />
        ) : (
          <EmptyState
            icon={<PackageSearch className="h-6 w-6" aria-hidden />}
            title="No products match these filters"
            description={emptyMessage}
            actionLabel="Back to home"
            actionHref="/"
          />
        )}
      </div>

      {/* Mobile filter sheet modal */}
      {panelOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-ink-900/50 backdrop-blur-xs"
            onClick={() => setPanelOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="absolute bottom-0 left-0 right-0 max-h-[85vh] animate-slide-up overflow-y-auto rounded-t-2xl border-t border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 shadow-pop transition-colors"
          >
            <div className="mb-4 flex items-center justify-between pb-3 border-b border-ink-100 dark:border-ink-800">
              <h2 className="text-base font-bold text-ink-900 dark:text-ink-50 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="rounded-lg p-1.5 text-ink-400 hover:text-ink-700 hover:bg-ink-100 dark:text-ink-400 dark:hover:text-white dark:hover:bg-ink-800 focus-ring transition-colors"
                aria-label="Close filters"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {filterPanel}
            <Button
              fullWidth
              className={classNames('mt-5')}
              onClick={() => setPanelOpen(false)}
            >
              Show {visible.length} products
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-ink-400 dark:text-ink-500">
        {title}
      </h3>
      {children}
    </div>
  );
}
