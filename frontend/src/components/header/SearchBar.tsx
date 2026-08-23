'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { searchProducts } from '@/data/products';
import { SmartImage } from '@/components/ui/SmartImage';
import { formatPrice } from '@/lib/format';

export function SearchBar({
  initialQuery = '',
  autoFocus = false,
  onSubmitted,
}: {
  initialQuery?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    if (query.trim().length < 2) return [];
    return searchProducts(query).slice(0, 5);
  }, [query]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const submit = (value: string) => {
    const term = value.trim();
    if (!term) return;
    setOpen(false);
    onSubmitted?.();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submit(query);
        }}
      >
        <label htmlFor="site-search" className="sr-only">
          Search products, categories or stores
        </label>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 dark:text-ink-500"
          aria-hidden
        />
        <input
          id="site-search"
          type="search"
          value={query}
          autoFocus={autoFocus}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search for rice, oil, milk, chicken…"
          className="h-11 w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850 pl-10 pr-10 text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 transition-colors hover:border-ink-300 dark:hover:border-ink-600 focus-ring shadow-xs"
          autoComplete="off"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 dark:text-ink-500 transition-colors hover:bg-ink-100 dark:hover:bg-ink-700 hover:text-ink-700 dark:hover:text-ink-200 focus-ring"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </form>

      {open && query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 animate-fade-in overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850 shadow-pop">
          {suggestions.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto py-1 divide-y divide-ink-100 dark:divide-ink-800">
              {suggestions.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onSubmitted?.();
                      router.push(`/product/${product.slug}`);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-ink-50 dark:hover:bg-ink-750 focus-ring"
                  >
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-ink-100 dark:bg-ink-800">
                      <SmartImage
                        src={product.image}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink-900 dark:text-ink-50">
                        {product.name}
                      </span>
                      <span className="block truncate text-xs text-ink-400 dark:text-ink-400">
                        {product.store} · {product.unit}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-ink-900 dark:text-ink-50">
                      {formatPrice(product.price)}
                    </span>
                  </button>
                </li>
              ))}
              <li className="border-t border-ink-100 dark:border-ink-800">
                <button
                  type="button"
                  onClick={() => submit(query)}
                  className="w-full px-3 py-2.5 text-left text-sm font-semibold text-brand-600 dark:text-brand-400 transition-colors hover:bg-brand-50 dark:hover:bg-brand-950/60 focus-ring"
                >
                  See all results for “{query.trim()}” →
                </button>
              </li>
            </ul>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-ink-500 dark:text-ink-400">
              No products found for “{query.trim()}”
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
