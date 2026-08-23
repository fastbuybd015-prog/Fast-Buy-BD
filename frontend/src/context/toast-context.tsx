'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, Info, X, AlertTriangle, AlertCircle } from 'lucide-react';

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

export type ToastInput =
  | (Omit<ToastItem, 'id' | 'variant'> & { variant?: ToastVariant })
  | string;

export interface ToastContextValue {
  showToast: (input: ToastInput, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

const ICON_COLORS: Record<ToastVariant, string> = {
  success: 'text-brand-600',
  info: 'text-ink-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback<ToastContextValue['showToast']>(
    (input, variantArg = 'success') => {
      const id = Date.now() + Math.random();
      let title = '';
      let description: string | undefined = undefined;
      let variant: ToastVariant = variantArg;

      if (typeof input === 'string') {
        title = input;
      } else {
        title = input.title;
        description = input.description;
        variant = input.variant || variantArg;
      }

      setToasts((current) => [...current.slice(-2), { id, title, description, variant }]);
      window.setTimeout(() => dismiss(id), 2800);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const Icon = ICONS[toast.variant] || CheckCircle2;
          const colorClass = ICON_COLORS[toast.variant] || 'text-brand-600';

          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex animate-slide-in-right items-start gap-3 rounded-xl border border-ink-200 bg-white p-3.5 shadow-pop"
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${colorClass}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-0.5 text-xs text-ink-500">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-md p-1 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700 focus-ring"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return context;
}
