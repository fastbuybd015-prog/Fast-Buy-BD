'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Package,
  CreditCard,
  Users,
  Store as StoreIcon,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { adminApi, type AdminStats, type ChartDataPoint } from '@/lib/api/admin';
import { paymentsApi } from '@/lib/api/payments';
import { ordersApi } from '@/lib/api/orders';
import type { Order, PaymentSubmission } from '@/types';

// Recharts components
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PaymentSubmission[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [s, c, p, o] = await Promise.all([
          adminApi.getDashboardStats(),
          adminApi.getRevenueTrend(7),
          paymentsApi.getAdminPayments('SUBMITTED'),
          ordersApi.getOrders(),
        ]);
        setStats(s);
        setChartData(c);
        setPendingPayments(p.slice(0, 3));
        setRecentOrders(o.slice(0, 5));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <Clock className="h-8 w-8 text-brand-600 animate-spin mb-3" />
        <p className="text-sm text-ink-600 dark:text-ink-300">Loading admin operations center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50 tracking-tight">Platform Overview</h1>
          <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 mt-1">
            Real-time multi-store operations, revenue stream, and manual verification queue
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/payments"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-ink-950 shadow-xs dark:shadow-none hover:bg-amber-400 transition-colors"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Review Payments ({pendingPayments.length})
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
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
              <TrendingUp className="h-3 w-3" /> +14.2% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="border-ink-100 dark:border-ink-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                Pending Verification
              </span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-700 mt-2">
              {stats.pendingPaymentsCount} Orders
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">
              Requires bKash / Nagad TrxID review
            </div>
          </CardContent>
        </Card>

        <Card className="border-ink-100 dark:border-ink-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                Total Orders
              </span>
              <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-ink-900 dark:text-ink-50 mt-2">
              {stats.ordersCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-brand-700 font-medium mt-1">
              Across {stats.activeStoresCount} active local stores
            </div>
          </CardContent>
        </Card>

        <Card className="border-ink-100 dark:border-ink-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                Low Stock Alerts
              </span>
              <div className="rounded-lg bg-red-50 p-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-red-600 mt-2">
              {stats.lowStockItemsCount} Items
            </div>
            <div className="text-[11px] text-red-600 font-medium mt-1">
              Below threshold in store inventory
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Chart & Pending Verification Split */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Recharts Revenue Trend Chart */}
        <div className="lg:col-span-8">
          <Card className="border-ink-100 dark:border-ink-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-ink-900 dark:text-ink-50">
                    7-Day Platform Sales Velocity
                  </CardTitle>
                  <CardDescription>Daily gross merchandise value (BDT)</CardDescription>
                </div>
                <Badge tone="brand">Real-Time Sync</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#15803d" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `৳${v / 1000}k`} />
                    <Tooltip
                      formatter={(val: unknown) => [
                        `৳${Number(val).toLocaleString()}`,
                        'Daily Revenue',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#15803d"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Verification Spotlight */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card className="border-ink-100 dark:border-ink-800 flex-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                  Pending Payments
                </CardTitle>
                <Link
                  href="/admin/payments"
                  className="text-xs text-brand-700 font-semibold hover:text-brand-800"
                >
                  View queue →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {pendingPayments.length === 0 ? (
                <div className="p-6 text-center text-xs text-ink-400">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
                  All payments verified!
                </div>
              ) : (
                pendingPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink-900 dark:text-ink-50">{p.orderNumber}</span>
                      <span className="font-bold text-amber-900">৳{p.amount}</span>
                    </div>
                    <div className="text-ink-600 dark:text-ink-300">
                      via <span className="font-semibold uppercase">{p.method}</span> • TrxID:{' '}
                      <span className="font-mono font-bold text-ink-900 dark:text-ink-50">{p.transactionId}</span>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <Link
                        href="/admin/payments"
                        className="text-[11px] font-bold text-brand-700 hover:text-brand-800"
                      >
                        Inspect Proof & Verify →
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Orders Activity Table */}
      <Card className="border-ink-100 dark:border-ink-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-ink-900 dark:text-ink-50">Recent Platform Orders</CardTitle>
              <CardDescription>Live incoming customer transactions</CardDescription>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              All Orders ({stats.ordersCount}) →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink-100 dark:border-ink-800 text-ink-400 uppercase font-semibold">
                <tr>
                  <th className="pb-3">Order ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-ink-50/50 dark:hover:bg-ink-800/50 dark:bg-ink-950/50">
                    <td className="py-3 font-semibold text-ink-900 dark:text-ink-50">{ord.orderNumber || ord.id}</td>
                    <td className="py-3 text-ink-700 dark:text-ink-200">{ord.delivery.fullName}</td>
                    <td className="py-3 text-ink-500 dark:text-ink-400">{ord.items.length} items</td>
                    <td className="py-3 font-bold text-ink-900 dark:text-ink-50">৳{ord.total}</td>
                    <td className="py-3">
                      <Badge tone={ord.paymentStatus === 'VERIFIED' ? 'success' : 'warning'}>
                        {ord.paymentStatus}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge tone="brand">{ord.orderStatus.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/orders/${ord.id}`}
                        className="text-brand-700 font-semibold hover:text-brand-800"
                      >
                        Inspect
                      </Link>
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
