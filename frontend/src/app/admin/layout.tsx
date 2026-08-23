'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  Package,
  Layers,
  Store as StoreIcon,
  Warehouse,
  BarChart3,
  Tag,
  Settings,
  ArrowLeft,
  Menu,
  X,
  Lock,
  UserCheck,
  LogIn,
  ExternalLink,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Logo } from '@/components/ui/Logo';
import { useUser } from '@/context/user-context';

interface AdminNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeTone?: 'brand' | 'accent' | 'warning' | 'success';
}

const ADMIN_NAV_GROUPS: { group: string; items: AdminNavItem[] }[] = [
  {
    group: 'CORE METRICS',
    items: [
      { label: 'Platform Overview', href: '/admin', icon: LayoutDashboard },
      { label: 'Real-time Analytics', href: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    group: 'OPERATIONS & AUDIT',
    items: [
      {
        label: 'Payment Queue',
        href: '/admin/payments',
        icon: CreditCard,
        badge: '2 Pending',
        badgeTone: 'warning',
      },
      { label: 'Orders Workflow', href: '/admin/orders', icon: Package },
      { label: 'Inventory & Stock Matrix', href: '/admin/inventory', icon: Warehouse },
    ],
  },
  {
    group: 'CATALOG & MERCHANTS',
    items: [
      { label: 'Products Master Catalog', href: '/admin/products', icon: Layers },
      { label: 'Partner Stores', href: '/admin/stores', icon: StoreIcon },
      { label: 'Coupons & Promos', href: '/admin/coupons', icon: Tag },
    ],
  },
  {
    group: 'SYSTEM CONTROL',
    items: [{ label: 'System Settings', href: '/admin/settings', icon: Settings }],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, role, switchRole, hydrated } = useUser();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // If page is still hydrating from storage, show a clean loader
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50 dark:bg-ink-950 text-ink-900 dark:text-ink-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-xs text-ink-500 dark:text-ink-400 font-medium tracking-wide">Checking security permissions...</p>
        </div>
      </div>
    );
  }

  // Strict Access Guard: If not Admin, show Security Gate
  if (!user || role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-ink-50 dark:bg-ink-950">
        <div className="w-full max-w-md rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-6 sm:p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mb-4 shadow-xs">
            <Lock className="h-8 w-8" />
          </div>

          <Badge tone="destructive" className="mb-2">
            RESTRICTED ACCESS
          </Badge>

          <h1 className="text-xl font-bold text-ink-900 dark:text-ink-50 tracking-tight">
            Administrator Permissions Required
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-ink-600 dark:text-ink-400 leading-relaxed">
            You do not have permission to access the FastShopBD Platform Control Center. Only
            authorized system administrators can view platform orders, payment queues, and financial records.
          </p>

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={() => switchRole('ADMIN')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-brand-700 active:scale-98 transition-all"
            >
              <UserCheck className="h-4 w-4" />
              Switch to Admin Role (Demo Mode)
            </button>

            <Link
              href="/login?redirect=/admin"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 px-4 py-2.5 text-xs font-semibold text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-700 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Login with Admin Account
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

  // Find active nav title for breadcrumb
  let activeTitle = 'Platform Overview';
  ADMIN_NAV_GROUPS.forEach((group) => {
    group.items.forEach((item) => {
      if (item.href === '/admin' && pathname === '/admin') {
        activeTitle = item.label;
      } else if (item.href !== '/admin' && pathname.startsWith(item.href)) {
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

      {/* Admin Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-ink-950 text-ink-800 dark:text-ink-200 border-r border-ink-200 dark:border-ink-800 flex flex-col justify-between transition-all duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top Header of Sidebar */}
        <div className="p-5 flex flex-col flex-1 overflow-y-auto no-scrollbar">
          {/* Logo & Platform Info */}
          <div className="flex items-center justify-between pb-4 border-b border-ink-100 dark:border-ink-800/80">
            <Link href="/admin" className="flex items-center gap-2 group">
              <Logo size="sm" showTagline={false} asLink={false} />
              <span className="rounded-md bg-brand-500 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 shadow-2xs">
                ADMIN
              </span>
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

          {/* Platform Status Indicator */}
          <div className="my-4 p-2.5 rounded-xl bg-ink-50 dark:bg-ink-900/70 border border-ink-200/80 dark:border-ink-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-[11px] text-emerald-700 dark:text-emerald-400">All Gateways Active</span>
            </div>
            <span className="text-[10px] font-mono text-ink-600 dark:text-ink-300 bg-white dark:bg-ink-800 px-1.5 py-0.5 rounded border border-ink-200/60 dark:border-ink-700">
              6 Stores
            </span>
          </div>

          {/* Navigation Groups */}
          <div className="space-y-5 flex-1">
            {ADMIN_NAV_GROUPS.map((group) => (
              <div key={group.group}>
                <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-ink-400 dark:text-ink-500 uppercase">
                  {group.group}
                </div>
                <nav className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);

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
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 dark:border dark:border-amber-800/60'
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
                AD
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-xs text-ink-900 dark:text-white truncate">{user.name || user.email}</div>
                <div className="text-[10px] text-ink-500 dark:text-ink-400 font-mono">SUPER ADMIN</div>
              </div>
            </div>
            <ThemeToggle />
          </div>

          {/* Quick Role Switch for Demo */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => switchRole('STORE_OWNER')}
              className="flex-1 py-1.5 px-2 rounded-lg bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 text-[10px] font-medium text-ink-700 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors text-center shadow-xs"
              title="Switch to Store Owner Portal"
            >
              Switch Store
            </button>
            <button
              type="button"
              onClick={() => switchRole('CUSTOMER')}
              className="flex-1 py-1.5 px-2 rounded-lg bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 text-[10px] font-medium text-ink-700 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors text-center shadow-xs"
              title="Switch to Customer Storefront"
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
              <span className="font-medium">Admin Center</span>
              <ChevronRight className="h-3.5 w-3.5 text-ink-400" />
              <span className="font-bold text-ink-900 dark:text-ink-50">{activeTitle}</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink-100 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 text-ink-700 dark:text-ink-300 text-xs font-semibold">
              <Activity className="h-3 w-3 text-emerald-500" />
              <span>Dhaka Gateway v2.4</span>
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
