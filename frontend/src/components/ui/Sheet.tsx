'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import * as React from 'react';

const sheetSides = {
  top: 'inset-x-0 top-0 border-b animate-slide-down max-h-[80vh]',
  bottom: 'inset-x-0 bottom-0 border-t animate-slide-up max-h-[85vh]',
  left: 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r animate-slide-right',
  right: 'inset-y-0 right-0 h-full w-3/4 max-w-md border-l animate-slide-left',
};

export function Sheet({
  open,
  onClose,
  title,
  description,
  side = 'right',
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  side?: keyof typeof sheetSides;
  children: React.ReactNode;
  className?: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-ink-950/40 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed z-50 flex flex-col bg-white p-6 shadow-2xl transition ease-in-out',
          sheetSides[side],
          className,
        )}
      >
        <div className="flex items-center justify-between pb-4 border-b border-ink-100">
          <div>
            {title && (
              <h2 className="text-base font-semibold text-ink-900">{title}</h2>
            )}
            {description && (
              <p className="text-xs text-ink-500 mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition-colors"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pt-4">{children}</div>
      </div>
    </div>
  );
}
