'use client';

import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { classNames } from '@/lib/format';

const CONTROL =
  'w-full rounded-lg border bg-white dark:bg-ink-850 px-3 text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 transition-colors focus-ring disabled:bg-ink-50 disabled:dark:bg-ink-950 disabled:text-ink-400';

interface FieldWrapperProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (id: string, invalid: boolean) => React.ReactNode;
  className?: string;
}

export function Field({ label, error, hint, required, children, className }: FieldWrapperProps) {
  const id = useId();
  const invalid = Boolean(error);

  return (
    <div className={classNames('w-full', className)}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200">
        {label}
        {required ? <span className="ml-0.5 text-accent-500">*</span> : null}
      </label>
      {children(id, invalid)}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-400 dark:text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, error, hint, icon, className, required, ...props },
  ref,
) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(id, invalid) => (
        <div className="relative">
          {icon ? (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500">
              {icon}
            </span>
          ) : null}
          <input
            {...props}
            ref={ref}
            id={id}
            required={required}
            aria-invalid={invalid || undefined}
            className={classNames(
              CONTROL,
              'h-11',
              icon ? 'pl-10' : undefined,
              invalid ? 'border-red-400' : 'border-ink-200 dark:border-ink-700 hover:border-ink-300 dark:hover:border-ink-600',
            )}
          />
        </div>
      )}
    </Field>
  );
});

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextArea({ label, error, hint, className, required, ...props }: TextAreaProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(id, invalid) => (
        <textarea
          {...props}
          id={id}
          required={required}
          aria-invalid={invalid || undefined}
          className={classNames(
            CONTROL,
            'min-h-[92px] py-2.5',
            invalid ? 'border-red-400' : 'border-ink-200 dark:border-ink-700 hover:border-ink-300 dark:hover:border-ink-600',
          )}
        />
      )}
    </Field>
  );
}

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  /** Hides the label visually but keeps it for screen readers. */
  hideLabel?: boolean;
  options: Array<{ value: string; label: string }>;
}

export function SelectInput({
  label,
  hideLabel,
  options,
  className,
  ...props
}: SelectInputProps) {
  const id = useId();

  return (
    <div className={classNames('w-full', className)}>
      <label
        htmlFor={id}
        className={classNames(
          'mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-200',
          hideLabel && 'sr-only',
        )}
      >
        {label}
      </label>
      <select
        {...props}
        id={id}
        className={classNames(
          CONTROL,
          'h-11 cursor-pointer border-ink-200 dark:border-ink-700 pr-8 hover:border-ink-300 dark:hover:border-ink-600',
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
