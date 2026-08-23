'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  Store as StoreIcon,
  Zap,
  Star,
  Layers,
  Scale,
  RefreshCw,
  ShoppingCart,
  AlertCircle,
  BadgeCheck,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SmartImage } from '@/components/ui/SmartImage';
import { smartFeaturesApi } from '@/lib/api/smart-features';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/context/toast-context';
import type { BasketOptimizationResult, CartItem, OptimizationMode } from '@/types';

const OPTIMIZATION_MODES: {
  id: OptimizationMode;
  name: string;
  badge: string;
  icon: LucideIcon;
  description: string;
}[] = [
  {
    id: 'cheapest',
    name: 'Maximum Savings',
    badge: 'Save up to 15%',
    icon: TrendingDown,
    description: 'Swaps each individual item to the lowest-priced verified merchant in Dhaka.',
  },
  {
    id: 'single-store',
    name: 'Single Store Fulfillment',
    badge: '1 Delivery',
    icon: StoreIcon,
    description: 'Consolidates all items to one single store to guarantee single delivery package.',
  },
  {
    id: 'best-rated',
    name: 'Highest Rated Quality',
    badge: '4.8+ Stars',
    icon: Star,
    description: 'Prioritizes merchants with top customer satisfaction and lowest replacement rates.',
  },
  {
    id: 'fastest',
    name: 'Express 20-Min Delivery',
    badge: 'Quickest',
    icon: Zap,
    description: 'Selects hyper-local stores closest to your sector for fastest dispatch.',
  },
  {
    id: 'balanced',
    name: 'Balanced Value',
    badge: 'Recommended',
    icon: Scale,
    description: 'Optimizes for best overall balance between lower price and delivery convenience.',
  },
];

const DEFAULT_DEMO_ITEMS: CartItem[] = [
  {
    productId: 'prod-pran-mustard-oil-1l',
    name: 'PRAN Pure Mustard Oil',
    slug: 'pran-mustard-oil-1l',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60',
    store: 'Agora Superstore',
    storeId: 'store-04',
    unit: '1 L',
    price: 320,
    originalPrice: 320,
    quantity: 2,
  },
  {
    productId: 'prod-aarong-dairy-full-cream-milk-1l',
    name: 'Aarong Dairy Liquid Milk',
    slug: 'aarong-liquid-milk-1l',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60',
    store: 'Shwapno Superstore',
    storeId: 'store-01',
    unit: '1 L',
    price: 105,
    originalPrice: 105,
    quantity: 4,
  },
  {
    productId: 'prod-miniket-rice-5kg',
    name: 'Miniket Rice Premium',
    slug: 'miniket-rice-premium-5kg',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60',
    store: 'Unimart Hypermarket',
    storeId: 'store-05',
    unit: '5 kg',
    price: 440,
    originalPrice: 480,
    quantity: 1,
  },
  {
    productId: 'prod-teer-atta-2kg',
    name: 'Teer Whole Wheat Atta',
    slug: 'teer-atta-2kg',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60',
    store: 'Meena Bazar Outlet',
    storeId: 'store-03',
    unit: '2 kg',
    price: 160,
    originalPrice: 180,
    quantity: 2,
  },
];

export default function BasketOptimizerPage() {
  const { items: cartItems, clearCart, addItem } = useCart();
  const { showToast } = useToast();

  const [selectedMode, setSelectedMode] = useState<OptimizationMode>('cheapest');
  const [loading, setLoading] = useState<boolean>(true);
  const [result, setResult] = useState<BasketOptimizationResult | null>(null);

  const activeItems = cartItems.length > 0 ? cartItems : DEFAULT_DEMO_ITEMS;

  const runOptimization = async (mode: OptimizationMode) => {
    setLoading(true);
    setSelectedMode(mode);
    try {
      const res = await smartFeaturesApi.optimizeBasket(activeItems, mode);
      setResult(res);
    } catch {
      showToast('Failed to optimize basket', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runOptimization('cheapest');
  }, []);

  const handleApply = () => {
    if (!result) return;
    clearCart();
    result.recommendedItems.forEach((item) => {
      addItem(
        {
          id: item.productId,
          name: item.name,
          slug: item.slug,
          image: item.image,
          store: item.store,
          storeId: item.storeId,
          unit: item.unit,
          price: item.price,
          originalPrice: item.originalPrice,
          category: 'grocery',
          storeSlug: item.storeId,
          gallery: [item.image],
          discount: item.originalPrice > item.price ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0,
          rating: 4.8,
          reviews: 120,
          description: `${item.name} from ${item.store}`,
          tags: ['optimized', 'grocery'],
          available: true,
          popular: true,
        },
        item.quantity,
      );
    });
    showToast(`Optimized basket applied! You saved ৳${result.potentialSavings}`, 'success');
  };

  return (
    <div className="container-page py-8 max-w-6xl">
      {/* Header Banner */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-6 sm:p-8 shadow-xs transition-colors">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-800/80 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <TrendingDown className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>AI Multi-Store Cost Optimization</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink-900 dark:text-ink-50 tracking-tight">
            Smart Basket Optimizer
          </h1>
          <p className="text-sm sm:text-base text-ink-600 dark:text-ink-300 leading-relaxed">
            Eliminate price disparity across supermarkets. Our algorithmic engine audits your current
            shopping basket against local stockists (Shwapno, Chaldal, Meena Bazar, Agora, Unimart) to find the cheapest single or multi-store checkout.
          </p>
        </div>
      </div>

      {cartItems.length === 0 && (
        <div className="mb-6 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-4 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              Showing interactive demonstration with a sample family grocery basket (4 items).
            </span>
          </div>
          <Link href="/search" className="font-semibold text-brand-700 dark:text-brand-400 underline">
            Browse Catalog
          </Link>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="mb-8">
        <div className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider mb-3">
          Select Optimization Strategy
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {OPTIMIZATION_MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => runOptimization(mode.id)}
                disabled={loading}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/60 shadow-sm ring-2 ring-brand-500/20'
                    : 'border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 hover:border-ink-300 dark:hover:border-ink-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div
                    className={`rounded-lg p-2 ${
                      isSelected ? 'bg-brand-600 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-brand-200 text-brand-800 dark:bg-brand-900 dark:text-brand-200'
                        : 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-400'
                    }`}
                  >
                    {mode.badge}
                  </span>
                </div>
                <div className="font-semibold text-sm text-ink-900 dark:text-ink-50">{mode.name}</div>
                <div className="text-[11px] text-ink-500 dark:text-ink-400 mt-1 leading-snug">
                  {mode.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {loading || !result ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-2xl bg-white dark:bg-ink-900 border border-ink-100 dark:border-ink-800 min-h-[300px]">
          <RefreshCw className="h-8 w-8 text-brand-600 animate-spin mb-4" />
          <p className="text-sm font-semibold text-ink-800 dark:text-ink-200">Calculating optimal merchant routes...</p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Comparison Cards & Switch Suggestions */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Direct Cost Comparison Banner */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-ink-200 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-900">
                <CardContent className="p-5">
                  <span className="text-xs font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                    Current Basket
                  </span>
                  <div className="text-2xl font-bold text-ink-700 dark:text-ink-300 mt-1">
                    ৳{result.currentTotal.toLocaleString()}
                  </div>
                  <div className="text-xs text-ink-400 dark:text-ink-500 mt-0.5">
                    +{result.currentDelivery === 0 ? 'Free Delivery' : `৳${result.currentDelivery} delivery`}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/40">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                      Optimized Basket
                    </span>
                    <Badge tone="deal">Save ৳{result.potentialSavings}</Badge>
                  </div>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                    ৳{result.optimizedTotal.toLocaleString()}
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                    {result.optimizedDelivery === 0 ? 'Free Delivery' : `+৳${result.optimizedDelivery} delivery`}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Explanation card */}
            <div className="rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50/40 dark:bg-brand-950/40 p-4 text-xs sm:text-sm text-brand-900 dark:text-brand-200 flex items-start gap-2.5">
              <BadgeCheck className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
              <span>{result.explanation}</span>
            </div>

            {/* Switch Recommendations */}
            <Card className="border-ink-200 dark:border-ink-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                  Recommended Store Switches ({result.switches.length})
                </CardTitle>
                <CardDescription>Items reassigned to lower priced local stores</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {result.switches.map((sw, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-ink-100 dark:border-ink-800 bg-ink-50/40 dark:bg-ink-850/60"
                  >
                    <div>
                      <div className="font-semibold text-sm text-ink-900 dark:text-ink-100">{sw.productName}</div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-ink-500 dark:text-ink-400">
                        <span className="line-through text-ink-400 dark:text-ink-500">{sw.fromStore} (৳{sw.oldPrice})</span>
                        <ArrowRight className="h-3 w-3 text-brand-600 dark:text-brand-400" />
                        <span className="font-semibold text-brand-700 dark:text-brand-400">{sw.toStore} (৳{sw.newPrice})</span>
                      </div>
                    </div>

                    <Badge tone="success" className="self-start sm:self-center">
                      Save ৳{sw.savings}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Optimized Basket Items & Apply CTA */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <Card className="border-ink-200 dark:border-ink-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                    Optimized Cart Preview ({result.recommendedItems.length})
                  </CardTitle>
                  <Badge tone="brand">
                    {result.participatingStores.length} Stores
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
                {result.recommendedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-850"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative h-11 w-11 rounded-md bg-ink-50 dark:bg-ink-800 overflow-hidden shrink-0">
                        <SmartImage src={item.image} alt={item.name} fill sizes="44px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-ink-900 dark:text-ink-100 truncate">{item.name}</div>
                        <div className="text-[11px] text-brand-700 dark:text-brand-400 font-medium">{item.store} • Qty {item.quantity}</div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-ink-900 dark:text-ink-50 shrink-0">
                      ৳{item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <button
              type="button"
              onClick={handleApply}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-4 px-6 font-semibold text-white shadow-lg hover:bg-brand-700 active:scale-98 transition-all"
            >
              <CheckCircle2 className="h-5 w-5 text-accent-300" />
              Apply Optimized Basket (Save ৳{result.potentialSavings})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
