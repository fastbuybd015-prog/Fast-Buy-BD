'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LogOut,
  Mail,
  Package,
  ShoppingBag,
  UserCircle2,
  MapPin,
  Bell,
  Heart,
  Shield,
  Store as StoreIcon,
  ChevronRight,
} from 'lucide-react';
import type { Order } from '@/types';
import { useUser } from '@/context/user-context';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/context/toast-context';
import { SubscriptionPanel } from '@/components/subscription/SubscriptionPanel';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SmartImage } from '@/components/ui/SmartImage';
import { ordersApi } from '@/lib/api/orders';
import { formatDate, formatDateTime, formatPrice } from '@/lib/format';

export default function AccountPage() {
  const { user, role, logout, switchRole } = useUser();
  const { itemCount } = useCart();
  const { showToast } = useToast();

  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);

  useEffect(() => {
    if (!user) return;
    const fetchLastOrder = async () => {
      try {
        const orders = await ordersApi.getOrders();
        if (orders.length > 0) {
          setLastOrder(orders[0]);
        }
      } catch (e) {
        console.error('Failed to load orders for account overview', e);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchLastOrder();
  }, [user]);

  if (!user) {
    return (
      <div className="container-page py-10">
        <Breadcrumbs items={[{ label: 'My account' }]} />
        <EmptyState
          icon={<UserCircle2 className="h-6 w-6" aria-hidden />}
          title="You are not signed in"
          description="Sign in to your account to view your orders, saved addresses, and membership status."
          actionLabel="Go to login"
          actionHref="/login"
        />
      </div>
    );
  }

  return (
    <div className="container-page py-6 max-w-5xl">
      <Breadcrumbs items={[{ label: 'My account' }]} />

      {/* Role Switcher Persona Bar — Clean Theme-Harmonized Card */}
      <div className="mb-6 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink-900 dark:text-ink-100 uppercase tracking-wider">
              Role-Based Access Control
            </span>
            <Badge tone="brand" className="text-[10px] font-bold">
              Active: {role.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Switch profile persona for live multi-role defense evaluation:
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              switchRole('CUSTOMER');
              showToast('Switched to Customer view', 'info');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              role === 'CUSTOMER'
                ? 'bg-brand-500 text-white shadow-xs'
                : 'bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700'
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => {
              switchRole('STORE_OWNER');
              showToast('Switched to Store Owner view', 'info');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              role === 'STORE_OWNER'
                ? 'bg-brand-500 text-white shadow-xs'
                : 'bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700'
            }`}
          >
            Store Owner
          </button>
          <button
            type="button"
            onClick={() => {
              switchRole('ADMIN');
              showToast('Switched to Administrator view', 'info');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              role === 'ADMIN'
                ? 'bg-brand-500 text-white shadow-xs'
                : 'bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700'
            }`}
          >
            Admin Officer
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Profile Card, Quick Navigation, Subscription */}
        <div className="space-y-4 lg:col-span-5">
          <section className="surface-card p-5">
            <div className="flex items-center gap-3.5">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-xl font-bold text-white shadow-xs">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-ink-900 dark:text-ink-50">{user.name}</h2>
                <p className="flex items-center gap-1.5 truncate text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                  <Mail className="h-3.5 w-3.5" aria-hidden />
                  {user.email}
                </p>
                <Badge tone="brand" className="mt-1.5 text-[10px] font-bold">
                  {role.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <dl className="mt-5 space-y-2.5 border-t border-ink-100 dark:border-ink-800 pt-4 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500 dark:text-ink-400">Member since</dt>
                <dd className="font-semibold text-ink-900 dark:text-ink-100">{formatDate(user.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500 dark:text-ink-400">Items in cart</dt>
                <dd className="font-semibold text-ink-900 dark:text-ink-100">{itemCount}</dd>
              </div>
            </dl>

            {/* Quick Hub Navigation Links */}
            <div className="mt-4 pt-4 border-t border-ink-100 dark:border-ink-800 grid grid-cols-2 gap-2">
              <Link
                href="/orders"
                className="flex items-center gap-2 p-2.5 rounded-xl border border-ink-200/80 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-850/60 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-white dark:hover:bg-ink-800 transition-all text-xs font-semibold text-ink-800 dark:text-ink-200 shadow-2xs"
              >
                <Package className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                All Orders
              </Link>
              <Link
                href="/account/addresses"
                className="flex items-center gap-2 p-2.5 rounded-xl border border-ink-200/80 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-850/60 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-white dark:hover:bg-ink-800 transition-all text-xs font-semibold text-ink-800 dark:text-ink-200 shadow-2xs"
              >
                <MapPin className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                Addresses
              </Link>
              <Link
                href="/account/notifications"
                className="flex items-center gap-2 p-2.5 rounded-xl border border-ink-200/80 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-850/60 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-white dark:hover:bg-ink-800 transition-all text-xs font-semibold text-ink-800 dark:text-ink-200 shadow-2xs"
              >
                <Bell className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                Notifications
              </Link>
              <Link
                href="/favorites"
                className="flex items-center gap-2 p-2.5 rounded-xl border border-ink-200/80 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-850/60 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-white dark:hover:bg-ink-800 transition-all text-xs font-semibold text-ink-800 dark:text-ink-200 shadow-2xs"
              >
                <Heart className="h-4 w-4 text-red-500" />
                Favorites
              </Link>
            </div>

            {/* Dedicated Dashboards Shortcuts (if admin or store owner) */}
            {role === 'ADMIN' && (
              <div className="mt-3">
                <Link
                  href="/admin"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-white" />
                    Open Admin Control Center
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            {role === 'STORE_OWNER' && (
              <div className="mt-3">
                <Link
                  href="/store-dashboard"
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  <span className="flex items-center gap-2">
                    <StoreIcon className="h-4 w-4 text-white" />
                    Open Store Owner Dashboard
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-ink-100 dark:border-ink-800 flex justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  logout();
                  showToast('Signed out successfully', 'info');
                }}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                Log out
              </Button>
            </div>
          </section>

          <SubscriptionPanel />
        </div>

        {/* Right Column: Order Activity Hub */}
        <section className="surface-card overflow-hidden lg:col-span-7">
          <div className="flex items-center justify-between border-b border-ink-100 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-850/60 px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900 dark:text-ink-50">
              <Package className="h-4 w-4 text-brand-600 dark:text-brand-400" aria-hidden />
              Recent Order Activity
            </h2>
            <Link
              href="/orders"
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
            >
              View all orders →
            </Link>
          </div>

          {lastOrder ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 dark:border-ink-800 px-5 py-3.5 bg-ink-50/30 dark:bg-ink-850/40">
                <div>
                  <p className="text-xs font-bold text-ink-900 dark:text-ink-50">{lastOrder.id}</p>
                  <p className="text-[11px] text-ink-400 dark:text-ink-400 font-mono mt-0.5">{formatDateTime(lastOrder.placedAt)}</p>
                </div>
                <Link
                  href={`/orders/${lastOrder.id}`}
                  className="rounded-full bg-brand-500 hover:bg-brand-600 text-white px-3.5 py-1 text-xs font-bold shadow-xs transition-colors"
                >
                  Live Tracking →
                </Link>
              </div>

              <ul className="divide-y divide-ink-100 dark:divide-ink-800">
                {lastOrder.items.map((item) => (
                  <li key={item.productId} className="flex items-center gap-3.5 px-5 py-3.5">
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-ink-100 dark:bg-ink-800 border border-ink-100 dark:border-ink-800">
                      <SmartImage src={item.image} alt="" fill sizes="48px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <Link
                        href={`/product/${item.slug}`}
                        className="block truncate text-xs font-semibold text-ink-900 dark:text-ink-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                      >
                        {item.name}
                      </Link>
                      <span className="block text-[11px] text-ink-400 dark:text-ink-400 mt-0.5">
                        {item.store} · {item.quantity} × {formatPrice(item.price)}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-bold text-ink-900 dark:text-ink-50">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between border-t border-ink-100 dark:border-ink-800 px-5 py-3.5 bg-ink-50/20 dark:bg-ink-850/20">
                <span className="text-xs font-semibold text-ink-700 dark:text-ink-300">Total</span>
                <span className="text-base font-bold text-brand-600 dark:text-brand-400">
                  {formatPrice(lastOrder.total)}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                icon={<Package className="h-6 w-6" aria-hidden />}
                title="No orders yet"
                description="Place an order to see live milestone tracking and delivery updates."
                actionLabel="Browse products"
                actionHref="/search"
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
