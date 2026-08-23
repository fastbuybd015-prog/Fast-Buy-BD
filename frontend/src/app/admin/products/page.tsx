'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  Store as StoreIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { SmartImage } from '@/components/ui/SmartImage';
import { enrichedProducts } from '@/lib/api/products';
import { useToast } from '@/context/toast-context';
import type { Product } from '@/types';

export default function AdminProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>(enrichedProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('grocery');
  const [unit, setUnit] = useState('1 kg');
  const [price, setPrice] = useState(250);
  const [originalPrice, setOriginalPrice] = useState(280);
  const [image, setImage] = useState(
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60',
  );

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('grocery');
    setUnit('1 kg');
    setPrice(250);
    setOriginalPrice(280);
    setModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setCategory(prod.category);
    setUnit(prod.unit);
    setPrice(prod.price);
    setOriginalPrice(prod.originalPrice);
    setImage(prod.image);
    setModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price <= 0) {
      showToast('Please provide valid product details', 'warning');
      return;
    }

    if (editingProduct) {
      // Edit
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name,
                category,
                unit,
                price,
                originalPrice,
                discount:
                  originalPrice > price
                    ? Math.round(((originalPrice - price) / originalPrice) * 100)
                    : 0,
                image,
              }
            : p,
        ),
      );
      showToast('Product updated successfully!', 'success');
    } else {
      // Create
      const newSlug = name.toLowerCase().replace(/\s+/g, '-');
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name,
        slug: newSlug,
        category,
        store: 'Fast Mart',
        storeId: 'store-fast-mart',
        storeSlug: 'fast-mart',
        image,
        gallery: [image],
        price,
        originalPrice,
        discount:
          originalPrice > price
            ? Math.round(((originalPrice - price) / originalPrice) * 100)
            : 0,
        rating: 4.9,
        reviews: 1,
        unit,
        description: `${name} available for express delivery across Dhaka.`,
        tags: [category, 'fresh'],
        available: true,
        popular: false,
        stock: 50,
      };

      setProducts([newProd, ...products]);
      showToast('New canonical product created and live in catalog!', 'success');
    }
    setModalOpen(false);
  };

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.slug.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50 tracking-tight">Platform Catalog Management</h1>
          <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 mt-1">
            Control canonical products, store listings, and price transparency rules
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-xs font-semibold text-white hover:bg-brand-700 shadow-xs dark:shadow-none"
        >
          <Plus className="h-4 w-4" />
          Add New Product
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex flex-wrap gap-1.5">
          {['ALL', 'grocery', 'packaged-food', 'snacks', 'beverages', 'household'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                categoryFilter === cat
                  ? 'bg-brand-600 text-white shadow-xs dark:shadow-none'
                  : 'bg-ink-100 dark:bg-ink-850 text-ink-700 dark:text-ink-200 hover:bg-ink-200'
              }`}
            >
              {cat.replace(/-/g, ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product catalog..."
            className="w-full rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 py-2 pl-9 pr-4 text-xs text-ink-900 dark:text-ink-50 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Products Table */}
      <Card className="border-ink-100 dark:border-ink-800 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ink-100 dark:border-ink-800 bg-ink-50/60 dark:bg-ink-950/60 text-ink-500 dark:text-ink-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Selling Price</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Store Listings</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-ink-50/50 dark:hover:bg-ink-800/50 dark:bg-ink-950/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-10 w-10 rounded-md bg-ink-50 dark:bg-ink-950 overflow-hidden shrink-0">
                          <SmartImage src={prod.image} alt={prod.name} fill sizes="40px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-ink-900 dark:text-ink-50 truncate max-w-xs">{prod.name}</div>
                          <div className="text-[10px] text-ink-400 font-mono">{prod.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize text-ink-700 dark:text-ink-200">{prod.category.replace(/-/g, ' ')}</td>
                    <td className="py-3 px-4 text-ink-600 dark:text-ink-300">{prod.unit}</td>
                    <td className="py-3 px-4 font-bold text-ink-900 dark:text-ink-50 text-sm">৳{prod.price}</td>
                    <td className="py-3 px-4">
                      {prod.discount > 0 ? (
                        <Badge tone="deal">-{prod.discount}%</Badge>
                      ) : (
                        <span className="text-ink-400 text-[11px]">Regular</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-brand-700 font-semibold">
                        {prod.storeListings?.length || 1} Stores
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge tone={prod.available ? 'success' : 'destructive'}>
                        {prod.available ? 'Active' : 'Unavailable'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEditModal(prod)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-ink-100 dark:bg-ink-850 text-ink-800 dark:text-ink-100 font-semibold text-[11px] hover:bg-ink-200"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Product Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? `Edit ${editingProduct.name}` : 'Add New Canonical Product'}
        description="Configure product name, category, unit, and default pricing"
        size="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-200 mb-1">Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. PRAN Pure Mustard Oil"
              className="w-full rounded-xl border border-ink-200 dark:border-ink-800 p-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-700 dark:text-ink-200 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-ink-200 dark:border-ink-800 p-2.5 text-xs font-medium bg-white dark:bg-ink-900 focus:border-brand-500 focus:outline-none capitalize"
              >
                <option value="grocery">Grocery & Staples</option>
                <option value="packaged-food">Packaged Foods</option>
                <option value="snacks">Snacks & Bakery</option>
                <option value="beverages">Beverages</option>
                <option value="household">Household</option>
                <option value="personal-care">Personal Care</option>
                <option value="frozen-food">Frozen Foods</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-700 dark:text-ink-200 mb-1">Unit / Size</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. 1 L or 5 kg"
                className="w-full rounded-xl border border-ink-200 dark:border-ink-800 p-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-700 dark:text-ink-200 mb-1">Selling Price (৳)</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full rounded-xl border border-ink-200 dark:border-ink-800 p-2.5 text-xs font-bold focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-700 dark:text-ink-200 mb-1">Original Price (৳)</label>
              <input
                type="number"
                required
                value={originalPrice}
                onChange={(e) => setOriginalPrice(Number(e.target.value))}
                className="w-full rounded-xl border border-ink-200 dark:border-ink-800 p-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-200 mb-1">Image URL</label>
            <input
              type="url"
              required
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-ink-200 dark:border-ink-800 p-2.5 text-xs font-mono focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 rounded-xl border border-ink-200 dark:border-ink-800 py-2.5 text-xs font-semibold text-ink-700 dark:text-ink-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white hover:bg-brand-700"
            >
              {editingProduct ? 'Save Changes' : 'Publish Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
