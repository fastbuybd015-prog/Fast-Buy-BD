import type { ButtonHTMLAttributes } from 'react';
import { classNames } from '@/lib/format';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300 shadow-xs',
  accent:
    'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 disabled:bg-accent-300 shadow-xs',
  secondary:
    'bg-brand-50 dark:bg-brand-950/60 border border-brand-200/80 dark:border-brand-800/80 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900 active:bg-brand-200 dark:active:bg-brand-800 disabled:text-brand-300',
  outline:
    'border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 text-ink-700 dark:text-ink-200 hover:border-ink-300 dark:hover:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-950 active:bg-ink-100 dark:active:bg-ink-850 disabled:text-ink-300 dark:disabled:text-ink-600 shadow-2xs',
  ghost:
    'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 active:bg-ink-200 dark:active:bg-ink-700 disabled:text-ink-300 dark:disabled:text-ink-600',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-xs font-semibold gap-1.5 rounded-xl',
  md: 'h-11 px-4 text-sm font-semibold gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base font-bold gap-2 rounded-xl',
};

export function buttonStyles(variant: Variant = 'primary', size: Size = 'md'): string {
  return classNames(
    'inline-flex items-center justify-center font-medium transition-colors duration-150 focus-ring disabled:cursor-not-allowed',
    VARIANTS[variant],
    SIZES[size],
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={classNames(
        buttonStyles(variant, size),
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  );
}
