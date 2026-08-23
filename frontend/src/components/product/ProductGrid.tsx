import type { Product } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';
import { classNames } from '@/lib/format';

export function ProductGrid({
  products,
  className,
}: {
  products: Product[];
  className?: string;
}) {
  return (
    <div
      className={classNames(
        'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4',
        className,
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

/** Horizontally scrollable rail used on the home page. */
export function ProductRail({ products }: { products: Product[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-4 sm:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
      {products.map((product) => (
        <div
          key={product.id}
          className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-auto"
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
