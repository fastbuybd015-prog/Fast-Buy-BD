import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Truck, ShieldCheck, ShoppingBag, Layers } from 'lucide-react';
import { categories, getCategoryBySlug } from '@/data/categories';
import { getProductsByCategory } from '@/data/products';
import { ProductBrowser } from '@/components/product/ProductBrowser';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SmartImage } from '@/components/ui/SmartImage';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) return { title: 'Category not found' };

  return {
    title: category.name,
    description: category.tagline,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) notFound();

  const products = getProductsByCategory(category.slug);

  return (
    <div className="container-page py-6">
      <Breadcrumbs items={[{ label: 'Categories', href: '/#categories' }, { label: category.name }]} />

      {/* Premium Category Showcase Banner */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-xs transition-colors">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-12 lg:items-center">
          {/* Left Content Area */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 dark:bg-brand-950/80 border border-brand-200/80 dark:border-brand-800/80 px-3 py-1 text-xs font-bold text-brand-700 dark:text-brand-300">
              <Layers className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
              <span>Verified Category Catalog</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink-900 dark:text-ink-50 tracking-tight">
                {category.name}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-ink-600 dark:text-ink-300 leading-relaxed max-w-xl">
                {category.tagline}
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-ink-50 dark:bg-ink-800/80 border border-ink-200/80 dark:border-ink-700 px-3 py-1.5 text-xs font-bold text-ink-800 dark:text-ink-200 shadow-2xs">
                <ShoppingBag className="h-3.5 w-3.5 text-brand-500" />
                {products.length} Products Available
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-xl bg-ink-50 dark:bg-ink-800/80 border border-ink-200/80 dark:border-ink-700 px-3 py-1.5 text-xs font-bold text-ink-800 dark:text-ink-200 shadow-2xs">
                <Truck className="h-3.5 w-3.5 text-emerald-500" />
                30-min Fast Delivery
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-xl bg-ink-50 dark:bg-ink-800/80 border border-ink-200/80 dark:border-ink-700 px-3 py-1.5 text-xs font-bold text-ink-800 dark:text-ink-200 shadow-2xs">
                <ShieldCheck className="h-3.5 w-3.5 text-accent-500" />
                100% Quality Guarantee
              </span>
            </div>
          </div>

          {/* Right Image Showcase Frame */}
          <div className="lg:col-span-5">
            <div className="relative h-44 sm:h-52 lg:h-56 w-full overflow-hidden rounded-2xl border border-ink-200/80 dark:border-ink-800 bg-ink-100 dark:bg-ink-850 shadow-2xs group">
              <SmartImage
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 1024px) 100vw, 450px"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                  {category.name} Collection
                </span>
                <span className="rounded-lg bg-brand-500 text-white px-2.5 py-1 text-[11px] font-bold shadow-xs">
                  Multi-Store Live
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProductBrowser products={products} />
    </div>
  );
}
