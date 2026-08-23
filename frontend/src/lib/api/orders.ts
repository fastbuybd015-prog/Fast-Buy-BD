import { apiClient } from './client';
import type { CartItem, DeliveryDetails, Order, OrderStatus, PaymentMethod } from '@/types';

const LOCAL_STORAGE_ORDERS_KEY = 'fastshop_demo_orders';

function getStoredOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    if (!raw) {
      // Initialize with realistic defense demo orders
      const seedOrders: Order[] = [
        {
          id: 'ord-849102',
          orderNumber: 'FSB-20260818-849102',
          items: [
            {
              productId: 'prod-pran-mustard-oil-1l',
              name: 'PRAN Pure Mustard Oil',
              slug: 'pran-mustard-oil-1l',
              image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=60',
              store: 'Fast Mart',
              storeId: 'store-fast-mart',
              unit: '1 L',
              price: 305,
              originalPrice: 320,
              quantity: 2,
            },
            {
              productId: 'prod-aarong-dairy-full-cream-milk-1l',
              name: 'Aarong Dairy Liquid Milk',
              slug: 'aarong-liquid-milk-1l',
              image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60',
              store: 'Daily Basket',
              storeId: 'store-daily-basket',
              unit: '1 L',
              price: 98,
              originalPrice: 105,
              quantity: 3,
            },
          ],
          delivery: {
            fullName: 'Tanvir Ahmed',
            phone: '01712345678',
            email: 'tanvir.ahmed@example.com',
            address: 'House 42, Road 11, Sector 4, Uttara',
            city: 'Dhaka',
            area: 'Uttara',
            note: 'Please call before arriving',
          },
          paymentMethod: 'bkash',
          paymentStatus: 'VERIFIED',
          orderStatus: 'PACKED',
          subtotal: 904,
          discount: 45,
          deliveryFee: 60,
          total: 919,
          placedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          senderNumber: '01712345678',
          transactionId: '9K2L84X71Q',
          statusHistory: [
            {
              status: 'PENDING_PAYMENT',
              timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
              note: 'Order placed by customer',
            },
            {
              status: 'PAYMENT_SUBMITTED',
              timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
              note: 'bKash TrxID submitted: 9K2L84X71Q',
            },
            {
              status: 'PAYMENT_VERIFIED',
              timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              note: 'Verified by Admin (FastShop Finance)',
              changedBy: 'Admin',
            },
            {
              status: 'PROCESSING',
              timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
              note: 'Order dispatched to Fast Mart and Daily Basket',
            },
            {
              status: 'PACKED',
              timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
              note: 'All items bagged and prepared for pickup',
            },
          ],
        },
        {
          id: 'ord-849091',
          orderNumber: 'FSB-20260817-849091',
          items: [
            {
              productId: 'prod-miniket-rice-5kg',
              name: 'Miniket Rice Premium',
              slug: 'miniket-rice-premium-5kg',
              image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60',
              store: 'Fast Mart',
              storeId: 'store-fast-mart',
              unit: '5 kg',
              price: 395,
              originalPrice: 420,
              quantity: 1,
            },
          ],
          delivery: {
            fullName: 'Tanvir Ahmed',
            phone: '01712345678',
            email: 'tanvir.ahmed@example.com',
            address: 'House 42, Road 11, Sector 4, Uttara',
            city: 'Dhaka',
            area: 'Uttara',
          },
          paymentMethod: 'nagad',
          paymentStatus: 'VERIFIED',
          orderStatus: 'DELIVERED',
          subtotal: 395,
          discount: 25,
          deliveryFee: 60,
          total: 430,
          placedAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
          senderNumber: '01712345678',
          transactionId: '8N5X33P90Y',
          statusHistory: [
            {
              status: 'PENDING_PAYMENT',
              timestamp: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
            },
            {
              status: 'PAYMENT_VERIFIED',
              timestamp: new Date(Date.now() - 25 * 3600 * 1000).toISOString(),
            },
            {
              status: 'DELIVERED',
              timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
              note: 'Delivered by Express Courier',
            },
          ],
        },
      ];
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(seedOrders));
      return seedOrders;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredOrders(orders: Order[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // Ignore storage quota errors in demo
  }
}

export const ordersApi = {
  async getOrders(): Promise<Order[]> {
    try {
      return await apiClient<Order[]>('/orders');
    } catch {
      return getStoredOrders();
    }
  },

  async getOrderById(id: string): Promise<Order | null> {
    try {
      return await apiClient<Order>(`/orders/${id}`);
    } catch {
      const all = getStoredOrders();
      const match = all.find((o) => o.id === id || o.orderNumber === id);
      return match || all[0] || null;
    }
  },

  async createOrder(payload: {
    items: CartItem[];
    delivery: DeliveryDetails;
    paymentMethod: PaymentMethod;
    subtotal: number;
    discount: number;
    deliveryFee: number;
    couponCode?: string;
    total: number;
  }): Promise<Order> {
    try {
      return await apiClient<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      const orderId = `ord-${Math.floor(100000 + Math.random() * 900000)}`;
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const orderNumber = `FSB-${dateStr}-${orderId.slice(-4).toUpperCase()}`;

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        items: payload.items,
        delivery: payload.delivery,
        paymentMethod: payload.paymentMethod,
        paymentStatus: payload.paymentMethod === 'cod' ? 'PENDING' : 'PENDING',
        orderStatus: payload.paymentMethod === 'cod' ? 'PROCESSING' : 'PENDING_PAYMENT',
        subtotal: payload.subtotal,
        discount: payload.discount,
        deliveryFee: payload.deliveryFee,
        couponCode: payload.couponCode,
        total: payload.total,
        placedAt: new Date().toISOString(),
        statusHistory: [
          {
            status: 'PENDING_PAYMENT',
            timestamp: new Date().toISOString(),
            note: 'Order initiated by customer',
          },
        ],
      };

      const existing = getStoredOrders();
      saveStoredOrders([newOrder, ...existing]);
      return newOrder;
    }
  },

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    note?: string,
    changedBy = 'Admin',
  ): Promise<Order> {
    try {
      return await apiClient<Order>(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note }),
      });
    } catch {
      const orders = getStoredOrders();
      const orderIndex = orders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);

      if (orderIndex === -1) {
        throw new Error('Order not found');
      }

      const updatedHistory = [
        ...(orders[orderIndex].statusHistory || []),
        {
          status,
          timestamp: new Date().toISOString(),
          note: note || `Status updated to ${status}`,
          changedBy,
        },
      ];

      const updatedOrder: Order = {
        ...orders[orderIndex],
        orderStatus: status,
        statusHistory: updatedHistory,
      };

      orders[orderIndex] = updatedOrder;
      saveStoredOrders(orders);
      return updatedOrder;
    }
  },

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    return this.updateOrderStatus(orderId, 'CANCELLED', reason || 'Cancelled by customer', 'Customer');
  },
};
