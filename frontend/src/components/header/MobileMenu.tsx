'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import {
  LogOut,
  Package,
  BadgePercent,
  Crown,
  Store as StoreIcon,
  User as UserIcon,
  X,
  TrendingDown,
  Scale,
  Heart,
  Shield,
} from 'lucide-react';
import { categories } from '@/data/categories';
import { countProductsByCategory } from '@/data/products';
import { useUser } from '@/context/user-context';
import { buttonStyles } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const SMART_LINKS = [
  { href: '/smart-budget', label: 'Smart Budget Basket', icon: BadgePercent, highlight: true },
  { href: '/basket-optimizer', label: 'Basket Optimizer', icon: TrendingDown },
  { href: '/compare', label: 'Compare Store Prices', icon: Scale },
];

const QUICK_LINKS = [
  { href: '/orders', label: 'My Orders & Tracking', icon: Package },
  { href: '/favorites', label: 'Saved Favorites', icon: Heart },
  { href: '/stores', label: 'All Verified Stores', icon: StoreIcon },
  { href: '/subscription', label: 'Trial & Subscription', icon: Crown },
  { href: '/account', label: 'My Account Hub', icon: UserIcon },
];

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, role, logout } = useUser();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 animate-fade-in bg-ink-900/60 dark:bg-black/80" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        className="absolute left-0 top-0 flex h-full w-[85%] max-w-sm animate-slide-in-right flex-col bg-white dark:bg-ink-900 shadow-pop text-ink-900 dark:text-ink-100 transition-colors"
      >
        <div className="flex items-center justify-between border-b border-ink-100 dark:border-ink-800 px-4 py-4">
          <div onClick={onClose}>
            <Logo size="sm" showTagline={false} />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 focus-ring"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* User Profile / Auth State */}
          <div className="border-b border-ink-100 dark:border-ink-800 p-4">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/60 text-base font-semibold text-brand-700 dark:text-brand-300">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{user.name}</p>
                    <p className="truncate text-xs text-ink-500 dark:text-ink-400">{user.email}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" onClick={onClose} className={buttonStyles('primary', 'sm')}>
                  <UserIcon className="h-4 w-4" aria-hidden />
                  Login
                </Link>
                <Link href="/register" onClick={onClose} className={buttonStyles('outline', 'sm')}>
                  Register
                </Link>
              </div>
            )}
          </div>

          <nav className="p-4">
            {/* Smart Commerce Links */}
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-400">
              Smart Shopping Tools
            </p>
            <ul className="space-y-1 mb-5">
              {SMART_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="flex items-center gap-2.5 rounded-xl bg-brand-50/70 dark:bg-brand-950/60 p-2.5 text-xs font-semibold text-brand-900 dark:text-brand-200 hover:bg-brand-100 dark:hover:bg-brand-900/60"
                  >
                    <link.icon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Quick Links */}
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">
              Account & Navigation
            </p>
            <ul className="space-y-0.5 mb-5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-700 dark:text-ink-300 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800"
                  >
                    <link.icon className="h-4 w-4 text-ink-400 dark:text-ink-500" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Admin / Store Owner Shortcuts */}
            {role === 'ADMIN' && (
              <div className="mb-5">
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-xl bg-ink-900 dark:bg-brand-700 p-3 text-xs font-bold text-white shadow-xs"
                >
                  <Shield className="h-4 w-4 text-brand-400 dark:text-brand-200" />
                  Open Admin Center
                </Link>
              </div>
            )}

            {role === 'STORE_OWNER' && (
              <div className="mb-5">
                <Link
                  href="/store-dashboard"
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-xl bg-brand-700 p-3 text-xs font-bold text-white shadow-xs"
                >
                  <StoreIcon className="h-4 w-4 text-accent-300" />
                  Store Owner Dashboard
                </Link>
              </div>
            )}

            {/* Categories */}
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">
              Shop by Category
            </p>
            <ul className="space-y-0.5">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/category/${category.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-ink-700 dark:text-ink-300 transition-colors hover:bg-ink-50 dark:hover:bg-ink-800"
                  >
                    {category.name}
                    <span className="text-xs text-ink-400 dark:text-ink-500">
                      {countProductsByCategory(category.slug)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {user && (
          <div className="border-t border-ink-100 dark:border-ink-800 p-4">
            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
