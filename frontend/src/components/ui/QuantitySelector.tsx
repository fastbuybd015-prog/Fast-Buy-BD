'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { classNames } from '@/lib/format';

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 20,
  size = 'md',
  /** Shows a bin icon instead of "−" when the value would drop below `min`. */
  removable = false,
  label = 'Quantity',
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  removable?: boolean;
  label?: string;
}) {
  const box = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const text = size === 'sm' ? 'text-sm w-8' : 'text-base w-10';
  const showRemove = removable && value <= min;

  return (
    <div
      className="inline-flex items-center rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850 shadow-xs"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={!removable && value <= min}
        className={classNames(
          box,
          'flex items-center justify-center rounded-l-xl text-ink-600 dark:text-ink-300 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800 focus-ring disabled:cursor-not-allowed disabled:text-ink-300 dark:disabled:text-ink-600',
        )}
        aria-label={showRemove ? 'Remove item' : 'Decrease quantity'}
      >
        {showRemove ? (
          <Trash2 className="h-4 w-4 text-red-500" aria-hidden />
        ) : (
          <Minus className="h-4 w-4" aria-hidden />
        )}
      </button>

      <span
        className={classNames(
          text,
          'text-center font-semibold tabular-nums text-ink-900 dark:text-ink-50',
        )}
        aria-live="polite"
      >
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className={classNames(
          box,
          'flex items-center justify-center rounded-r-xl text-ink-600 dark:text-ink-300 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800 focus-ring disabled:cursor-not-allowed disabled:text-ink-300 dark:disabled:text-ink-600',
        )}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
