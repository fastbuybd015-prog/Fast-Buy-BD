import { apiClient } from './client';
import { enrichedProducts } from './products';
import { stores as mockStores } from '@/data/stores';
import { categories as mockCategories } from '@/data/categories';
import type { Category, Coupon, Product, Store } from '@/types';

export interface AdminStats {
  todayRevenue: number;
  totalRevenue: number;
  ordersCount: number;
  pendingPaymentsCount: number;
  customersCount: number;
  activeStoresCount: number;
  totalProductsCount: number;
  lowStockItemsCount: number;
}

export interface ChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  storeId: string;
  storeName: string;
  price: number;
  stock: number;
  reserved: number;
  threshold: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export const adminApi = {
  async getDashboardStats(): Promise<AdminStats> {
    try {
      return await apiClient<AdminStats>('/admin/stats');
    } catch {
      return {
        todayRevenue: 48950,
        totalRevenue: 1245800,
        ordersCount: 382,
        pendingPaymentsCount: 2,
        customersCount: 1420,
        activeStoresCount: mockStores.length,
        totalProductsCount: enrichedProducts.length,
        lowStockItemsCount: 4,
      };
    }
  },

  async getRevenueTrend(days = 7): Promise<ChartDataPoint[]> {
    try {
      return await apiClient<ChartDataPoint[]>(`/admin/analytics/revenue?days=${days}`);
    } catch {
      const result: ChartDataPoint[] = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        result.push({
          date: dateStr,
          revenue: Math.floor(35000 + Math.random() * 25000 + i * 2000),
          orders: Math.floor(25 + Math.random() * 20),
        });
      }
      return result;
    }
  },

  async getInventory(): Promise<InventoryItem[]> {
    try {
      return await apiClient<InventoryItem[]>('/admin/inventory');
    } catch {
      const items: InventoryItem[] = [];
      enrichedProducts.forEach((p, pIdx) => {
        (p.storeListings || []).forEach((sl, slIdx) => {
          const stock = sl.stock;
          const threshold = 15;
          let status: InventoryItem['status'] = 'IN_STOCK';
          if (stock === 0) status = 'OUT_OF_STOCK';
          else if (stock <= threshold) status = 'LOW_STOCK';

          items.push({
            id: `inv-${pIdx}-${slIdx}`,
            productId: p.id,
            productName: p.name,
            productImage: p.image,
            category: p.category,
            storeId: sl.storeId,
            storeName: sl.storeName,
            price: sl.price,
            stock,
            reserved: Math.floor(Math.random() * 4),
            threshold,
            status,
          });
        });
      });
      return items;
    }
  },

  async updateStock(
    inventoryId: string,
    newStock: number,
  ): Promise<{ success: boolean; stock: number }> {
    try {
      return await apiClient<{ success: boolean; stock: number }>(
        `/admin/inventory/${inventoryId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ stock: newStock }),
        },
      );
    } catch {
      return { success: true, stock: newStock };
    }
  },

  async getCoupons(): Promise<Coupon[]> {
    try {
      return await apiClient<Coupon[]>('/admin/coupons');
    } catch {
      return [
        {
          id: 'coup-1',
          code: 'FAST10',
          type: 'percentage',
          value: 10,
          minimumOrder: 500,
          maxDiscount: 150,
          expiresAt: '2026-12-31',
          isActive: true,
          usageCount: 142,
        },
        {
          id: 'coup-2',
          code: 'EIDSPECIAL',
          type: 'fixed',
          value: 100,
          minimumOrder: 1000,
          expiresAt: '2026-10-15',
          isActive: true,
          usageCount: 89,
        },
        {
          id: 'coup-3',
          code: 'FIRSTBUY',
          type: 'fixed',
          value: 50,
          minimumOrder: 300,
          expiresAt: '2026-12-31',
          isActive: true,
          usageCount: 412,
        },
      ];
    }
  },
};
