'use client';

import { useState, useEffect } from 'react';
import {
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SmartImage } from '@/components/ui/SmartImage';
import { adminApi, type InventoryItem } from '@/lib/api/admin';
import { useToast } from '@/context/toast-context';

export default function AdminInventoryPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeFilter, setStoreFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInventory = async () => {
    try {
      const res = await adminApi.getInventory();
      setItems(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleStockAdjust = async (id: string, delta: number) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    const newStock = Math.max(0, target.stock + delta);

    try {
      await adminApi.updateStock(id, newStock);
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                stock: newStock,
                status: newStock === 0 ? 'OUT_OF_STOCK' : newStock <= i.threshold ? 'LOW_STOCK' : 'IN_STOCK',
              }
            : i,
        ),
      );
      showToast(`Stock updated for ${target.productName} (${newStock} units)`, 'success');
    } catch {
      showToast('Failed to update stock', 'error');
    }
  };

  const filteredItems = items.filter((item) => {
    if (storeFilter !== 'ALL' && item.storeId !== storeFilter) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.productName.toLowerCase().includes(q) ||
        item.storeName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50 tracking-tight">Platform-Wide Inventory</h1>
          <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 mt-1">
            Real-time multi-store stock levels, reserved units, and automated low-stock warnings
          </p>
        </div>

        <button
          type="button"
          onClick={fetchInventory}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 text-xs font-semibold text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 dark:bg-ink-950 shadow-xs dark:shadow-none"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sync Stock
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {/* Status buttons */}
          <div className="inline-flex rounded-lg bg-ink-100 dark:bg-ink-850 p-1">
            {['ALL', 'LOW_STOCK', 'OUT_OF_STOCK', 'IN_STOCK'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-white dark:bg-ink-900 dark:bg-ink-800 text-ink-900 dark:text-ink-50 shadow-xs dark:shadow-none'
                    : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-ink-50'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Store select */}
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="rounded-lg border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 px-3 py-1 text-xs font-semibold text-ink-700 dark:text-ink-200"
          >
            <option value="ALL">All Stores</option>
            <option value="store-fast-mart">Fast Mart</option>
            <option value="store-daily-basket">Daily Basket</option>
            <option value="store-green-valley">Green Valley</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product or store..."
            className="w-full rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 py-2 pl-9 pr-4 text-xs text-ink-900 dark:text-ink-50 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <Card className="border-ink-100 dark:border-ink-800 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink-100 dark:border-ink-800 bg-ink-50/60 dark:bg-ink-950/60 text-ink-500 dark:text-ink-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Store Location</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Available Stock</th>
                  <th className="py-3 px-4">Reserved</th>
                  <th className="py-3 px-4">Threshold</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Stock Adjustment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-ink-50/50 dark:hover:bg-ink-800/50 dark:bg-ink-950/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-10 w-10 rounded-md bg-ink-50 dark:bg-ink-950 overflow-hidden shrink-0">
                          <SmartImage src={item.productImage} alt={item.productName} fill sizes="40px" className="object-cover" />
                        </div>
                        <div className="font-semibold text-ink-900 dark:text-ink-50 truncate max-w-xs">{item.productName}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-brand-700">{item.storeName}</td>
                    <td className="py-3.5 px-4 font-bold text-ink-900 dark:text-ink-50">৳{item.price}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-sm text-ink-900 dark:text-ink-50">{item.stock}</span> units
                    </td>
                    <td className="py-3.5 px-4 text-ink-400 font-mono">{item.reserved}</td>
                    <td className="py-3.5 px-4 text-ink-400 font-mono">{item.threshold}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        tone={
                          item.status === 'IN_STOCK'
                            ? 'success'
                            : item.status === 'LOW_STOCK'
                            ? 'warning'
                            : 'destructive'
                        }
                      >
                        {item.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => handleStockAdjust(item.id, -5)}
                          className="h-7 w-7 rounded-md bg-ink-100 dark:bg-ink-850 flex items-center justify-center text-ink-700 dark:text-ink-200 hover:bg-ink-200 font-bold"
                          title="Decrease 5 units"
                        >
                          -5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStockAdjust(item.id, 10)}
                          className="h-7 w-7 rounded-md bg-brand-50 flex items-center justify-center text-brand-700 hover:bg-brand-100 font-bold"
                          title="Add 10 units"
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStockAdjust(item.id, 50)}
                          className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[10px] hover:bg-emerald-100"
                          title="Restock 50 units"
                        >
                          +50 Restock
                        </button>
                      </div>
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
