'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Clock,
  CheckCircle2,
  ChevronRight,
  Truck,
  AlertCircle,
  ExternalLink,
  Store as StoreIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ordersApi } from '@/lib/api/orders';
import type { Order, OrderStatus } from '@/types';

function getStatusBadgeTone(status: OrderStatus) {
  switch (status) {
    case 'DELIVERED':
      return 'success';
    case 'CANCELLED':
    case 'REFUNDED':
      return 'destructive';
    case 'PENDING_PAYMENT':
      return 'warning';
    default:
      return 'brand';
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function load() {
      try {
        const res = await ordersApi.getOrders();
        setOrders(res);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (filter === 'active') {
      return !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.orderStatus);
    }
    if (filter === 'delivered') {
      return o.orderStatus === 'DELIVERED';
    }
    return true;
  });

  return (
    <div className="container-page py-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Your Orders</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            Track real-time status, payments, and delivery timelines
          </p>
        </div>

        {/* Filter buttons */}
        <div className="inline-flex rounded-xl bg-ink-100 dark:bg-ink-800 p-1">
          {['all', 'active', 'delivered'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === f ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50 shadow-xs' : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-800">
          <Clock className="h-8 w-8 text-brand-600 animate-spin mb-3" />
          <p className="text-sm text-ink-600 dark:text-ink-400">Loading your orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-800 text-center">
          <div className="rounded-full bg-ink-50 dark:bg-ink-800 p-4 mb-3 text-ink-400">
            <Package className="h-8 w-8" />
          </div>
          <h3 className="text-base font-semibold text-ink-900 dark:text-ink-50 mb-1">No orders found</h3>
          <p className="text-sm text-ink-500 dark:text-ink-400 max-w-xs mb-5">
            You haven&apos;t placed any orders matching this filter yet.
          </p>
          <Link
            href="/search"
            className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-xs"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredOrders.map((order) => {
            const placedDate = new Date(order.placedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <Card
                key={order.id}
                className="border-ink-100 dark:border-ink-800 hover:border-brand-300 dark:hover:border-brand-700 transition-all shadow-xs"
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-ink-100 dark:border-ink-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-ink-900 dark:text-ink-50">
                        {order.orderNumber || order.id}
                      </span>
                      <span className="text-xs text-ink-400">• Placed on {placedDate}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge tone={getStatusBadgeTone(order.orderStatus)}>
                        {order.orderStatus.replace(/_/g, ' ')}
                      </Badge>
                      <Badge tone={order.paymentStatus === 'VERIFIED' ? 'success' : 'warning'}>
                        {order.paymentStatus}
                      </Badge>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="text-xs font-semibold text-ink-600 dark:text-ink-400 uppercase tracking-wider">
                        Items Summary
                      </div>
                      <div className="text-sm text-ink-900 dark:text-ink-100 font-medium line-clamp-1">
                        {order.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                      </div>
                      <div className="text-xs text-ink-500 dark:text-ink-400 flex items-center gap-1.5">
                        <StoreIcon className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                        <span>Fulfillment: {order.items[0]?.store || 'Fast Mart'}</span>
                        <span>•</span>
                        <span>{order.delivery.area}, {order.delivery.city}</span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-xs text-ink-500 dark:text-ink-400">Total Amount</div>
                      <div className="text-lg font-bold text-ink-900 dark:text-ink-50">
                        ৳{order.total.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-3 border-t border-ink-100 dark:border-ink-800 flex items-center justify-between">
                    <span className="text-xs text-ink-500 dark:text-ink-400">
                      Payment via {order.paymentMethod.toUpperCase()}
                      {order.transactionId && ` (TrxID: ${order.transactionId})`}
                    </span>

                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-800"
                    >
                      Track Order Timeline
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
