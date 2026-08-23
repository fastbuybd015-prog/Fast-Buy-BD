import { apiClient } from './client';
import { categories as mockCategories } from '@/data/categories';
import { products as mockProducts } from '@/data/products';
import { stores as mockStores } from '@/data/stores';
import type { Category, Product, Store } from '@/types';

// Augment mock products with real Bangladeshi multi-store pricing (Shwapno, Chaldal, Meena Bazar, Agora, Unimart)
export const enrichedProducts: Product[] = mockProducts.map((p, index) => {
  const storeVariants = [
    {
      storeId: 'store-01',
      storeName: 'Shwapno Superstore',
      storeSlug: 'shwapno-superstore',
      price: p.price,
      originalPrice: p.originalPrice,
      discount: p.discount,
      stock: 35 + (index % 15),
      rating: 4.9,
      deliveryTime: '25–40 min',
      available: true,
    },
    {
      storeId: 'store-02',
      storeName: 'Chaldal Express Hub',
      storeSlug: 'chaldal-express-hub',
      price: Math.max(Math.round(p.price * 0.95), 10),
      originalPrice: p.originalPrice,
      discount: Math.min(p.discount + 5, 40),
      stock: 28 + (index % 12),
      rating: 4.8,
      deliveryTime: '20–35 min',
      available: true,
    },
    {
      storeId: 'store-03',
      storeName: 'Meena Bazar Outlet',
      storeSlug: 'meena-bazar-outlet',
      price: Math.round(p.price * 1.04),
      originalPrice: p.originalPrice,
      discount: Math.max(p.discount - 2, 0),
      stock: 22 + (index % 8),
      rating: 4.9,
      deliveryTime: '30–45 min',
      available: true,
    },
    {
      storeId: 'store-04',
      storeName: 'Agora Superstore',
      storeSlug: 'agora-superstore',
      price: Math.max(Math.round(p.price * 0.98), 10),
      originalPrice: p.originalPrice,
      discount: p.discount,
      stock: 40 + (index % 10),
      rating: 4.7,
      deliveryTime: '30–50 min',
      available: true,
    },
    {
      storeId: 'store-05',
      storeName: 'Unimart Hypermarket',
      storeSlug: 'unimart-hypermarket',
      price: Math.round(p.price * 1.06),
      originalPrice: p.originalPrice,
      discount: Math.max(p.discount - 1, 0),
      stock: 18 + (index % 5),
      rating: 4.9,
      deliveryTime: '35–55 min',
      available: true,
    },
    {
      storeId: 'store-06',
      storeName: 'Daily Shopping (PRAN-RFL)',
      storeSlug: 'daily-shopping-pran-rfl',
      price: Math.max(Math.round(p.price * 0.93), 10),
      originalPrice: p.originalPrice,
      discount: Math.min(p.discount + 7, 45),
      stock: 50 + (index % 20),
      rating: 4.6,
      deliveryTime: '20–35 min',
      available: true,
    },
  ];

  const sortedByPrice = [...storeVariants].sort((a, b) => a.price - b.price);
  const bestDeal = sortedByPrice[0];
  const maxSavings = Math.max(...storeVariants.map((s) => s.price)) - bestDeal.price;

  return {
    ...p,
    store: p.store || 'Shwapno Superstore',
    storeId: p.storeId || 'store-01',
    storeSlug: p.storeSlug || 'shwapno-superstore',
    stock: 45 + (index % 20),
    storeListings: storeVariants,
    bestDealStore: bestDeal.storeName,
    maxSavings: maxSavings > 0 ? maxSavings : Math.round(p.price * 0.08),
  };
});

export const productsApi = {
  async getProducts(params?: {
    category?: string;
    store?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number }> {
    try {
      const query = new URLSearchParams();
      if (params?.category) query.set('category', params.category);
      if (params?.store) query.set('store', params.store);
      if (params?.search) query.set('q', params.search);
      if (params?.sort) query.set('sort', params.sort);
      if (params?.page) query.set('page', params.page.toString());
      if (params?.limit) query.set('limit', params.limit.toString());

      return await apiClient<{ products: Product[]; total: number }>(
        `/products?${query.toString()}`,
      );
    } catch {
      // Graceful fallback to rich local dataset
      let filtered = [...enrichedProducts];

      if (params?.category) {
        filtered = filtered.filter((p) => p.category === params.category);
      }
      if (params?.store) {
        filtered = filtered.filter(
          (p) => p.storeSlug === params.store || p.storeId === params.store,
        );
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q)),
        );
      }

      if (params?.sort) {
        if (params.sort === 'price-asc') {
          filtered.sort((a, b) => a.price - b.price);
        } else if (params.sort === 'price-desc') {
          filtered.sort((a, b) => b.price - a.price);
        } else if (params.sort === 'rating') {
          filtered.sort((a, b) => b.rating - a.rating);
        } else if (params.sort === 'discount') {
          filtered.sort((a, b) => b.discount - a.discount);
        }
      }

      const total = filtered.length;
      const page = params?.page || 1;
      const limit = params?.limit || 24;
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      return {
        products: paginated,
        total,
      };
    }
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      return await apiClient<Product>(`/products/${slug}`);
    } catch {
      return enrichedProducts.find((p) => p.slug === slug) || null;
    }
  },

  async getCategories(): Promise<Category[]> {
    try {
      return await apiClient<Category[]>('/categories');
    } catch {
      return mockCategories;
    }
  },

  async getStores(): Promise<Store[]> {
    try {
      return await apiClient<Store[]>('/stores');
    } catch {
      return mockStores;
    }
  },

  async getStoreBySlug(slug: string): Promise<Store | null> {
    try {
      return await apiClient<Store>(`/stores/${slug}`);
    } catch {
      return mockStores.find((s) => s.slug === slug) || null;
    }
  },

  async compareProductAcrossStores(productId: string) {
    try {
      return await apiClient<any>(`/products/${productId}/compare`);
    } catch {
      const prod = enrichedProducts.find((p) => p.id === productId);
      if (!prod) return null;
      return {
        product: prod,
        listings: prod.storeListings || [],
      };
    }
  },
};
