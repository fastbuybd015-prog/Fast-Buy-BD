import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-ink-500 dark:text-ink-400 sm:text-sm">
        <li>
          <Link href="/" className="rounded-sm transition-colors hover:text-brand-600 focus-ring">
            Home
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-ink-300 dark:text-ink-600" aria-hidden />
            {item.href ? (
              <Link
                href={item.href}
                className="rounded-sm transition-colors hover:text-brand-600 focus-ring"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-ink-900 dark:text-ink-50" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
