'use client';

import { useState, useEffect } from 'react';
import {
  Warehouse,
  Search,
  Plus,
  Minus,
  Edit2,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { SmartImage } from '@/components/ui/SmartImage';
import { storeApi } from '@/lib/api/store';
import { useToast } from '@/context/toast-context';

export default function StoreInventoryPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit price modal
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState(0);
  const [editStock, setEditStock] = useState(0);
  const [editAvailable, setEditAvailable] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await storeApi.getStoreProducts('store-fast-mart');
      setProducts(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleStockDelta = async (productId: string, delta: number) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    const newStock = Math.max(0, target.stock + delta);

    try {
      await storeApi.updateListing('store-fast-mart', productId, {
        price: target.price,
        stock: newStock,
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p)),
      );
      showToast(`Stock updated for ${target.name} (${newStock} units)`, 'success');
    } catch {
      showToast('Failed to update stock', 'error');
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setEditPrice(item.price);
    setEditStock(item.stock);
    setEditAvailable(item.available);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      await storeApi.updateListing('store-fast-mart', editingItem.id, {
        price: editPrice,
        stock: editStock,
        available: editAvailable,
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingItem.id
            ? { ...p, price: editPrice, stock: editStock, available: editAvailable }
            : p,
        ),
      );
      showToast(`Pricing and stock updated for ${editingItem.name}`, 'success');
      setEditingItem(null);
    } catch {
      showToast('Failed to update product', 'error');
    }
  };

  const filtered = products.filter((p) =>
    searchQuery.trim()
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Store Stock & Price Manager</h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-1">
            Control your individual store pricing, offer discounts, and adjust physical stock levels
          </p>
        </div>

        <button
          type="button"
          onClick={fetchProducts}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-ink-200 bg-white text-xs font-semibold text-ink-700 hover:bg-ink-50 shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search store inventory..."
          className="w-full rounded-xl border border-ink-200 bg-white py-2 pl-9 pr-4 text-xs text-ink-900 focus:border-brand-500 focus:outline-none"
        />
      </div>

      {/* Products Table */}
      <Card className="border-ink-100 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink-100 bg-ink-50/60 text-ink-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Your Price (৳)</th>
                  <th className="py-3 px-4">Stock on Hand</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Stock / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-ink-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-10 w-10 rounded-md bg-ink-50 overflow-hidden shrink-0">
                          <SmartImage src={item.image} alt={item.name} fill sizes="40px" className="object-cover" />
                        </div>
                        <div className="font-semibold text-ink-900 truncate max-w-xs">{item.name}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-ink-600">{item.unit}</td>
                    <td className="py-3 px-4 font-bold text-ink-900 text-sm">৳{item.price}</td>
                    <td className="py-3 px-4 font-mono font-bold text-ink-900">{item.stock} units</td>
                    <td className="py-3 px-4">
                      <Badge tone={item.stock > 10 ? 'success' : item.stock > 0 ? 'warning' : 'destructive'}>
                        {item.stock > 10 ? 'In Stock' : item.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => handleStockDelta(item.id, -5)}
                          className="h-7 w-7 rounded-md bg-ink-100 flex items-center justify-center font-bold text-ink-700 hover:bg-ink-200"
                        >
                          -5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStockDelta(item.id, 10)}
                          className="h-7 w-7 rounded-md bg-brand-50 flex items-center justify-center font-bold text-brand-700 hover:bg-brand-100"
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="px-2.5 py-1 rounded-md bg-ink-900 text-white font-semibold text-[11px] hover:bg-ink-800 ml-2"
                        >
                          <Edit2 className="h-3 w-3 inline mr-1" /> Edit Price
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

      {/* Edit Modal */}
      <Modal
        open={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title={`Edit Price & Stock: ${editingItem?.name}`}
        description="Update selling price and quantity for your store"
      >
        <form onSubmit={handleSaveEdit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1">Selling Price (৳)</label>
            <input
              type="number"
              required
              value={editPrice}
              onChange={(e) => setEditPrice(Number(e.target.value))}
              className="w-full rounded-xl border border-ink-200 p-2.5 text-xs font-bold focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1">Physical Stock Units</label>
            <input
              type="number"
              required
              value={editStock}
              onChange={(e) => setEditStock(Number(e.target.value))}
              className="w-full rounded-xl border border-ink-200 p-2.5 text-xs font-bold focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="availCheck"
              checked={editAvailable}
              onChange={(e) => setEditAvailable(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="availCheck" className="text-xs text-ink-700 font-medium">
              Item is actively available for online orders
            </label>
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="flex-1 rounded-xl border border-ink-200 py-2.5 text-xs font-semibold text-ink-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white hover:bg-brand-700"
            >
              Save Listing
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
