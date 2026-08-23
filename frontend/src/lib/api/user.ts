import { apiClient } from './client';
import type { Address, InAppNotification, User } from '@/types';

const LOCAL_STORAGE_ADDRESSES_KEY = 'fastshop_demo_addresses';
const LOCAL_STORAGE_NOTIFICATIONS_KEY = 'fastshop_demo_notifications';

function getStoredAddresses(): Address[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ADDRESSES_KEY);
    if (!raw) {
      const defaultAddresses: Address[] = [
        {
          id: 'addr-1',
          label: 'Home',
          recipientName: 'Tanvir Ahmed',
          phone: '01712345678',
          addressLine: 'House 42, Road 11, Sector 4, Uttara',
          city: 'Dhaka',
          area: 'Uttara',
          postalCode: '1230',
          isDefault: true,
        },
        {
          id: 'addr-2',
          label: 'Work',
          recipientName: 'Tanvir Ahmed',
          phone: '01712345678',
          addressLine: 'Level 8, Concord Tower, Banani',
          city: 'Dhaka',
          area: 'Banani',
          postalCode: '1213',
          isDefault: false,
        },
      ];
      localStorage.setItem(LOCAL_STORAGE_ADDRESSES_KEY, JSON.stringify(defaultAddresses));
      return defaultAddresses;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function getStoredNotifications(): InAppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_NOTIFICATIONS_KEY);
    if (!raw) {
      const seedNotifications: InAppNotification[] = [
        {
          id: 'notif-1',
          userId: 'usr-1',
          type: 'order',
          title: 'Order Packed & Ready!',
          message: 'Your order #FSB-20260818-849102 has been packed and handed over to courier.',
          referenceId: 'ord-849102',
          referenceType: 'order',
          isRead: false,
          createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        },
        {
          id: 'notif-2',
          userId: 'usr-1',
          type: 'payment',
          title: 'Payment Verified',
          message: 'Your bKash payment of ৳919 was verified successfully.',
          referenceId: 'ord-849102',
          referenceType: 'order',
          isRead: true,
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: 'notif-3',
          userId: 'usr-1',
          type: 'promo',
          title: 'Smart Budget Basket Ready',
          message: 'New lower prices on cooking oils and dairy in Uttara stores today.',
          isRead: true,
          createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        },
      ];
      localStorage.setItem(LOCAL_STORAGE_NOTIFICATIONS_KEY, JSON.stringify(seedNotifications));
      return seedNotifications;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export const userApi = {
  async getAddresses(): Promise<Address[]> {
    try {
      return await apiClient<Address[]>('/account/addresses');
    } catch {
      return getStoredAddresses();
    }
  },

  async addAddress(address: Omit<Address, 'id'>): Promise<Address> {
    try {
      return await apiClient<Address>('/account/addresses', {
        method: 'POST',
        body: JSON.stringify(address),
      });
    } catch {
      const newAddress: Address = {
        ...address,
        id: `addr-${Date.now()}`,
      };
      const addresses = getStoredAddresses();
      if (newAddress.isDefault) {
        addresses.forEach((a) => (a.isDefault = false));
      }
      addresses.push(newAddress);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_ADDRESSES_KEY, JSON.stringify(addresses));
      }
      return newAddress;
    }
  },

  async deleteAddress(id: string): Promise<boolean> {
    try {
      await apiClient(`/account/addresses/${id}`, { method: 'DELETE' });
      return true;
    } catch {
      const addresses = getStoredAddresses().filter((a) => a.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_ADDRESSES_KEY, JSON.stringify(addresses));
      }
      return true;
    }
  },

  async getNotifications(): Promise<InAppNotification[]> {
    try {
      return await apiClient<InAppNotification[]>('/account/notifications');
    } catch {
      return getStoredNotifications();
    }
  },

  async markNotificationAsRead(id: string): Promise<void> {
    try {
      await apiClient(`/account/notifications/${id}/read`, { method: 'PATCH' });
    } catch {
      const notifs = getStoredNotifications();
      const match = notifs.find((n) => n.id === id);
      if (match) match.isRead = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_NOTIFICATIONS_KEY, JSON.stringify(notifs));
      }
    }
  },
};
