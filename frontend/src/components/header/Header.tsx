'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ChevronDown,
  LayoutGrid,
  Menu,
  ShoppingCart,
  BadgePercent,
  Crown,
  Truck,
  ShieldCheck,
  Zap,
  User as UserIcon,
} from 'lucide-react';
import { categories } from '@/data/categories';
import { countProductsByCategory } from '@/data/products';
import { useCart } from '@/context/cart-context';
import { useUser } from '@/context/user-context';
import { Logo } from '@/components/ui/Logo';
import { SearchBar } from '@/components/header/SearchBar';
import { MobileMenu } from '@/components/header/MobileMenu';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { buttonStyles } from '@/components/ui/Button';
import { classNames } from '@/lib/format';

const TOP_CATEGORIES = categories.slice(0, 5);

const ANNOUNCEMENTS = [
  {
    icon: Truck,
    text: 'Free express delivery on orders over ৳1,000 inside Dhaka',
  },
  {
    icon: ShieldCheck,
    text: '100% Quality & Freshness Guarantee with instant doorstep return',
  },
  {
    icon: Crown,
    text: 'Fast Buy Membership — 1 Day Free Trial, then only ৳50/month',
  },
  {
    icon: Zap,
    text: 'Hyperlocal 30-minute delivery from Shwapno, Chaldal & Meena Bazar',
  },
];

export function Header() {
  const pathname = usePathname();
  const { itemCount, hydrated } = useCart();
  const { user, role, status } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setCategoriesOpen(false);
  }, [pathname]);

  // Auto-sliding announcement rotator
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Do not render customer storefront header on Admin and Store Merchant portals
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/store-dashboard')) {
    return null;
  }

  const CurrentIcon = ANNOUNCEMENTS[announcementIndex].icon;

  return (
    <header className="sticky top-0 z-40 w-full transition-colors duration-200">
      {/* Top Sliding Announcement Bar */}
      <div
        className="border-b border-ink-800/80 bg-ink-950 dark:bg-black transition-colors duration-200 overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="container-page flex h-8 items-center justify-center text-xs text-white font-medium text-center relative overflow-hidden">
          <div
            key={announcementIndex}
            className="flex items-center gap-2 animate-slide-up transition-all duration-300"
          >
            <CurrentIcon className="h-3.5 w-3.5 text-brand-400 shrink-0" aria-hidden />
            <span className="text-white font-medium tracking-wide">
              {ANNOUNCEMENTS[announcementIndex].text}
            </span>
          </div>
        </div>
      </div>

      {/* Main Branding & Search Bar — Clean Admin Theme Surface */}
      <div className="border-b border-ink-200/80 bg-white text-ink-900 dark:border-ink-800 dark:bg-ink-950 dark:text-ink-50 transition-colors duration-200 shadow-2xs">
        <div className="container-page flex h-16 items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="-ml-1 rounded-lg p-2 text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-900 dark:hover:text-white focus-ring lg:hidden transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>

          <div className="shrink-0">
            <Logo size="md" showTagline />
          </div>

          <div className="hidden flex-1 md:block max-w-2xl mx-auto">
            <SearchBar />
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />

            {user ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/account"
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-ink-100 dark:hover:bg-ink-900 focus-ring"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white shadow-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[8rem] flex-col leading-tight lg:flex">
                    <span className="truncate text-[11px] text-ink-500 dark:text-ink-400 font-medium">Account</span>
                    <span className="truncate text-sm font-bold text-ink-900 dark:text-white">
                      {user.name.split(' ')[0]}
                    </span>
                  </span>
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className={classNames(buttonStyles('outline', 'sm'), 'hidden sm:inline-flex')}
              >
                <UserIcon className="h-4 w-4" aria-hidden />
                Login
              </Link>
            )}

            <Link
              href="/cart"
              className="relative inline-flex h-10 items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white px-4 text-sm font-bold transition-all focus-ring shadow-xs"
            >
              <ShoppingCart className="h-5 w-5" aria-hidden />
              <span className="hidden sm:inline">Cart</span>
              {hydrated && itemCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent-500 px-1 text-[11px] font-bold text-white ring-2 ring-white dark:ring-ink-950 shadow-xs">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="container-page pb-3 md:hidden">
          <SearchBar />
        </div>
      </div>

      {/* Category Sub-Navbar — Sleek, modern slate sub-bar matching Admin Panel */}
      <div className="hidden border-b border-ink-200 dark:border-ink-800 bg-ink-50/70 dark:bg-ink-900/60 lg:block transition-colors duration-200 shadow-2xs">
        <div className="container-page flex h-11 items-center gap-2">
          {/* All Categories Solid Button */}
          <div
            className="relative"
            onMouseEnter={() => setCategoriesOpen(true)}
            onMouseLeave={() => setCategoriesOpen(false)}
          >
            <button
              type="button"
              onClick={() => setCategoriesOpen((open) => !open)}
              aria-expanded={categoriesOpen}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold px-3.5 text-xs shadow-xs transition-colors focus-ring"
            >
              <LayoutGrid className="h-3.5 w-3.5 text-white" aria-hidden />
              <span>All categories</span>
              <ChevronDown
                className={classNames(
                  'h-3.5 w-3.5 transition-transform text-white',
                  categoriesOpen && 'rotate-180',
                )}
                aria-hidden
              />
            </button>

            {categoriesOpen ? (
              <div className="absolute left-0 top-full z-50 w-72 animate-fade-in overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850 py-1.5 shadow-pop">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="flex items-center justify-between px-4 py-2 text-xs font-medium text-ink-700 dark:text-ink-200 transition-colors hover:bg-ink-50 dark:hover:bg-ink-750 hover:text-brand-600 dark:hover:text-brand-400 focus-ring"
                  >
                    <span>{category.name}</span>
                    <span className="text-[11px] text-ink-400 dark:text-ink-500 font-mono">
                      {countProductsByCategory(category.slug)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {/* Categories Nav Links */}
          <nav className="flex items-center gap-1 overflow-hidden">
            {TOP_CATEGORIES.map((category) => {
              const isActive = pathname === `/category/${category.slug}`;
              return (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className={classNames(
                    'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all focus-ring',
                    isActive
                      ? 'bg-white dark:bg-ink-800 text-brand-600 dark:text-brand-400 border border-ink-200/80 dark:border-ink-700 shadow-2xs'
                      : 'text-ink-600 hover:text-brand-600 hover:bg-white dark:text-ink-400 dark:hover:text-brand-400 dark:hover:bg-ink-800',
                  )}
                >
                  {category.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Badges — Solid Colors */}
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/smart-budget"
              className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold px-3 text-xs shadow-xs transition-colors focus-ring"
            >
              <BadgePercent className="h-3.5 w-3.5 text-white" />
              <span>Smart Budget</span>
            </Link>

            <Link
              href="/subscription"
              className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold px-3 text-xs shadow-xs transition-colors focus-ring"
            >
              <Crown className="h-3.5 w-3.5 text-amber-200" />
              <span>
                {status === 'trial'
                  ? 'Trial active'
                  : status === 'active'
                    ? 'Member'
                    : '1 day free trial'}
              </span>
            </Link>
          </div>
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
