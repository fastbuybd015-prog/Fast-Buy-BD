import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { searchProducts } from '@/data/products';
import { categories } from '@/data/categories';
import { ProductBrowser } from '@/components/product/ProductBrowser';
import { SearchBar } from '@/components/header/SearchBar';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search products, categories and stores on Fast Buy BD.',
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();
  const results = query ? searchProducts(query) : [];

  return (
    <div className="container-page py-6">
      <Breadcrumbs items={[{ label: 'Search' }]} />

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50 sm:text-3xl">
          {query ? (
            <>
              Results for <span className="text-brand-700 dark:text-brand-400">“{query}”</span>
            </>
          ) : (
            'Search products'
          )}
        </h1>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
          {query
            ? `${results.length} ${results.length === 1 ? 'product' : 'products'} found across all stores.`
            : 'Search by product name, category or store name.'}
        </p>

        <div className="mt-4 max-w-xl">
          <SearchBar initialQuery={query} />
        </div>
      </header>

      {results.length > 0 ? (
        <ProductBrowser products={results} />
      ) : (
        <div className="space-y-6">
          <EmptyState
            icon={<SearchX className="h-6 w-6" aria-hidden />}
            title="No products found"
            description={
              query
                ? `We could not find anything matching “${query}”. Check the spelling or try a more general word such as “rice”, “shampoo” or “charger”.`
                : 'Type something in the search box above to find products across all our stores.'
            }
            actionLabel="Continue shopping"
            actionHref="/"
          />

          <div>
            <h2 className="mb-3 text-sm font-semibold text-ink-900 dark:text-ink-50">Browse categories instead</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="rounded-full border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 px-3.5 py-1.5 text-sm text-ink-700 dark:text-ink-200 transition-colors hover:border-brand-200 dark:hover:border-brand-800 hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-700 dark:hover:text-brand-400 focus-ring"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
