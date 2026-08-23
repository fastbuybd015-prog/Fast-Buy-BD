'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, CheckCircle2, Clock, Truck, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ordersApi } from '@/lib/api/orders';
import { useToast } from '@/context/toast-context';
import type { Order, OrderStatus } from '@/types';

export default function StoreOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

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

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await ordersApi.updateOrderStatus(orderId, status, `Updated by merchant store manager`, 'Store');
      showToast(`Order status updated to ${status}`, 'success');
      fetchOrders();
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'PENDING') return ['PROCESSING', 'PAYMENT_VERIFIED'].includes(o.orderStatus);
    if (filter === 'PACKED') return o.orderStatus === 'PACKED';
    if (filter === 'DISPATCHED') return ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.orderStatus);
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Store Fulfillment Orders</h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-1">
            Pick, pack, and handover orders dispatched to your store branch
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-ink-200 bg-white text-xs font-semibold text-ink-700 hover:bg-ink-50 shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Orders
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="inline-flex rounded-xl bg-ink-100 p-1">
        {[
          { id: 'ALL', label: 'All Orders' },
          { id: 'PENDING', label: 'To Pack (Processing)' },
          { id: 'PACKED', label: 'Packed & Awaiting Courier' },
          { id: 'DISPATCHED', label: 'Dispatched / Delivered' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === tab.id
                ? 'bg-white text-ink-900 shadow-xs'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="border-ink-100 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 text-center text-xs text-ink-500">Loading store orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-16 text-center text-xs text-ink-400">No orders in this state.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-ink-100 bg-ink-50/60 text-ink-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer & Location</th>
                    <th className="py-3 px-4">Items Required</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Fulfillment Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-ink-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-ink-900">
                        {ord.orderNumber || ord.id}
                      </td>
                      <td className="py-3.5 px-4 text-ink-500">
                        {new Date(ord.placedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-ink-700">
                        <div className="font-semibold text-ink-900">{ord.delivery.fullName}</div>
                        <div className="text-[11px] text-ink-500">{ord.delivery.area}</div>
                      </td>
                      <td className="py-3.5 px-4 text-ink-600 max-w-xs truncate">
                        {ord.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-ink-900">৳{ord.total}</td>
                      <td className="py-3.5 px-4">
                        <Badge tone="brand">{ord.orderStatus.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {['PROCESSING', 'PAYMENT_VERIFIED'].includes(ord.orderStatus) && (
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
                          <span className="text-[11px] text-emerald-700 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Dispatched
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
