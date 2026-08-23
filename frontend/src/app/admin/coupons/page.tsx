'use client';

import { useState, useEffect } from 'react';
import { Tag, Plus, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { adminApi } from '@/lib/api/admin';
import { useToast } from '@/context/toast-context';
import type { Coupon } from '@/types';

export default function AdminCouponsPage() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('fixed');
  const [value, setValue] = useState(100);
  const [minimumOrder, setMinimumOrder] = useState(800);
  const [expiresAt, setExpiresAt] = useState('2026-12-31');

  const fetchCoupons = async () => {
    try {
      const res = await adminApi.getCoupons();
      setCoupons(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || value <= 0) {
      showToast('Please enter valid coupon details', 'warning');
      return;
    }

    const newCoupon: Coupon = {
      id: `coup-${Date.now()}`,
      code: code.toUpperCase().trim(),
      type,
      value,
      minimumOrder,
      expiresAt,
      isActive: true,
      usageCount: 0,
    };

    setCoupons([newCoupon, ...coupons]);
    showToast(`Coupon ${newCoupon.code} is now live!`, 'success');
    setModalOpen(false);
    setCode('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50 tracking-tight">Coupons & Discount Promotions</h1>
          <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 mt-1">
            Create and monitor checkout promotion codes for platform-wide or category discounts
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-xs font-semibold text-white hover:bg-brand-700 shadow-xs dark:shadow-none"
        >
          <Plus className="h-4 w-4" />
          Create Promo Code
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coupons.map((coupon) => (
          <Card key={coupon.id} className="border-ink-100 dark:border-ink-800">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-brand-50 text-brand-700">
                    <Tag className="h-4 w-4" />
                  </div>
                  <span className="font-mono font-bold text-base text-ink-900 dark:text-ink-50">{coupon.code}</span>
                </div>
                <Badge tone={coupon.isActive ? 'success' : 'muted'}>
                  {coupon.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="space-y-1.5 py-3 border-y border-ink-100 dark:border-ink-800 text-xs text-ink-600 dark:text-ink-300">
                <div className="flex justify-between">
                  <span>Discount Value</span>
                  <span className="font-bold text-brand-700">
                    {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `৳${coupon.value} Flat OFF`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Min Order Threshold</span>
                  <span>৳{coupon.minimumOrder}</span>
                </div>
                <div className="flex justify-between">
                  <span>Usage Count</span>
                  <span>{coupon.usageCount} times redeemed</span>
                </div>
                <div className="flex justify-between">
                  <span>Expiry Date</span>
                  <span>{coupon.expiresAt}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Coupon Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Promo Coupon"
        description="Set promo code rules and minimum cart criteria"
      >
        <form onSubmit={handleCreateCoupon} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-200 mb-1">Coupon Code</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. EID50"
              className="w-full rounded-xl border border-ink-200 dark:border-ink-800 p-2.5 text-xs font-mono font-bold focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-700 dark:text-ink-200 mb-1">Discount Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'percentage' | 'fixed')}
                className="w-full rounded-xl border border-ink-200 dark:border-ink-800 p-2.5 text-xs font-medium bg-white dark:bg-ink-900 focus:border-brand-500 focus:outline-none"
              >
                <option value="fixed">Flat Amount (৳)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-700 dark:text-ink-200 mb-1">Discount Value</label>
              <input
                type="number"
                required
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full rounded-xl border border-ink-200 dark:border-ink-800 p-2.5 text-xs font-bold focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-700 dark:text-ink-200 mb-1">Minimum Order (৳)</label>
              <input
                type="number"
                required
                value={minimumOrder}
                onChange={(e) => setMinimumOrder(Number(e.target.value))}
                className="w-full rounded-xl border border-ink-200 dark:border-ink-800 p-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-700 dark:text-ink-200 mb-1">Expiry Date</label>
              <input
                type="date"
                required
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full rounded-xl border border-ink-200 dark:border-ink-800 p-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none"
              />
            </div>
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
              Publish Coupon
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
