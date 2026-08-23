import { cn } from '@/lib/utils';
import * as React from 'react';

const alertVariants = {
  default: 'bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-100 border-ink-200 dark:border-ink-800',
  brand: 'bg-brand-50/70 dark:bg-brand-950/50 text-brand-900 dark:text-brand-200 border-brand-200 dark:border-brand-800 [&>svg]:text-brand-600 dark:[&>svg]:text-brand-400',
  destructive:
    'border-red-200 dark:border-red-800 bg-red-50/70 dark:bg-red-950/50 text-red-900 dark:text-red-200 [&>svg]:text-red-600 dark:[&>svg]:text-red-400',
  success:
    'border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400',
  warning:
    'border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400',
};

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: keyof typeof alertVariants;
  }
>(({ className, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(
      'relative w-full rounded-card border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-ink-900 dark:[&>svg]:text-ink-100',
      alertVariants[variant],
      className,
    )}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-semibold leading-none tracking-tight text-sm', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-xs sm:text-sm [&_p]:leading-relaxed text-inherit opacity-90', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
