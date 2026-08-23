import { cn } from '@/lib/utils';
import * as React from 'react';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-ink-200/60 dark:bg-ink-800/60', className)}
      {...props}
    />
  );
}
