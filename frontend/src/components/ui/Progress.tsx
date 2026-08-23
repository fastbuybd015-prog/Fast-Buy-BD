import { cn } from '@/lib/utils';
import * as React from 'react';

export function Progress({
  value = 0,
  max = 100,
  indicatorClassName,
  className,
  ...props
}: {
  value?: number;
  max?: number;
  indicatorClassName?: string;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(
        'relative h-2.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'h-full w-full flex-1 bg-brand-500 transition-all duration-300 ease-in-out',
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  );
}
