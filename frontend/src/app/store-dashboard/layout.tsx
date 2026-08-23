'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Store as StoreIcon,
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowLeft,
  Menu,
  X,
  ShieldCheck,
  Lock,
  UserCheck,
  LogIn,
  ExternalLink,
  ChevronRight,
  CircleDot,
  Scale,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useUser } from '@/context/user-context';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeTone?: 'brand' | 'accent' | 'warning' | 'success';
}

const NAV_GROUPS: { group: string; items: NavItem[] }[] = [
  {
    group: 'STORE OPERATIONS',
    items: [
      { label: 'Store Overview', href: '/store-dashboard', icon: LayoutDashboard },
      { label: 'Live Inventory & Stock', href: '/store-dashboard/inventory', icon: Warehouse },
      {
        label: 'Order Fulfillment',
        href: '/store-dashboard/orders',
        icon: Package,
        badge: '3 Pending',
        badgeTone: 'accent',
      },
    ],
  },
  {
    group: 'MERCHANT SHORTCUTS',
    items: [
      { label: 'Public Store Profile', href: '/stores', icon: StoreIcon },
      { label: 'Multi-Store Compare', href: '/compare', icon: Scale },
    ],
  },
];

export default function StoreDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, role, switchRole, hydrated } = useUser();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // If hydrating
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50 dark:bg-ink-950 text-ink-900 dark:text-ink-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-xs text-ink-500 dark:text-ink-400 font-medium tracking-wide">Verifying merchant credentials...</p>
        </div>
      </div>
    );
  }

  // Strict Access Guard for Store Owner
  if (!user || role !== 'STORE_OWNER') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-ink-50 dark:bg-ink-950">
        <div className="w-full max-w-md rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-6 sm:p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mb-4 shadow-xs">
            <Lock className="h-8 w-8" />
          </div>

          <Badge tone="warning" className="mb-2">
            MERCHANT ACCESS ONLY
          </Badge>

          <h1 className="text-xl font-bold text-ink-900 dark:text-ink-50 tracking-tight">
            Store Owner Credentials Required
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-ink-600 dark:text-ink-400 leading-relaxed">
            This portal is restricted to verified local store owners and branch managers to manage physical
            store inventories, live stock counts, and daily packing queues.
          </p>

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={() => switchRole('STORE_OWNER')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-brand-700 active:scale-98 transition-all"
            >
              <UserCheck className="h-4 w-4" />
              Switch to Store Owner Role (Demo Mode)
            </button>

            <Link
              href="/login?redirect=/store-dashboard"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 px-4 py-2.5 text-xs font-semibold text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-700 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Login as Store Owner
            </Link>

            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium text-ink-500 dark:text-ink-400 hover:text-brand-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Public Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const storeName = user.assignedStoreName || 'Fast Mart (Uttara Branch)';

  // Find active nav title for breadcrumb
  let activeTitle = 'Store Overview';
  NAV_GROUPS.forEach((group) => {
    group.items.forEach((item) => {
      if (item.href === '/store-dashboard' && pathname === '/store-dashboard') {
        activeTitle = item.label;
      } else if (item.href !== '/store-dashboard' && pathname.startsWith(item.href)) {
        activeTitle = item.label;
      }
    });
  });

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950 text-ink-900 dark:text-ink-50 flex flex-col lg:flex-row transition-colors duration-200">
      {/* Mobile Drawer Overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink-900/60 dark:bg-black/80 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-ink-950 text-ink-800 dark:text-ink-200 border-r border-ink-200 dark:border-ink-800 flex flex-col justify-between transition-all duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top Header of Sidebar */}
        <div className="p-5 flex flex-col flex-1 overflow-y-auto no-scrollbar">
          {/* Brand & Store Header */}
          <div className="flex items-center justify-between pb-4 border-b border-ink-100 dark:border-ink-800/80">
            <Link href="/store-dashboard" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold shadow-xs group-hover:scale-105 transition-transform">
                <StoreIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-ink-900 dark:text-white tracking-tight flex items-center gap-1.5 truncate">
                  {storeName.split('(')[0]}
                </div>
                <div className="text-[11px] text-ink-500 dark:text-ink-400 truncate flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span>Verified Merchant</span>
                </div>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 dark:text-ink-400 dark:hover:text-white dark:hover:bg-ink-900"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Live Outlet Status Chip */}
          <div className="my-4 p-2.5 rounded-xl bg-ink-50 dark:bg-ink-900/70 border border-ink-200/80 dark:border-ink-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-[11px] text-emerald-700 dark:text-emerald-400">Live Outlet Online</span>
            </div>
            <span className="text-[10px] font-mono text-ink-600 dark:text-ink-300 bg-white dark:bg-ink-800 px-1.5 py-0.5 rounded border border-ink-200/60 dark:border-ink-700">
              Dhaka North
            </span>
          </div>

          {/* Navigation Groups */}
          <div className="space-y-5 flex-1">
            {NAV_GROUPS.map((group) => (
              <div key={group.group}>
                <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-ink-400 dark:text-ink-500 uppercase">
                  {group.group}
                </div>
                <nav className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === '/store-dashboard'
                        ? pathname === '/store-dashboard'
                        : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileNavOpen(false)}
                        className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                          isActive
                            ? 'bg-brand-500 text-white shadow-xs'
                            : 'text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-900/80 hover:text-ink-950 dark:hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon
                            className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                              isActive ? 'text-white' : 'text-ink-400 dark:text-ink-400 group-hover:text-brand-600 dark:group-hover:text-brand-400'
                            }`}
                          />
                          {item.label}
                        </span>

                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs ${
                              isActive
                                ? 'bg-white text-brand-700'
                                : 'bg-accent-100 text-accent-800 dark:bg-accent-950/60 dark:text-accent-300 dark:border dark:border-accent-800/60'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom User Card & Controls */}
        <div className="p-4 border-t border-ink-200 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-950 space-y-3 shrink-0">
          {/* User Profile Card */}
          <div className="p-3 rounded-xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-xs shrink-0">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-xs text-ink-900 dark:text-white truncate">{user.name}</div>
                <div className="text-[10px] text-ink-500 dark:text-ink-400 font-mono">STORE OWNER</div>
              </div>
            </div>
            <ThemeToggle />
          </div>

          {/* Quick Role Switch for Demo */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => switchRole('ADMIN')}
              className="flex-1 py-1.5 px-2 rounded-lg bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 text-[10px] font-medium text-ink-700 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors text-center shadow-xs"
              title="Switch to Admin Panel"
            >
              Switch Admin
            </button>
            <button
              type="button"
              onClick={() => switchRole('CUSTOMER')}
              className="flex-1 py-1.5 px-2 rounded-lg bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 text-[10px] font-medium text-ink-700 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors text-center shadow-xs"
              title="Switch to Customer Mode"
            >
              Switch User
            </button>
          </div>

          {/* Return to Public Storefront */}
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 text-xs font-semibold text-ink-700 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-ink-50 dark:hover:bg-ink-800 transition-all shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Public Store
          </Link>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Dashboard Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-ink-900/90 backdrop-blur-md border-b border-ink-200 dark:border-ink-800 px-4 sm:px-8 flex items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-750 transition-colors shadow-xs"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb Trail */}
            <div className="flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
              <span className="font-medium">Merchant Portal</span>
              <ChevronRight className="h-3.5 w-3.5 text-ink-400" />
              <span className="font-bold text-ink-900 dark:text-ink-50">{activeTitle}</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <CircleDot className="h-3 w-3 text-emerald-500 animate-pulse" />
              <span>{storeName}</span>
            </div>

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-xs font-semibold text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-700 hover:text-brand-600 transition-colors shadow-xs"
            >
              <span>View Storefront</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {/* Dashboard Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
