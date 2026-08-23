import { classNames } from '@/lib/format';
import { formatPrice } from '@/lib/format';

export function PriceDisplay({
  price,
  originalPrice,
  size = 'md',
  className,
}: {
  price: number;
  originalPrice: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const hasOffer = originalPrice > price;

  const currentSize = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
  }[size];

  const originalSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  return (
    <span className={classNames('inline-flex flex-wrap items-baseline gap-x-2', className)}>
      <span className={classNames('font-bold text-ink-900 dark:text-ink-50', currentSize)}>
        {formatPrice(price)}
      </span>
      {hasOffer ? (
        <span className={classNames('text-ink-400 dark:text-ink-500 line-through', originalSize)}>
          {formatPrice(originalPrice)}
        </span>
      ) : null}
    </span>
  );
}
