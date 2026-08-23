import Link from 'next/link';
import { Compass } from 'lucide-react';
import { categories } from '@/data/categories';
import { buttonStyles } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-lg text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
          <Compass className="h-8 w-8" aria-hidden />
        </span>
        <h1 className="mt-5 text-3xl font-bold text-ink-900 dark:text-ink-50">Page not found</h1>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
          The page you are looking for does not exist, or the product may no longer be
          available. Try searching again or start from the homepage.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className={buttonStyles('primary', 'lg')}>
            Back to home
          </Link>
          <Link href="/deals" className={buttonStyles('outline', 'lg')}>
            See today&apos;s deals
          </Link>
        </div>

        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Popular categories
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.slice(0, 6).map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="rounded-full border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3.5 py-1.5 text-sm text-ink-700 dark:text-ink-200 transition-colors hover:border-brand-200 dark:hover:border-brand-800 hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-700 focus-ring"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
