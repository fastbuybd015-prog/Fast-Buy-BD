import { Star } from 'lucide-react';
import { classNames } from '@/lib/format';

export function Rating({
  value,
  reviews,
  size = 'sm',
  className,
}: {
  value: number;
  reviews?: number;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span
      className={classNames('inline-flex items-center gap-1', textSize, className)}
      aria-label={`Rated ${value} out of 5${reviews ? ` from ${reviews} reviews` : ''}`}
    >
      <Star className={classNames(iconSize, 'fill-amber-400 text-amber-400')} aria-hidden />
      <span className="font-medium text-ink-700 dark:text-ink-200">{value.toFixed(1)}</span>
      {reviews !== undefined ? (
        <span className="text-ink-400 dark:text-ink-500">({reviews})</span>
      ) : null}
    </span>
  );
}
