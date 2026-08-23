import { Truck } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { FREE_DELIVERY_THRESHOLD } from '@/lib/constants';

interface Totals {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
}

export function OrderSummary({
  totals,
  itemCount,
  children,
  title = 'Order summary',
}: {
  totals: Totals;
  itemCount: number;
  children?: React.ReactNode;
  title?: string;
}) {
  const payable = totals.total - totals.deliveryFee;
  const amountToFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - payable);
  const progress = Math.min(100, (payable / FREE_DELIVERY_THRESHOLD) * 100);

  return (
    <div className="surface-card p-5">
      <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">{title}</h2>

      <dl className="mt-4 space-y-2.5 text-sm">
        <Row label={`Subtotal (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`} value={formatPrice(totals.subtotal)} />
        <Row
          label="Discount"
          value={totals.discount > 0 ? `− ${formatPrice(totals.discount)}` : formatPrice(0)}
          valueClassName={totals.discount > 0 ? 'text-brand-700 dark:text-brand-400' : undefined}
        />
        <Row
          label="Delivery fee"
          value={totals.deliveryFee === 0 ? 'Free' : formatPrice(totals.deliveryFee)}
          valueClassName={totals.deliveryFee === 0 ? 'text-brand-700 dark:text-brand-400' : undefined}
        />
      </dl>

      <div className="mt-4 flex items-baseline justify-between border-t border-ink-100 dark:border-ink-800 pt-4">
        <span className="text-sm font-semibold text-ink-900 dark:text-ink-100">Total payable</span>
        <span className="text-xl font-bold text-ink-900 dark:text-ink-50">{formatPrice(totals.total)}</span>
      </div>

      {itemCount > 0 ? (
        <div className="mt-4 rounded-xl bg-brand-50 dark:bg-brand-950/60 p-3 border border-brand-100 dark:border-brand-900/40">
          <p className="flex items-center gap-1.5 text-xs font-medium text-brand-800 dark:text-brand-300">
            <Truck className="h-3.5 w-3.5" aria-hidden />
            {amountToFreeDelivery > 0
              ? `Add ${formatPrice(amountToFreeDelivery)} more for free delivery`
              : 'You have unlocked free delivery'}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900">
            <div
              className="h-full rounded-full bg-brand-500 transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

function Row({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-ink-500 dark:text-ink-400">{label}</dt>
      <dd className={`font-medium text-ink-900 dark:text-ink-100 ${valueClassName ?? ''}`}>{value}</dd>
    </div>
  );
}
