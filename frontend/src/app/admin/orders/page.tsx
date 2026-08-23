'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  Eye,
  Filter,
  Search,
  RefreshCw,
  Store as StoreIcon,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ordersApi } from '@/lib/api/orders';
import { useToast } from '@/context/toast-context';
import type { Order, OrderStatus } from '@/types';

const STATUS_OPTIONS: OrderStatus[] = [
  'PENDING_PAYMENT',
  'PAYMENT_SUBMITTED',
  'PAYMENT_VERIFIED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

export default function AdminOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Status Change Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('PROCESSING');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await ordersApi.getOrders();
      setOrders(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      await ordersApi.updateOrderStatus(
        selectedOrder.id,
        newStatus,
        statusNote || `Status updated to ${newStatus} by Admin`,
        'Admin',
      );
      showToast(`Order status updated to ${newStatus}`, 'success');
      setSelectedOrder(null);
      fetchOrders();
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.orderStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.orderNumber?.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.delivery.fullName.toLowerCase().includes(q) ||
        o.delivery.phone.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50 tracking-tight">Platform Orders Management</h1>
          <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 mt-1">
            Fulfillment lifecycle control, merchant assignment, and courier status overrides
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 text-xs font-semibold text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 dark:bg-ink-950 shadow-xs dark:shadow-none"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Orders
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex flex-wrap gap-1.5">
          {['ALL', 'PENDING_PAYMENT', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-brand-600 text-white shadow-xs dark:shadow-none'
                  : 'bg-ink-100 dark:bg-ink-850 text-ink-700 dark:text-ink-200 hover:bg-ink-200'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order ID or customer..."
            className="w-full rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 py-2 pl-9 pr-4 text-xs text-ink-900 dark:text-ink-50 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Orders Table */}
      <Card className="border-ink-100 dark:border-ink-800 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 text-center text-xs text-ink-500 dark:text-ink-400">Loading platform orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-16 text-center text-xs text-ink-400">No orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-ink-100 dark:border-ink-800 bg-ink-50/60 dark:bg-ink-950/60 text-ink-500 dark:text-ink-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Placed At</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items / Store</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Fulfillment Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-ink-50/50 dark:hover:bg-ink-800/50 dark:bg-ink-950/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-ink-900 dark:text-ink-50">
                        {ord.orderNumber || ord.id}
                      </td>
                      <td className="py-3.5 px-4 text-ink-500 dark:text-ink-400">
                        {new Date(ord.placedAt).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-ink-900 dark:text-ink-50">
                        <div>{ord.delivery.fullName}</div>
                        <div className="text-[11px] text-ink-400">{ord.delivery.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-ink-600 dark:text-ink-300">
                        <div className="truncate max-w-xs">{ord.items.map((i) => i.name).join(', ')}</div>
                        <div className="text-[11px] text-brand-700 font-semibold mt-0.5">
                          {ord.items[0]?.store || 'Fast Mart'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-ink-900 dark:text-ink-50 text-sm">
                        ৳{ord.total.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge tone={ord.paymentStatus === 'VERIFIED' ? 'success' : 'warning'}>
                          {ord.paymentStatus}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge tone="brand">{ord.orderStatus.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(ord);
                            setNewStatus(ord.orderStatus);
                            setStatusNote('');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-ink-100 dark:bg-ink-850 text-ink-800 dark:text-ink-100 font-semibold text-[11px] hover:bg-ink-200"
                        >
                          Change Status
                        </button>
                        <Link
                          href={`/orders/${ord.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:text-brand-800"
                        >
                          Track →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Status Modal */}
      <Modal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={`Update Order #${selectedOrder?.orderNumber || selectedOrder?.id}`}
        description="Select the new lifecycle status for this customer order"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-200 mb-1">Select Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
              className="w-full rounded-xl border border-ink-200 dark:border-ink-800 p-2.5 text-xs font-semibold bg-white dark:bg-ink-900 focus:border-brand-500 focus:outline-none"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-200 mb-1">
              Internal / Customer Audit Note
            </label>
            <input
              type="text"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="e.g. Courier rider picked up package at Fast Mart"
              className="w-full rounded-xl border border-ink-200 dark:border-ink-800 p-2.5 text-xs focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="flex-1 rounded-xl border border-ink-200 dark:border-ink-800 py-2.5 text-xs font-semibold text-ink-700 dark:text-ink-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdateStatus}
              disabled={updating}
              className="flex-1 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white hover:bg-brand-700"
            >
              {updating ? 'Updating...' : 'Save Status Update'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
