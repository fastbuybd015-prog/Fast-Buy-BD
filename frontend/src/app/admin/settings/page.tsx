'use client';

import { useState } from 'react';
import { Settings, Save, ShieldCheck, DollarSign, Truck, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { useToast } from '@/context/toast-context';

export default function AdminSettingsPage() {
  const { showToast } = useToast();

  const [deliveryFee, setDeliveryFee] = useState(60);
  const [freeThreshold, setFreeThreshold] = useState(1000);

  const [bkashNumber, setBkashNumber] = useState('01711-223344');
  const [nagadNumber, setNagadNumber] = useState('01822-334455');
  const [rocketNumber, setRocketNumber] = useState('01933-445566');

  const [supportPhone, setSupportPhone] = useState('09612-345678');
  const [supportEmail, setSupportEmail] = useState('support@fastshopbd.com');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Platform operational settings saved successfully!', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 tracking-tight">System & Platform Settings</h1>
        <p className="text-xs sm:text-sm text-ink-500 mt-1">
          Configure delivery tariffs, verified MFS payment numbers, and customer support channels
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Delivery Rules */}
        <Card className="border-ink-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-ink-900">
              <Truck className="h-5 w-5 text-brand-600" />
              Delivery Fee Engine
            </CardTitle>
            <CardDescription>Configure shipping charges across Dhaka sectors</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1">
                Standard Express Delivery Fee (৳)
              </label>
              <input
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(Number(e.target.value))}
                className="w-full rounded-xl border border-ink-200 p-2.5 text-xs font-bold focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1">
                Free Delivery Cart Minimum (৳)
              </label>
              <input
                type="number"
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(Number(e.target.value))}
                className="w-full rounded-xl border border-ink-200 p-2.5 text-xs font-bold focus:border-brand-500 focus:outline-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Mobile Payment Numbers */}
        <Card className="border-ink-100">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-ink-900">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Verified Mobile Financial Service (MFS) Receivers
            </CardTitle>
            <CardDescription>These official numbers are presented to customers during manual checkout</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-pink-700 mb-1">
                bKash Merchant / Agent
              </label>
              <input
                type="text"
                value={bkashNumber}
                onChange={(e) => setBkashNumber(e.target.value)}
                className="w-full rounded-xl border border-pink-200 bg-pink-50/30 p-2.5 text-xs font-mono font-bold text-ink-900 focus:border-pink-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-orange-700 mb-1">
                Nagad Merchant Number
              </label>
              <input
                type="text"
                value={nagadNumber}
                onChange={(e) => setNagadNumber(e.target.value)}
                className="w-full rounded-xl border border-orange-200 bg-orange-50/30 p-2.5 text-xs font-mono font-bold text-ink-900 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-700 mb-1">
                Rocket Account Number
              </label>
              <input
                type="text"
                value={rocketNumber}
                onChange={(e) => setRocketNumber(e.target.value)}
                className="w-full rounded-xl border border-purple-200 bg-purple-50/30 p-2.5 text-xs font-mono font-bold text-ink-900 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customer Support Channels */}
        <Card className="border-ink-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-ink-900">
              Customer Support Channels
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1">Hotline Phone</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full rounded-xl border border-ink-200 p-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-700 mb-1">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full rounded-xl border border-ink-200 p-2.5 text-xs font-medium focus:border-brand-500 focus:outline-none"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-xs font-semibold text-white hover:bg-brand-700 shadow-md transition-all active:scale-98"
          >
            <Save className="h-4 w-4" />
            Save Platform Settings
          </button>
        </div>
      </form>
    </div>
  );
}
