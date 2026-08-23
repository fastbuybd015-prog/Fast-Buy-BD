import Link from 'next/link';
import {
  BadgePercent,
  TrendingDown,
  Scale,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { categories } from '@/data/categories';
import { stores } from '@/data/stores';
import {
  countProductsByCategory,
  countProductsByStore,
  getDiscountedProducts,
  getPopularProducts,
  getProductsByCategory,
} from '@/data/products';
import { Hero } from '@/components/home/Hero';
import { ValueProps } from '@/components/home/ValueProps';
import { TrialPromo } from '@/components/home/TrialPromo';
import { CategoryCard } from '@/components/category/CategoryCard';
import { StoreCard } from '@/components/store/StoreCard';
import { ProductRail } from '@/components/product/ProductGrid';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SmartImage } from '@/components/ui/SmartImage';
import { buttonStyles } from '@/components/ui/Button';
import { banner } from '@/lib/images';

export default function HomePage() {
  const dealProducts = getDiscountedProducts(8);
  const popularProducts = getPopularProducts(8);
  // Skip the ones already shown in "Popular right now" so the rails differ.
  const homePicks = getProductsByCategory('home-kitchen')
    .filter((product) => !popularProducts.includes(product))
    .slice(0, 4);

  return (
    <>
      <Hero />
      <ValueProps />

      {/* Smart Commerce Feature CTAs */}
      <section className="container-page mt-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/smart-budget"
            className="group relative overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-6 shadow-xs hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-card-hover transition-all flex flex-col justify-between"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 dark:bg-brand-950/80 border border-brand-200/80 dark:border-brand-800/80 px-3 py-1 text-xs font-bold text-brand-700 dark:text-brand-300 mb-3">
                <BadgePercent className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                <span>Flagship Feature</span>
              </div>
              <h3 className="text-lg font-bold text-ink-900 dark:text-ink-50 mb-1.5 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                Smart Budget Basket
              </h3>
              <p className="text-xs text-ink-600 dark:text-ink-400 mb-5 leading-relaxed">
                Set your target monthly grocery budget and get an auto-optimized multi-store basket.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400">
              <span>Build My Basket</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/basket-optimizer"
            className="group relative overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-6 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-card-hover transition-all flex flex-col justify-between"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-800/80 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-3">
                <TrendingDown className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Save up to 15%</span>
              </div>
              <h3 className="text-lg font-bold text-ink-900 dark:text-ink-50 mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Smart Basket Optimizer
              </h3>
              <p className="text-xs text-ink-600 dark:text-ink-400 mb-5 leading-relaxed">
                Compare current cart items against alternative local stores for maximum savings.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>Optimize Cart</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/compare"
            className="group relative overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-6 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-card-hover transition-all flex flex-col justify-between"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-950/80 border border-amber-200/80 dark:border-amber-800/80 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 mb-3">
                <Scale className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>Price Transparency</span>
              </div>
              <h3 className="text-lg font-bold text-ink-900 dark:text-ink-50 mb-1.5 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Multi-Store Price Compare
              </h3>
              <p className="text-xs text-ink-600 dark:text-ink-400 mb-5 leading-relaxed">
                Compare live store prices, delivery times, and ratings for any grocery product.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
              <span>Compare Prices</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page mt-10">
        <SectionHeader
          title="Shop by category"
          subtitle="Everything a household needs, organised the way you shop."
          actionLabel="View all categories"
          actionHref="/categories"
        />
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-5">
          {categories.map((category) => (
            <div key={category.id} className="w-[104px] shrink-0 sm:w-auto">
              <CategoryCard
                category={category}
                productCount={countProductsByCategory(category.slug)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Deals */}
      <section className="container-page mt-10">
        <SectionHeader
          title="Today's best deals"
          subtitle="Discounted items updated every morning."
          actionLabel="View all offers"
          actionHref="/deals"
        />
        <ProductRail products={dealProducts} />
      </section>

      {/* Promo strip */}
      <section className="container-page mt-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <PromoCard
            href="/category/frozen-food"
            image={banner('1562967914-608f82629710', 900, 500)}
            eyebrow="Freezer favourites"
            title="Frozen snacks for busy evenings"
            caption="Nuggets, samosas and ice cream from ৳380"
          />
          <PromoCard
            href="/category/beverages"
            image={banner('1600271886742-f049cd451bba', 900, 500)}
            eyebrow="Chilled & ready"
            title="Beverages for the whole family"
            caption="Juice, tea, coffee and soft drinks"
          />
        </div>
      </section>

      {/* Stores */}
      <section className="container-page mt-10">
        <SectionHeader
          title="Shop from trusted stores"
          subtitle="Every product on Fast Buy BD comes from a verified local store."
          actionLabel="All stores"
          actionHref="/stores"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.slice(0, 6).map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              productCount={countProductsByStore(store.id)}
            />
          ))}
        </div>
      </section>

      {/* Popular */}
      <section className="container-page mt-10">
        <SectionHeader
          title="Popular right now"
          subtitle="What families across Dhaka are buying this week."
          actionLabel="Browse staples"
          actionHref="/category/grocery"
        />
        <ProductRail products={popularProducts} />
      </section>

      <TrialPromo />

      {/* Home & kitchen */}
      <section className="container-page mt-10">
        <SectionHeader
          title="Upgrade your kitchen"
          subtitle="Cookware, storage and small appliances, all under warranty."
          actionLabel="See all"
          actionHref="/category/home-kitchen"
        />
        <ProductRail products={homePicks} />
      </section>
    </>
  );
}

function PromoCard({
  href,
  image,
  eyebrow,
  title,
  caption,
}: {
  href: string;
  image: string;
  eyebrow: string;
  title: string;
  caption: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-card bg-ink-800">
      <SmartImage
        src={image}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, 50vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <span className="absolute inset-0 bg-gradient-to-r from-ink-900/85 via-ink-900/60 to-ink-900/20" />
      <div className="relative flex flex-col items-start gap-2 p-6 sm:p-8">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-300">
          {eyebrow}
        </span>
        <h3 className="max-w-xs text-xl font-semibold text-white">{title}</h3>
        <p className="text-sm text-white/75">{caption}</p>
        <Link href={href} className={`${buttonStyles('primary', 'sm')} mt-3`}>
          Shop now
        </Link>
      </div>
    </div>
  );
}
