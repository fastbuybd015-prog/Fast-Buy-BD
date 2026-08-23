'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Package,
  AlertTriangle,
  Star,
  CheckCircle2,
  Clock,
  TrendingUp,
  Warehouse,
  Truck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { storeApi, type StoreDashboardStats } from '@/lib/api/store';
import { ordersApi } from '@/lib/api/orders';
import { useToast } from '@/context/toast-context';
import type { Order, OrderStatus } from '@/types';

export default function StoreDashboardPage() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<StoreDashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStoreData = async () => {
    try {
      const [s, o] = await Promise.all([storeApi.getStoreStats(), ordersApi.getOrders()]);
      setStats(s);
      setOrders(o.slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, []);

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await ordersApi.updateOrderStatus(orderId, status, `Updated by merchant store manager`, 'Store');
      showToast(`Order updated to ${status}`, 'success');
      fetchStoreData();
    } catch {
      showToast('Failed to update order status', 'error');
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <Clock className="h-8 w-8 text-brand-600 animate-spin mb-3" />
        <p className="text-sm text-ink-600 dark:text-ink-300">Loading store dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50 tracking-tight">{stats.storeName}</h1>
          <Badge tone="success">Active Merchant</Badge>
        </div>
        <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 mt-1">
          Daily sales, stock levels, and store fulfillment queue
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-ink-100 dark:border-ink-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                Today&apos;s Revenue
              </span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-ink-900 dark:text-ink-50 mt-2">
              ৳{stats.todayRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> +11.8% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="border-ink-100 dark:border-ink-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                Pending Packaging
              </span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-700 mt-2">
              {stats.pendingOrders} Orders
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">
              Awaiting counter bagging
            </div>
          </CardContent>
        </Card>

        <Card className="border-ink-100 dark:border-ink-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                Store Rating
              </span>
              <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-ink-900 dark:text-ink-50 mt-2">{stats.averageRating} / 5.0</div>
            <div className="text-[11px] text-brand-700 font-medium mt-1">Verified shopper reviews</div>
          </CardContent>
        </Card>

        <Card className="border-ink-100 dark:border-ink-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                Low Stock Warning
              </span>
              <div className="rounded-lg bg-red-50 p-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-red-600 mt-2">{stats.lowStockCount} Items</div>
            <div className="text-[11px] text-red-600 font-medium mt-1">Restock recommended</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Fulfillment Queue */}
      <Card className="border-ink-100 dark:border-ink-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-ink-900 dark:text-ink-50">
                Store Fulfillment Queue
              </CardTitle>
              <CardDescription>
                Prepare and mark items as packed for courier pickup
              </CardDescription>
            </div>
            <Link
              href="/store-dashboard/orders"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              All Store Orders →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink-100 dark:border-ink-800 bg-ink-50/60 dark:bg-ink-950/60 text-ink-500 dark:text-ink-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer & Location</th>
                  <th className="py-3 px-4">Items Required</th>
                  <th className="py-3 px-4">Order Value</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Fulfillment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-ink-50/50 dark:hover:bg-ink-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-ink-900 dark:text-ink-50">
                      {ord.orderNumber || ord.id}
                    </td>
                    <td className="py-3.5 px-4 text-ink-700 dark:text-ink-200">
                      <div className="font-semibold text-ink-900 dark:text-ink-50">{ord.delivery.fullName}</div>
                      <div className="text-[11px] text-ink-500 dark:text-ink-400">{ord.delivery.area}</div>
                    </td>
                    <td className="py-3.5 px-4 text-ink-600 dark:text-ink-300 max-w-xs truncate">
                      {ord.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-ink-900 dark:text-ink-50">৳{ord.total}</td>
                    <td className="py-3.5 px-4">
                      <Badge tone="brand">{ord.orderStatus.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {ord.orderStatus === 'PROCESSING' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'PACKED')}
                          className="px-3 py-1.5 rounded-lg bg-brand-600 text-white font-semibold text-[11px] hover:bg-brand-700 shadow-xs"
                        >
                          Mark Packed
                        </button>
                      )}
                      {ord.orderStatus === 'PACKED' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'SHIPPED')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700 shadow-xs"
                        >
                          Handover to Courier
                        </button>
                      )}
                      {['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(ord.orderStatus) && (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Dispatched
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
