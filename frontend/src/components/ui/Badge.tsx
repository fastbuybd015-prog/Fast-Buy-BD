import { cn } from '@/lib/utils';
import React from 'react';

export type BadgeTone =
  | 'brand'
  | 'accent'
  | 'neutral'
  | 'muted'
  | 'danger'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'deal'
  | 'outline';

const TONES: Record<BadgeTone, string> = {
  brand: 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/70 dark:text-brand-300 dark:border-brand-800',
  accent: 'bg-accent-500 text-white border-accent-600 dark:bg-accent-600 dark:border-accent-500',
  neutral: 'bg-white text-ink-700 border-ink-200 dark:bg-ink-800 dark:text-ink-200 dark:border-ink-700',
  muted: 'bg-ink-100 text-ink-600 border-transparent dark:bg-ink-800 dark:text-ink-300',
  danger: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800',
  destructive: 'bg-red-500 text-white border-red-600 dark:bg-red-600',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
  warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
  deal: 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-700',
  outline: 'bg-transparent text-ink-700 border-ink-300 dark:text-ink-300 dark:border-ink-700',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({
  children,
  tone = 'neutral',
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-tight transition-colors',
        TONES[tone] || TONES.neutral,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
