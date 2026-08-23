'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BadgePercent,
  ShoppingBag,
  CheckCircle2,
  TrendingDown,
  ShoppingCart,
  Store as StoreIcon,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { SmartImage } from '@/components/ui/SmartImage';
import { smartFeaturesApi } from '@/lib/api/smart-features';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/context/toast-context';
import type { SmartBudgetResult } from '@/types';

const BUDGET_PRESETS = [500, 1000, 1500, 2000, 3000, 5000];

const AVAILABLE_CATEGORIES = [
  { slug: 'grocery', name: 'Cooking & Staples' },
  { slug: 'packaged-food', name: 'Packaged Foods' },
  { slug: 'snacks', name: 'Snacks & Bakery' },
  { slug: 'beverages', name: 'Drinks & Tea' },
  { slug: 'household', name: 'Home & Cleaning' },
  { slug: 'personal-care', name: 'Personal Care' },
  { slug: 'frozen-food', name: 'Frozen Items' },
];

export default function SmartBudgetPage() {
  const { addItem } = useCart();
  const { showToast } = useToast();

  const [budget, setBudget] = useState<number>(1500);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'grocery',
    'packaged-food',
    'snacks',
    'beverages',
  ]);
  const [mode, setMode] = useState<'cheapest' | 'best-rated' | 'single-store'>('cheapest');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SmartBudgetResult | null>(null);

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const handleGenerate = async () => {
    if (budget < 200) {
      showToast('Please enter a budget of at least ৳200', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await smartFeaturesApi.generateSmartBudgetBasket(budget, selectedCategories, {
        mode,
      });
      setResult(res);
      showToast('Smart Budget Basket generated successfully!', 'success');
    } catch {
      showToast('Failed to generate budget basket', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAllToCart = () => {
    if (!result || result.items.length === 0) return;
    result.items.forEach((item) => {
      addItem(
        {
          id: item.id,
          name: item.name,
          slug: item.slug,
          image: item.image,
          store: item.selectedStore,
          storeId: item.storeId,
          unit: item.unit,
          price: item.price,
          originalPrice: item.originalPrice,
          category: item.category,
          storeSlug: item.storeSlug,
          gallery: item.gallery,
          discount: item.discount,
          rating: item.rating,
          reviews: item.reviews,
          description: item.description,
          tags: item.tags,
          available: true,
          popular: item.popular,
        },
        item.quantity || 1,
      );
    });
    showToast(`Added all ${result.items.length} optimized items to your cart!`, 'success');
  };

  return (
    <div className="container-page py-8 max-w-6xl">
      {/* Header Banner */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-6 sm:p-8 shadow-xs transition-colors">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 dark:bg-brand-950/80 border border-brand-200/80 dark:border-brand-800/80 px-3 py-1 text-xs font-bold text-brand-700 dark:text-brand-300">
            <BadgePercent className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            <span>Flagship Smart Shopping Technology</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink-900 dark:text-ink-50 tracking-tight">
            Smart Budget Basket
          </h1>
          <p className="text-sm sm:text-base text-ink-600 dark:text-ink-300 leading-relaxed">
            Specify your fixed household budget and needed staples. Our multi-store heuristic engine
            compares live prices across verified local merchants (Shwapno, Chaldal, Meena Bazar, Agora, Unimart) to construct your optimal basket with
            maximum savings.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Budget Configuration Controls */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="border-ink-200 dark:border-ink-800 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                1. Set Your Target Budget
              </CardTitle>
              <CardDescription>Enter the maximum amount you want to spend</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-ink-500 dark:text-ink-400">
                  ৳
                </span>
                <input
                  type="number"
                  min={200}
                  step={50}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full rounded-xl border border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-850 py-3 pl-9 pr-4 text-xl font-bold text-ink-900 dark:text-ink-50 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="e.g. 1500"
                />
              </div>

              {/* Budget Preset Chips */}
              <div className="flex flex-wrap gap-2">
                {BUDGET_PRESETS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBudget(val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      budget === val
                        ? 'bg-brand-500 text-white shadow-xs'
                        : 'bg-ink-50 dark:bg-ink-800 text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700 border border-ink-200/80 dark:border-ink-700'
                    }`}
                  >
                    ৳{val.toLocaleString()}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Categories Selector */}
          <Card className="border-ink-200 dark:border-ink-800 shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-ink-900 dark:text-ink-50">
                <SlidersHorizontal className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                2. Select Required Item Types
              </CardTitle>
              <CardDescription>Choose the household categories you need</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_CATEGORIES.map((cat) => {
                  const selected = selectedCategories.includes(cat.slug);
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => toggleCategory(cat.slug)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        selected
                          ? 'bg-brand-50 dark:bg-brand-950/80 border-brand-500 text-brand-700 dark:text-brand-300 shadow-2xs font-bold'
                          : 'bg-ink-50/50 dark:bg-ink-850/60 border-ink-200 dark:border-ink-700 text-ink-700 dark:text-ink-300 hover:border-brand-300 hover:bg-white dark:hover:bg-ink-800'
                      }`}
                    >
                      {selected ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border border-ink-300 dark:border-ink-600" />
                      )}
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Optimization Strategy */}
          <Card className="border-ink-200 dark:border-ink-800 shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-ink-900 dark:text-ink-50">3. Optimization Strategy</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  mode === 'cheapest'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/50'
                    : 'border-ink-200 dark:border-ink-800 hover:bg-ink-50/50 dark:hover:bg-ink-850/50'
                }`}
              >
                <input
                  type="radio"
                  name="smart_mode"
                  checked={mode === 'cheapest'}
                  onChange={() => setMode('cheapest')}
                  className="mt-1 text-brand-500 focus:ring-brand-500"
                />
                <div>
                  <div className="text-sm font-bold text-ink-900 dark:text-ink-50">Lowest Total Cost (Recommended)</div>
                  <div className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                    Finds absolute cheapest store prices across all verified local merchants.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  mode === 'best-rated'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/50'
                    : 'border-ink-200 dark:border-ink-800 hover:bg-ink-50/50 dark:hover:bg-ink-850/50'
                }`}
              >
                <input
                  type="radio"
                  name="smart_mode"
                  checked={mode === 'best-rated'}
                  onChange={() => setMode('best-rated')}
                  className="mt-1 text-brand-500 focus:ring-brand-500"
                />
                <div>
                  <div className="text-sm font-bold text-ink-900 dark:text-ink-50">Highest Store Rating</div>
                  <div className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                    Prioritizes 4.8+ rated stores with highest verified fulfillment records.
                  </div>
                </div>
              </label>
            </CardContent>
          </Card>

          {/* Primary Action */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 py-3.5 px-6 font-bold text-white shadow-xs active:scale-98 transition-all disabled:opacity-50 focus-ring"
          >
            {loading ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <BadgePercent className="h-5 w-5 text-white" />
            )}
            Generate Optimized Basket
          </button>
        </div>

        {/* Right Column: Generated Basket Results */}
        <div className="lg:col-span-7">
          {!result ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 dark:border-ink-800 p-10 text-center min-h-[420px] bg-white dark:bg-ink-900 shadow-xs">
              <div className="rounded-2xl bg-brand-50 dark:bg-brand-950/60 p-4 mb-4 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/60 shadow-2xs">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-ink-900 dark:text-ink-50 mb-1">
                Your Smart Basket will appear here
              </h3>
              <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 max-w-sm mb-6 leading-relaxed">
                Choose your budget and required staples on the left, then click Generate to see our multi-store
                savings breakdown.
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-xs transition-all focus-ring"
              >
                Try with ৳1,500 Budget
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-fade-in">
              {/* Summary Metric Card */}
              <Card className="border-brand-200 dark:border-brand-800 bg-brand-50/30 dark:bg-brand-950/30 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-100 dark:border-brand-900/60">
                    <div>
                      <span className="text-xs font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wider">
                        Budget Utilization
                      </span>
                      <div className="text-2xl font-bold text-ink-900 dark:text-ink-50 mt-0.5">
                        ৳{result.total.toLocaleString()}{' '}
                        <span className="text-sm font-normal text-ink-500 dark:text-ink-400">
                          of ৳{result.budget.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-ink-500 dark:text-ink-400">Estimated Savings</div>
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                          <TrendingDown className="h-4 w-4" />৳{result.estimatedSavings.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Meter */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-ink-600 dark:text-ink-400 mb-1 font-medium">
                      <span>Spent: ৳{result.total}</span>
                      <span>Remaining: ৳{result.remainingBudget}</span>
                    </div>
                    <Progress
                      value={result.total}
                      max={result.budget}
                      className="h-3 bg-brand-100 dark:bg-brand-900"
                      indicatorClassName="bg-brand-600"
                    />
                  </div>

                  {/* Explanation banner */}
                  <p className="mt-4 text-xs text-brand-900 dark:text-brand-200 bg-white/80 dark:bg-ink-900/80 rounded-lg p-3 border border-brand-100 dark:border-brand-800 flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                    <span>{result.explanation}</span>
                  </p>
                </CardContent>
              </Card>

              {/* Items List */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink-900 dark:text-ink-50 text-sm">
                    Recommended Products ({result.items.length})
                  </h3>
                  <Badge tone="brand">
                    {result.storesInvolved.length} Stores Included
                  </Badge>
                </div>

                <div className="grid gap-3">
                  {result.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl border border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-xs hover:border-brand-200 dark:hover:border-brand-800 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative h-14 w-14 rounded-lg bg-ink-50 dark:bg-ink-800 overflow-hidden shrink-0">
                          <SmartImage
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-ink-900 dark:text-ink-100 truncate">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                            <span className="flex items-center gap-1 font-medium text-brand-700 dark:text-brand-400">
                              <StoreIcon className="h-3 w-3" />
                              {item.selectedStore}
                            </span>
                            <span>•</span>
                            <span>{item.unit}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-base font-bold text-ink-900 dark:text-ink-50">
                          ৳{item.price}
                        </div>
                        {item.originalPrice > item.price && (
                          <div className="text-xs text-ink-400 dark:text-ink-500 line-through">
                            ৳{item.originalPrice}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Action Strip */}
              <div className="sticky bottom-4 z-20 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-ink-900 dark:bg-ink-850 border border-ink-800 p-4 sm:p-5 text-white shadow-2xl">
                <div>
                  <div className="text-xs text-ink-400">Total Basket Value</div>
                  <div className="text-xl font-bold text-white">
                    ৳{result.total.toLocaleString()}
                    <span className="text-xs font-normal text-ink-300 ml-2">
                      ({result.deliveryFee === 0 ? 'Free Delivery' : `+৳${result.deliveryFee} delivery`})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddAllToCart}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-400 active:scale-98 transition-all shadow-md"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add All to Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
