import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, MapPin, Scale } from 'lucide-react';
import { getProductBySlug, getRelatedProducts, products } from '@/data/products';
import { getCategoryBySlug } from '@/data/categories';
import { getStoreById } from '@/data/stores';
import { ProductPurchase } from '@/components/product/ProductPurchase';
import { ProductRail } from '@/components/product/ProductGrid';
import { StorePriceComparison } from '@/components/product/StorePriceComparison';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SmartImage } from '@/components/ui/SmartImage';
import { Rating } from '@/components/ui/Rating';
import { buttonStyles } from '@/components/ui/Button';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) return { title: 'Product not found' };

  return { title: product.name, description: product.description };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) notFound();

  const category = getCategoryBySlug(product.category);
  const store = getStoreById(product.storeId);
  const related = getRelatedProducts(product, 4);

  return (
    <div className="container-page py-6 max-w-6xl">
      <Breadcrumbs
        items={[
          ...(category
            ? [{ label: category.name, href: `/category/${category.slug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <ProductPurchase product={product} />

      {/* Multi-Store Live Price Comparison Table */}
      <StorePriceComparison product={product} />

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <section className="surface-card p-5 sm:p-6 lg:col-span-8">
          <h2 className="section-title">Product description</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{product.description}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
            Every {product.name.toLowerCase()} order is checked by the store team before it
            leaves the shelf. If anything looks wrong on delivery, hand it back to the rider
            and we refund the item immediately — no paperwork.
          </p>

          <h3 className="mt-6 text-sm font-semibold text-ink-900 dark:text-ink-50">Product information</h3>
          <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Info label="Category" value={category?.name ?? '—'} />
            <Info label="Pack size" value={product.unit} />
            <Info label="Sold by" value={product.store} />
            <Info label="Availability" value={product.available ? 'In stock' : 'Out of stock'} />
            <Info label="Rating" value={`${product.rating.toFixed(1)} / 5 (${product.reviews} reviews)`} />
            <Info label="Product code" value={product.id.toUpperCase()} />
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-ink-100 dark:bg-ink-800 px-2.5 py-1 text-xs font-medium capitalize text-ink-600 dark:text-ink-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        {store ? (
          <aside className="surface-card overflow-hidden lg:col-span-4">
            <div className="relative h-24 bg-ink-100 dark:bg-ink-800">
              <SmartImage src={store.cover} alt="" fill sizes="400px" className="object-cover" />
              <span className="absolute inset-0 bg-gradient-to-t from-ink-900/45 to-transparent" />
            </div>
            <div className="p-5">
              <span className="relative -mt-12 block h-14 w-14 overflow-hidden rounded-xl border-2 border-white dark:border-ink-900 bg-ink-100 dark:bg-ink-800 shadow-card dark:shadow-none">
                <SmartImage src={store.logo} alt="" fill sizes="56px" className="object-cover" />
              </span>

              <div className="mb-3 mt-3 flex items-start justify-between gap-2">
                <h2 className="min-w-0 truncate text-base font-semibold text-ink-900 dark:text-ink-50">
                  {store.name}
                </h2>
                <Rating value={store.rating} className="mt-0.5 shrink-0" />
              </div>

              <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-300">{store.description}</p>

              <ul className="mt-4 space-y-2 text-xs text-ink-500 dark:text-ink-400">
                <li className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-ink-400 dark:text-ink-500" aria-hidden />
                  {store.location}
                </li>
                <li className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-ink-400 dark:text-ink-500" aria-hidden />
                  Delivery in {store.deliveryTime}
                </li>
              </ul>

              <Link
                href={`/store/${store.slug}`}
                className={`${buttonStyles('outline', 'md')} mt-5 w-full`}
              >
                Visit store page
              </Link>
            </div>
          </aside>
        ) : null}
      </div>

      {related.length > 0 ? (
        <section className="mt-10">
          <SectionHeader
            title="Related products"
            subtitle={`More from ${category?.name ?? 'this category'} and ${product.store}.`}
          />
          <ProductRail products={related} />
        </section>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink-100 dark:border-ink-800 pb-2 sm:border-none sm:pb-0">
      <dt className="text-sm text-ink-500 dark:text-ink-400">{label}</dt>
      <dd className="text-sm font-medium text-ink-900 dark:text-ink-50">{value}</dd>
    </div>
  );
}
