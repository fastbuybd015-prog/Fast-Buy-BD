import { apiClient } from './client';
import { ordersApi } from './orders';
import type { PaymentSubmission } from '@/types';

const LOCAL_STORAGE_PAYMENTS_KEY = 'fastshop_demo_payments';

function getStoredPayments(): PaymentSubmission[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY);
    if (!raw) {
      const seedPayments: PaymentSubmission[] = [
        {
          id: 'pay-001',
          orderId: 'ord-849102',
          orderNumber: 'FSB-20260818-849102',
          customerName: 'Tanvir Ahmed',
          customerPhone: '01712345678',
          method: 'bkash',
          amount: 919,
          senderNumber: '01712345678',
          transactionId: '9K2L84X71Q',
          proofUrl:
            'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60',
          status: 'VERIFIED',
          submittedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
          verifiedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          verifiedBy: 'Admin (Finance)',
        },
        {
          id: 'pay-002',
          orderId: 'ord-849150',
          orderNumber: 'FSB-20260819-849150',
          customerName: 'Sadia Rahman',
          customerPhone: '01898765432',
          method: 'nagad',
          amount: 1450,
          senderNumber: '01898765432',
          transactionId: '7M4T99B12W',
          proofUrl:
            'https://images.unsplash.com/photo-1556742049-0a67e55722c0?w=600&auto=format&fit=crop&q=60',
          status: 'SUBMITTED',
          submittedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        {
          id: 'pay-003',
          orderId: 'ord-849162',
          orderNumber: 'FSB-20260819-849162',
          customerName: 'Rahim Uddin',
          customerPhone: '01911223344',
          method: 'rocket',
          amount: 720,
          senderNumber: '01911223344',
          transactionId: '5R8P22N60K',
          status: 'SUBMITTED',
          submittedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        },
      ];
      localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(seedPayments));
      return seedPayments;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredPayments(payments: PaymentSubmission[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(payments));
  } catch {
    // Ignore storage quota in demo
  }
}

export const paymentsApi = {
  async submitPayment(payload: {
    orderId: string;
    orderNumber?: string;
    customerName?: string;
    customerPhone?: string;
    method: 'bkash' | 'nagad' | 'rocket';
    amount: number;
    senderNumber: string;
    transactionId: string;
    proofUrl?: string;
  }): Promise<PaymentSubmission> {
    try {
      return await apiClient<PaymentSubmission>('/payments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      const newSubmission: PaymentSubmission = {
        id: `pay-${Math.floor(100 + Math.random() * 900)}`,
        orderId: payload.orderId,
        orderNumber: payload.orderNumber || `FSB-${payload.orderId}`,
        customerName: payload.customerName || 'Customer',
        customerPhone: payload.customerPhone || payload.senderNumber,
        method: payload.method,
        amount: payload.amount,
        senderNumber: payload.senderNumber,
        transactionId: payload.transactionId.toUpperCase(),
        proofUrl: payload.proofUrl,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
      };

      const existing = getStoredPayments();
      saveStoredPayments([newSubmission, ...existing]);

      // Update associated order status
      try {
        await ordersApi.updateOrderStatus(
          payload.orderId,
          'PAYMENT_SUBMITTED',
          `Payment submitted via ${payload.method.toUpperCase()} (TrxID: ${payload.transactionId})`,
          'Customer',
        );
      } catch {
        // Continue even if local order lookup failed
      }

      return newSubmission;
    }
  },

  async getPaymentByOrderId(orderId: string): Promise<PaymentSubmission | null> {
    try {
      return await apiClient<PaymentSubmission>(`/payments/order/${orderId}`);
    } catch {
      const all = getStoredPayments();
      return all.find((p) => p.orderId === orderId) || null;
    }
  },

  async getAdminPayments(status?: 'SUBMITTED' | 'VERIFIED' | 'REJECTED'): Promise<PaymentSubmission[]> {
    try {
      const query = status ? `?status=${status}` : '';
      return await apiClient<PaymentSubmission[]>(`/admin/payments${query}`);
    } catch {
      const all = getStoredPayments();
      if (status) {
        return all.filter((p) => p.status === status);
      }
      return all;
    }
  },

  async verifyPayment(paymentId: string): Promise<PaymentSubmission> {
    try {
      return await apiClient<PaymentSubmission>(`/admin/payments/${paymentId}/verify`, {
        method: 'PATCH',
      });
    } catch {
      const payments = getStoredPayments();
      const index = payments.findIndex((p) => p.id === paymentId);
      if (index === -1) throw new Error('Payment record not found');

      const updated: PaymentSubmission = {
        ...payments[index],
        status: 'VERIFIED',
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'Admin (Finance)',
      };

      payments[index] = updated;
      saveStoredPayments(payments);

      // Update order to verified & processing
      try {
        await ordersApi.updateOrderStatus(
          updated.orderId,
          'PAYMENT_VERIFIED',
          `Payment of ৳${updated.amount} verified by Admin`,
          'Admin',
        );
      } catch {
        // Continue
      }

      return updated;
    }
  },

  async rejectPayment(paymentId: string, rejectionReason: string): Promise<PaymentSubmission> {
    try {
      return await apiClient<PaymentSubmission>(`/admin/payments/${paymentId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ rejectionReason }),
      });
    } catch {
      const payments = getStoredPayments();
      const index = payments.findIndex((p) => p.id === paymentId);
      if (index === -1) throw new Error('Payment record not found');

      const updated: PaymentSubmission = {
        ...payments[index],
        status: 'REJECTED',
        rejectionReason,
      };

      payments[index] = updated;
      saveStoredPayments(payments);
      return updated;
    }
  },
};
