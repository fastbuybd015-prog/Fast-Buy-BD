'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgePercent,
  ShieldCheck,
  TrendingDown,
  Crown,
  ChevronLeft,
  ChevronRight,
  Flame,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { banner } from '@/lib/images';

const HERO_SLIDES = [
  {
    id: 1,
    tag: 'Weekend Super Campaign',
    tagIcon: Flame,
    title: 'Your Daily Essentials at Multi-Store Wholesale Rates',
    description:
      'Shop across Shwapno, Chaldal, Meena Bazar & Agora in a single basket. Save up to 30% with 30-min express delivery in Dhaka.',
    ctaText: 'Explore Mega Deals',
    ctaHref: '/deals',
    secondaryText: 'Smart Budget Basket',
    secondaryHref: '/smart-budget',
    image: banner('1542838132-92c53300491e', 1600, 900),
    badge: 'Up to 30% OFF',
  },
  {
    id: 2,
    tag: 'Live Heuristic Price Audit',
    tagIcon: TrendingDown,
    title: 'Compare Prices & Cut Your Monthly Grocery Bill',
    description:
      'Our multi-store price engine audits your basket in real-time to find the absolute lowest prices across verified local merchants.',
    ctaText: 'Optimize My Basket',
    ctaHref: '/basket-optimizer',
    secondaryText: 'Compare Store Prices',
    secondaryHref: '/compare',
    image: banner('1583947215259-38e31be8751f', 1600, 900),
    badge: 'Save up to 15%',
  },
  {
    id: 3,
    tag: 'Fast Buy VIP Membership',
    tagIcon: Crown,
    title: '1 Day Free Trial — Zero Delivery Fees & Priority Slots',
    description:
      'Try all VIP perks free for 24 hours. Enjoy free shipping on every order, member-only prices on 200+ items, and priority dispatch.',
    ctaText: 'Start 1 Day Free Trial',
    ctaHref: '/subscription',
    secondaryText: 'Membership Perks',
    secondaryHref: '/subscription',
    image: banner('1549382534-2876659bf203', 1600, 900),
    badge: '1 Day Free',
  },
];

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Slide rotation
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const slide = HERO_SLIDES[currentSlide];
  const TagIcon = slide.tagIcon;

  return (
    <section className="container-page pt-4 sm:pt-6">
      {/* Full-Width Showcase Banner Carousel */}
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800 bg-ink-950 min-h-[380px] sm:min-h-[440px] lg:min-h-[460px] flex flex-col justify-between shadow-xs transition-colors group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Image Showcase */}
        <SmartImage
          key={slide.id}
          src={slide.image}
          alt={slide.title}
          fill
          priority
          sizes="100vw"
          className="object-cover transition-opacity duration-700 brightness-[0.75]"
        />

        {/* Solid Gradient Overlay for Maximum Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-6 sm:p-10 lg:p-12">
          <div className="space-y-4 max-w-2xl">
            {/* Campaign Badge — Bold Solid Color */}
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-500 text-white px-3.5 py-1 text-xs font-bold shadow-xs">
              <TagIcon className="h-3.5 w-3.5 text-amber-200" />
              <span>{slide.tag}</span>
              <span className="rounded-full bg-white text-brand-700 px-2 py-0.5 text-[10px] font-extrabold shadow-2xs">
                {slide.badge}
              </span>
            </div>

            {/* Title & Description */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight max-w-xl">
              {slide.title}
            </h1>
            <p className="text-xs sm:text-base text-ink-200 leading-relaxed max-w-xl">
              {slide.description}
            </p>
          </div>

          {/* Action Buttons & Carousel Nav */}
          <div className="pt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={slide.ctaHref}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm px-6 py-3.5 shadow-xs transition-all active:scale-98 focus-ring"
              >
                <span>{slide.ctaText}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href={slide.secondaryHref}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm px-5 py-3.5 backdrop-blur-md transition-all focus-ring"
              >
                <span>{slide.secondaryText}</span>
              </Link>
            </div>

            {/* Slider Pagination Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))
                }
                className="h-9 w-9 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition-colors focus-ring"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-1.5">
                {HERO_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2.5 rounded-full transition-all ${
                      currentSlide === idx ? 'w-7 bg-brand-500' : 'w-2.5 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                className="h-9 w-9 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition-colors focus-ring"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Guarantee Strip (Alibaba Marketplace Service Standards) */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-ink-200/80 dark:border-ink-800 bg-white dark:bg-ink-900 p-3.5 shadow-2xs transition-colors">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/60 shrink-0">
            <Truck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-ink-900 dark:text-ink-50 truncate">30-min Delivery</h4>
            <p className="text-[11px] text-ink-500 dark:text-ink-400 truncate">From nearest local hub</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-ink-200/80 dark:border-ink-800 bg-white dark:bg-ink-900 p-3.5 shadow-2xs transition-colors">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-ink-900 dark:text-ink-50 truncate">100% Authentic</h4>
            <p className="text-[11px] text-ink-500 dark:text-ink-400 truncate">Verified superstores</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-ink-200/80 dark:border-ink-800 bg-white dark:bg-ink-900 p-3.5 shadow-2xs transition-colors">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 shrink-0">
            <BadgePercent className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-ink-900 dark:text-ink-50 truncate">Best Price Engine</h4>
            <p className="text-[11px] text-ink-500 dark:text-ink-400 truncate">Live heuristic savings</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-ink-200/80 dark:border-ink-800 bg-white dark:bg-ink-900 p-3.5 shadow-2xs transition-colors">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/60 shrink-0">
            <RotateCcw className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-ink-900 dark:text-ink-50 truncate">Instant Return</h4>
            <p className="text-[11px] text-ink-500 dark:text-ink-400 truncate">Doorstep verification</p>
          </div>
        </div>
      </div>
    </section>
  );
}
