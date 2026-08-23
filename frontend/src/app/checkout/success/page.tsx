'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, MapPin, Package, Receipt, ArrowRight } from 'lucide-react';
import type { Order } from '@/types';
import { STORAGE_KEYS, readStorage } from '@/lib/storage';
import { SmartImage } from '@/components/ui/SmartImage';
import { EmptyState } from '@/components/ui/EmptyState';
import { buttonStyles } from '@/components/ui/Button';
import { formatDateTime, formatPrice } from '@/lib/format';

const PAYMENT_LABELS: Record<string, string> = {
  bkash: 'bKash Mobile Payment',
  nagad: 'Nagad Mobile Payment',
  rocket: 'Rocket Mobile Payment',
  cod: 'Cash on delivery (COD)',
  card: 'Card payment (demo)',
  mobile: 'Mobile payment (demo)',
};

export default function OrderSuccessPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setOrder(readStorage<Order | null>(STORAGE_KEYS.lastOrder, null));
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto h-64 max-w-2xl animate-pulse rounded-card bg-white dark:bg-ink-900" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-page py-10">
        <EmptyState
          icon={<Receipt className="h-6 w-6" aria-hidden />}
          title="No recent order found"
          description="Once you place an order, the confirmation and live tracking will appear here."
          actionLabel="Start shopping"
          actionHref="/search"
        />
      </div>
    );
  }

  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="container-page py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center rounded-card border border-brand-100 dark:border-brand-900/60 bg-brand-50 dark:bg-brand-950/60 px-6 py-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white">
            <CheckCircle2 className="h-8 w-8" aria-hidden />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-ink-900 dark:text-ink-50 sm:text-3xl">
            Order placed successfully
          </h1>
          <p className="mt-2 max-w-md text-sm text-ink-600 dark:text-ink-300">
            Thank you, {order.delivery.fullName.split(' ')[0]}. We have confirmed your order. Track
            live fulfillment milestones below.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-lg bg-white dark:bg-ink-800 px-4 py-2 text-sm shadow-sm">
              Order ID <strong className="font-semibold text-ink-900 dark:text-ink-50">{order.id}</strong>
            </span>
            <span className="rounded-lg bg-white dark:bg-ink-800 px-4 py-2 text-sm shadow-sm">
              Total <strong className="font-semibold text-ink-900 dark:text-ink-50">{formatPrice(order.total)}</strong>
            </span>
          </div>

          <div className="mt-6">
            <Link
              href={`/orders/${order.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-brand-700 transition-colors"
            >
              Track Live Delivery Status
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <InfoCard
            icon={<Clock className="h-4 w-4 text-brand-600" aria-hidden />}
            label="Placed on"
            value={formatDateTime(order.placedAt)}
          />
          <InfoCard
            icon={<Package className="h-4 w-4 text-brand-600" aria-hidden />}
            label="Estimated delivery"
            value="Within 30–45 minutes"
          />
          <InfoCard
            icon={<Receipt className="h-4 w-4 text-brand-600" aria-hidden />}
            label="Payment"
            value={PAYMENT_LABELS[order.paymentMethod] || 'Mobile Payment'}
          />
        </div>

        <section className="mt-6 surface-card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900 dark:text-ink-50">
            <MapPin className="h-4 w-4 text-brand-600" aria-hidden />
            Delivery information
          </h2>
          <div className="mt-3 grid gap-2 text-sm text-ink-600 dark:text-ink-300 sm:grid-cols-2">
            <p>
              <span className="text-ink-400">Name: </span>
              {order.delivery.fullName}
            </p>
            <p>
              <span className="text-ink-400">Phone: </span>
              {order.delivery.phone}
            </p>
            <p className="sm:col-span-2">
              <span className="text-ink-400">Address: </span>
              {order.delivery.address}, {order.delivery.area}, {order.delivery.city}
            </p>
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={`/orders/${order.id}`} className={buttonStyles('primary', 'lg')}>
            View Order Timeline
          </Link>
          <Link href="/search" className={buttonStyles('outline', 'lg')}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="surface-card p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-400">
        {icon}
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-ink-900 dark:text-ink-50">{value}</p>
    </div>
  );
}
