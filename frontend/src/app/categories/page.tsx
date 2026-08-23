import Link from 'next/link';
import { categories } from '@/data/categories';
import { countProductsByCategory } from '@/data/products';
import { CategoryCard } from '@/components/category/CategoryCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Layers } from 'lucide-react';

export default function CategoriesOverviewPage() {
  return (
    <div className="container-page py-8 max-w-6xl">
      <SectionHeader
        title="All Product Categories"
        subtitle="Explore everyday groceries, fresh essentials, and household products"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 mt-6">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            productCount={countProductsByCategory(category.slug)}
          />
        ))}
      </div>
    </div>
  );
}
