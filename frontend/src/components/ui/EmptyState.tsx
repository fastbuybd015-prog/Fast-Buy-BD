import Link from 'next/link';
import { buttonStyles } from '@/components/ui/Button';

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 px-6 py-14 text-center transition-colors">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 dark:bg-ink-800 text-ink-400 dark:text-ink-400">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink-900 dark:text-ink-50">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-500 dark:text-ink-400">{description}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className={`${buttonStyles('primary', 'md')} mt-5`}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
