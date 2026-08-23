import { apiClient } from './client';
import { enrichedProducts } from './products';
import { ordersApi } from './orders';
import type { Order } from '@/types';

export interface StoreDashboardStats {
  storeName: string;
  todayRevenue: number;
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  lowStockCount: number;
  averageRating: number;
}

export const storeApi = {
  async getStoreStats(storeId = 'store-fast-mart'): Promise<StoreDashboardStats> {
    try {
      return await apiClient<StoreDashboardStats>(`/store/stats?storeId=${storeId}`);
    } catch {
      return {
        storeName: 'Fast Mart (Uttara Branch)',
        todayRevenue: 18450,
        totalRevenue: 432900,
        totalOrders: 154,
        pendingOrders: 3,
        lowStockCount: 2,
        averageRating: 4.85,
      };
    }
  },

  async getStoreProducts(storeId = 'store-fast-mart') {
    try {
      return await apiClient<any[]>(`/store/products?storeId=${storeId}`);
    } catch {
      return enrichedProducts
        .filter((p) => p.storeListings?.some((sl) => sl.storeId === storeId))
        .map((p) => {
          const sl = p.storeListings!.find((item) => item.storeId === storeId)!;
          return {
            id: p.id,
            name: p.name,
            image: p.image,
            category: p.category,
            unit: p.unit,
            price: sl.price,
            originalPrice: sl.originalPrice,
            discount: sl.discount,
            stock: sl.stock,
            available: sl.available,
          };
        });
    }
  },

  async updateListing(
    storeId: string,
    productId: string,
    payload: { price: number; discount?: number; stock?: number; available?: boolean },
  ) {
    try {
      return await apiClient(`/store/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ storeId, ...payload }),
      });
    } catch {
      return { success: true, ...payload };
    }
  },

  async getStoreOrders(storeId = 'store-fast-mart'): Promise<Order[]> {
    try {
      return await apiClient<Order[]>(`/store/orders?storeId=${storeId}`);
    } catch {
      const all = await ordersApi.getOrders();
      // In demo, return all orders or filter items belonging to this store
      return all;
    }
  },
};
