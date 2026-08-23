'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Banknote, CreditCard, ShoppingBag, Smartphone, ShieldCheck, Lock, LogIn, UserCheck } from 'lucide-react';
import type { DeliveryDetails, Order, PaymentMethod } from '@/types';
import { useCart } from '@/context/cart-context';
import { useUser } from '@/context/user-context';
import { OrderSummary } from '@/components/cart/OrderSummary';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { SelectInput, TextArea, TextInput } from '@/components/ui/Field';
import { SmartImage } from '@/components/ui/SmartImage';
import { ordersApi } from '@/lib/api/orders';
import { STORAGE_KEYS, writeStorage } from '@/lib/storage';
import { classNames, formatPrice } from '@/lib/format';
import { useToast } from '@/context/toast-context';

const CITIES = [
  { value: 'Dhaka', label: 'Dhaka' },
  { value: 'Chattogram', label: 'Chattogram' },
  { value: 'Sylhet', label: 'Sylhet' },
  { value: 'Rajshahi', label: 'Rajshahi' },
  { value: 'Khulna', label: 'Khulna' },
];

const PAYMENT_METHODS: Array<{
  id: PaymentMethod;
  label: string;
  caption: string;
  badge?: string;
  icon: typeof Banknote;
}> = [
  {
    id: 'bkash',
    label: 'bKash / Nagad / Rocket (Mobile Payment)',
    caption: 'Pay externally and submit your Transaction ID (TrxID)',
    badge: 'Popular',
    icon: Smartphone,
  },
  {
    id: 'cod',
    label: 'Cash on Delivery (COD)',
    caption: 'Pay the express courier rider when your order arrives',
    icon: Banknote,
  },
];

type FormErrors = Partial<Record<keyof DeliveryDetails, string>>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, itemCount, totals, hydrated, clearCart } = useCart();
  const { user, login } = useUser();
  const { showToast } = useToast();

  const [form, setForm] = useState<DeliveryDetails>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: 'Dhaka',
    area: '',
    note: '',
  });
  const [payment, setPayment] = useState<PaymentMethod>('bkash');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      fullName: current.fullName || user.name,
      email: current.email || user.email,
      phone: current.phone || user.phone || '',
      address: current.address || user.address || '',
    }));
  }, [user]);

  const update = (field: keyof DeliveryDetails, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (form.fullName.trim().length < 3) next.fullName = 'Please enter your full name';
    if (!/^01[3-9]\d{8}$/.test(form.phone.trim()))
      next.phone = 'Enter a valid 11 digit number, e.g. 01712345678';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = 'Enter a valid email address';
    if (form.address.trim().length < 8)
      next.address = 'Enter the house, road and sector';
    if (form.area.trim().length < 2) next.area = 'Enter your area or thana';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleQuickLogin = () => {
    login({ email: 'tanvir@fastshop.com', role: 'CUSTOMER' });
    showToast('Signed in as Tanvir (Shopper). You can now place your order!', 'success');
  };

  const placeOrder = async (event: React.FormEvent) => {
    event.preventDefault();

    // Check login requirement
    if (!user) {
      showToast('You must be logged in to place an order. Please log in or sign up.', 'warning');
      return;
    }

    if (!validate()) {
      document.querySelector('[aria-invalid="true"]')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      return;
    }

    setSubmitting(true);

    try {
      const createdOrder = await ordersApi.createOrder({
        items,
        delivery: form,
        paymentMethod: payment,
        subtotal: totals.subtotal,
        discount: totals.discount,
        deliveryFee: totals.deliveryFee,
        total: totals.total,
      });

      writeStorage(STORAGE_KEYS.lastOrder, createdOrder);
      clearCart();
      showToast('Order successfully created!', 'success');
      router.push(`/orders/${createdOrder.id}`);
    } catch {
      showToast('Failed to place order. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (hydrated && items.length === 0) {
    return (
      <div className="container-page py-6">
        <Breadcrumbs items={[{ label: 'Checkout' }]} />
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" aria-hidden />}
          title="There is nothing to check out"
          description="Add a few products to your cart first — it only takes a minute."
          actionLabel="Browse products"
          actionHref="/search"
        />
      </div>
    );
  }

  return (
    <div className="container-page py-6 max-w-6xl">
      <Breadcrumbs items={[{ label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} />

      <h1 className="mb-6 text-2xl font-bold text-ink-900 dark:text-ink-50 sm:text-3xl">Checkout</h1>

      {/* Login Required Notice if user is a guest */}
      {!user && (
        <div className="mb-6 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 p-4 sm:p-5 text-ink-900 dark:text-ink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/20 p-2.5 text-amber-700 dark:text-amber-400 shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-ink-900 dark:text-ink-50">
                Account Login Required to Place Order
              </h3>
              <p className="text-xs text-ink-600 dark:text-ink-400 mt-0.5">
                Sign in with your customer account to confirm your delivery address and receive live SMS tracking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleQuickLogin}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-700 transition-all"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Quick Demo Login
            </button>
            <Link
              href="/login?redirect=/checkout"
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-800 px-3.5 py-2 text-xs font-semibold text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-700"
            >
              <LogIn className="h-3.5 w-3.5" />
              Login / Sign Up
            </Link>
          </div>
        </div>
      )}

      <form
        onSubmit={placeOrder}
        noValidate
        className="grid gap-6 lg:grid-cols-12 lg:items-start"
      >
        <div className="space-y-6 lg:col-span-7">
          <section className="surface-card p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">Delivery information</h2>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              Express delivery between 9am and 10pm across Dhaka.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Full name"
                required
                value={form.fullName}
                error={errors.fullName}
                onChange={(event) => update('fullName', event.target.value)}
                placeholder="Rana Ahmed"
                autoComplete="name"
              />
              <TextInput
                label="Mobile number"
                required
                value={form.phone}
                error={errors.phone}
                onChange={(event) => update('phone', event.target.value)}
                placeholder="01712345678"
                inputMode="numeric"
                autoComplete="tel"
              />
              <TextInput
                label="Email"
                type="email"
                required
                value={form.email}
                error={errors.email}
                onChange={(event) => update('email', event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="sm:col-span-2"
              />
              <SelectInput
                label="City"
                value={form.city}
                onChange={(event) => update('city', event.target.value)}
                options={CITIES}
              />
              <TextInput
                label="Area / Thana"
                required
                value={form.area}
                error={errors.area}
                onChange={(event) => update('area', event.target.value)}
                placeholder="Uttara / Dhanmondi"
              />
              <TextArea
                label="Full address"
                required
                value={form.address}
                error={errors.address}
                onChange={(event) => update('address', event.target.value)}
                placeholder="House 14, Road 7, Sector 4"
                className="sm:col-span-2"
              />
              <TextArea
                label="Delivery note (optional)"
                value={form.note}
                onChange={(event) => update('note', event.target.value)}
                placeholder="Call before arriving, lift on left"
                className="sm:col-span-2"
              />
            </div>
          </section>

          <section className="surface-card p-5 sm:p-6">
            <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">Select Payment Method</h2>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
              Pay via Bangladeshi mobile wallet (bKash/Nagad/Rocket) or Cash on Delivery.
            </p>

            <div className="mt-4 space-y-2.5" role="radiogroup" aria-label="Payment method">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.id}
                  className={classNames(
                    'flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors',
                    payment === method.id
                      ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 ring-1 ring-brand-500/20'
                      : 'border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 hover:border-ink-300 dark:hover:border-ink-700',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={payment === method.id}
                      onChange={() => setPayment(method.id)}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500"
                    />
                    <method.icon
                      className={classNames(
                        'h-5 w-5 shrink-0',
                        payment === method.id ? 'text-brand-600' : 'text-ink-400 dark:text-ink-500',
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-ink-900 dark:text-ink-50">{method.label}</div>
                      <div className="text-xs text-ink-500 dark:text-ink-400">{method.caption}</div>
                    </div>
                  </div>

                  {method.badge && (
                    <span className="text-[10px] font-bold bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-300 px-2 py-0.5 rounded-full">
                      {method.badge}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4 lg:col-span-5 lg:sticky lg:top-32">
          <div className="surface-card p-5">
            <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">
              Your items ({itemCount})
            </h2>
            <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3">
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-ink-100 dark:bg-ink-800">
                    <SmartImage src={item.image} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink-900 dark:text-ink-100">
                      {item.name}
                    </span>
                    <span className="block text-xs text-ink-400 dark:text-ink-400">
                      {item.store} · {item.quantity} × {formatPrice(item.price)}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-ink-900 dark:text-ink-50">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <OrderSummary totals={totals} itemCount={itemCount} title="Payment summary">
            <div className="space-y-2.5">
              {user ? (
                <Button type="submit" size="lg" fullWidth loading={submitting}>
                  {submitting ? 'Creating order…' : `Place Order · ${formatPrice(totals.total)}`}
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={handleQuickLogin}
                  className="w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-md hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Login to Place Order
                </button>
              )}
              <Link
                href="/cart"
                className="block text-center text-sm text-ink-500 dark:text-ink-400 transition-colors hover:text-brand-600"
              >
                Back to cart
              </Link>
            </div>
          </OrderSummary>
        </div>
      </form>
    </div>
  );
}
