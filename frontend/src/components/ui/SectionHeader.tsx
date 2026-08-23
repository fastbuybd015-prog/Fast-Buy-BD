import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="section-title">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>
        ) : null}
      </div>

      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="inline-flex shrink-0 items-center gap-1 rounded-md text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 focus-ring"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
