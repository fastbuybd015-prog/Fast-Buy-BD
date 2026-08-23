import Link from 'next/link';
import type { Category } from '@/types';
import { SmartImage } from '@/components/ui/SmartImage';

export function CategoryCard({
  category,
  productCount,
}: {
  category: Category;
  productCount: number;
}) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group flex flex-col items-center gap-2 rounded-card border border-ink-200 bg-white p-3 text-center shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover focus-ring dark:border-ink-800 dark:bg-ink-900 dark:shadow-none dark:hover:border-brand-800"
    >
      <span className="relative h-16 w-16 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800 sm:h-20 sm:w-20">
        <SmartImage
          src={category.image}
          alt={category.name}
          fill
          sizes="80px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </span>
      <span className="text-xs font-semibold leading-tight text-ink-900 dark:text-ink-50 sm:text-sm">
        {category.name}
      </span>
      <span className="text-[11px] text-ink-400 dark:text-ink-500">{productCount} items</span>
    </Link>
  );
}
