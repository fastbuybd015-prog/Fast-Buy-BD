'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Plus, Trash2, CheckCircle2, ArrowLeft, Home, Briefcase, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { userApi } from '@/lib/api/user';
import { useToast } from '@/context/toast-context';
import type { Address } from '@/types';

export default function AddressesPage() {
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [label, setLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [area, setArea] = useState('Uttara');
  const [city, setCity] = useState('Dhaka');
  const [isDefault, setIsDefault] = useState(false);

  const fetchAddresses = async () => {
    try {
      const res = await userApi.getAddresses();
      setAddresses(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !phone || !addressLine) {
      showToast('Please fill all required address fields', 'warning');
      return;
    }

    try {
      await userApi.addAddress({
        label,
        recipientName,
        phone,
        addressLine,
        area,
        city,
        isDefault,
      });

      showToast('New delivery address saved!', 'success');
      setModalOpen(false);
      setRecipientName('');
      setPhone('');
      setAddressLine('');
      fetchAddresses();
    } catch {
      showToast('Failed to add address', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await userApi.deleteAddress(id);
      showToast('Address removed', 'info');
      fetchAddresses();
    } catch {
      showToast('Failed to remove address', 'error');
    }
  };

  return (
    <div className="container-page py-8 max-w-4xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <Link
            href="/account"
            className="inline-flex items-center gap-1 text-xs font-semibold text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-200 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Account
          </Link>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Saved Addresses</h1>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Manage your home and work delivery locations in Dhaka
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Address
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-ink-500 dark:text-ink-400">Loading addresses...</div>
      ) : addresses.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-800">
          <MapPin className="h-8 w-8 text-ink-400 dark:text-ink-500 mx-auto mb-2" />
          <h3 className="font-semibold text-ink-900 dark:text-ink-50 text-sm">No saved addresses</h3>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1 mb-4">Add your delivery location for 1-click checkout.</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold"
          >
            Add First Address
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <Card key={addr.id} className="border-ink-100 dark:border-ink-800 hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300">
                      {addr.label === 'Home' ? (
                        <Home className="h-4 w-4" />
                      ) : addr.label === 'Work' ? (
                        <Briefcase className="h-4 w-4" />
                      ) : (
                        <Building className="h-4 w-4" />
                      )}
                    </span>
                    <span className="font-semibold text-sm text-ink-900 dark:text-ink-100">{addr.label}</span>
                  </div>

                  {addr.isDefault && <Badge tone="success">Default</Badge>}
                </div>

                <div className="text-xs text-ink-600 dark:text-ink-400 space-y-1">
                  <div className="font-semibold text-ink-900 dark:text-ink-100">{addr.recipientName}</div>
                  <div>Phone: {addr.phone}</div>
                  <div>{addr.addressLine}</div>
                  <div>
                    {addr.area}, {addr.city}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-ink-100 dark:border-ink-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 font-medium"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Address Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Delivery Address"
        description="Enter recipient and address details for express delivery"
      >
        <form onSubmit={handleAddAddress} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">Address Label</label>
            <div className="flex gap-2">
              {(['Home', 'Work', 'Other'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLabel(l)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    label === l
                      ? 'bg-brand-50 dark:bg-brand-950/70 border-brand-500 text-brand-800 dark:text-brand-300'
                      : 'bg-white dark:bg-ink-850 border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">Recipient Name</label>
            <input
              type="text"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Tanvir Ahmed"
              className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850 p-2.5 text-xs text-ink-900 dark:text-ink-100 font-medium focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">Contact Phone</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 01712345678"
              className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850 p-2.5 text-xs text-ink-900 dark:text-ink-100 font-medium focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">Address Line</label>
            <textarea
              required
              rows={2}
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              placeholder="House, Road, Block/Sector"
              className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850 p-2.5 text-xs text-ink-900 dark:text-ink-100 font-medium focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">Area</label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full rounded-xl border border-ink-200 dark:border-ink-700 p-2.5 text-xs font-medium bg-white dark:bg-ink-850 text-ink-900 dark:text-ink-100 focus:border-brand-500 focus:outline-none"
              >
                <option value="Uttara">Uttara</option>
                <option value="Gulshan">Gulshan</option>
                <option value="Banani">Banani</option>
                <option value="Dhanmondi">Dhanmondi</option>
                <option value="Mirpur">Mirpur</option>
                <option value="Mohammadpur">Mohammadpur</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">City</label>
              <input
                type="text"
                disabled
                value={city}
                className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 p-2.5 text-xs font-medium text-ink-500 dark:text-ink-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="defAddr"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="defAddr" className="text-xs text-ink-700 dark:text-ink-300 font-medium cursor-pointer">
              Set as default delivery address
            </label>
          </div>

          <div className="mt-4 flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 rounded-xl border border-ink-200 dark:border-ink-700 py-2.5 text-xs font-semibold text-ink-700 dark:text-ink-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white hover:bg-brand-700"
            >
              Save Address
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
