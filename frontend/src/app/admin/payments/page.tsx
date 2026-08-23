'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  Search,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { paymentsApi } from '@/lib/api/payments';
import { useToast } from '@/context/toast-context';
import type { PaymentStatus, PaymentSubmission } from '@/types';

export default function AdminPaymentsPage() {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<PaymentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('SUBMITTED');
  const [searchQuery, setSearchQuery] = useState('');

  // Proof inspection modal
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState(
    'Transaction ID not found in official merchant statement.',
  );
  const [processingAction, setProcessingAction] = useState(false);

  const fetchPayments = async () => {
    try {
      const res = await paymentsApi.getAdminPayments();
      setPayments(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleVerify = async (paymentId: string) => {
    setProcessingAction(true);
    try {
      await paymentsApi.verifyPayment(paymentId);
      showToast('Payment verified successfully! Order moved to processing.', 'success');
      fetchPayments();
    } catch {
      showToast('Failed to verify payment', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingPaymentId) return;
    setProcessingAction(true);
    try {
      await paymentsApi.rejectPayment(rejectingPaymentId, rejectReason);
      showToast('Payment rejected. Customer notified.', 'info');
      setRejectModalOpen(false);
      setRejectingPaymentId(null);
      fetchPayments();
    } catch {
      showToast('Failed to reject payment', 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.orderNumber.toLowerCase().includes(q) ||
        p.transactionId.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.senderNumber.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50 tracking-tight">Payment Verification Queue</h1>
            <Badge tone="warning">Manual Review Required</Badge>
          </div>
          <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 mt-1">
            Audit customer bKash, Nagad, and Rocket mobile transactions before order dispatch
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPayments}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 text-xs font-semibold text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 dark:bg-ink-950 shadow-xs dark:shadow-none"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh List
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex rounded-xl bg-ink-100 dark:bg-ink-850 p-1">
          {[
            { id: 'SUBMITTED', label: 'Pending Review' },
            { id: 'VERIFIED', label: 'Verified' },
            { id: 'REJECTED', label: 'Rejected' },
            { id: 'ALL', label: 'All Records' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-ink-900 dark:bg-ink-800 text-ink-900 dark:text-ink-50 shadow-xs dark:shadow-none'
                  : 'text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-ink-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search TrxID, order, phone..."
            className="w-full rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 py-2 pl-9 pr-4 text-xs text-ink-900 dark:text-ink-50 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Payments Table */}
      <Card className="border-ink-100 dark:border-ink-800 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 text-center text-xs text-ink-500 dark:text-ink-400">Loading payment queue...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-16 text-center text-xs text-ink-400">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              No payment records matching this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-ink-100 dark:border-ink-800 bg-ink-50/60 dark:bg-ink-950/60 text-ink-500 dark:text-ink-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Sender Number</th>
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4">Proof</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {filteredPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-ink-50/50 dark:hover:bg-ink-800/50 dark:bg-ink-950/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-ink-900 dark:text-ink-50">
                        <Link
                          href={`/orders/${pay.orderId}`}
                          className="hover:text-brand-700 underline"
                        >
                          {pay.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-ink-800 dark:text-ink-100 font-medium">
                        <div>{pay.customerName}</div>
                        <div className="text-[11px] text-ink-400">{pay.customerPhone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold uppercase px-2 py-0.5 rounded text-[10px] ${
                            pay.method === 'bkash'
                              ? 'bg-pink-100 text-pink-800'
                              : pay.method === 'nagad'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {pay.method}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-ink-900 dark:text-ink-50 text-sm">
                        ৳{pay.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-ink-700 dark:text-ink-200">
                        {pay.senderNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-ink-900 dark:text-ink-50">
                        {pay.transactionId}
                      </td>
                      <td className="py-3.5 px-4">
                        {pay.proofUrl ? (
                          <button
                            type="button"
                            onClick={() => setSelectedProof(pay.proofUrl || null)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:text-brand-800"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Proof
                          </button>
                        ) : (
                          <span className="text-ink-400 text-[11px]">No image</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          tone={
                            pay.status === 'VERIFIED'
                              ? 'success'
                              : pay.status === 'REJECTED'
                              ? 'destructive'
                              : 'warning'
                          }
                        >
                          {pay.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {pay.status === 'SUBMITTED' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleVerify(pay.id)}
                              disabled={processingAction}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700 shadow-xs dark:shadow-none transition-colors"
                            >
                              Verify
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingPaymentId(pay.id);
                                setRejectModalOpen(true);
                              }}
                              disabled={processingAction}
                              className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 font-semibold text-[11px] hover:bg-red-100 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-ink-400">
                            {pay.verifiedAt ? `Verified on ${new Date(pay.verifiedAt).toLocaleDateString()}` : 'Closed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proof Inspection Modal */}
      <Modal
        open={Boolean(selectedProof)}
        onClose={() => setSelectedProof(null)}
        title="Payment Screenshot Inspection"
        description="Verify transaction details against your bKash / Nagad statement"
        size="lg"
      >
        {selectedProof && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-96 w-full rounded-xl overflow-hidden border border-ink-200 dark:border-ink-800 bg-ink-950">
              <img
                src={selectedProof}
                alt="Payment proof screenshot"
                className="h-full w-full object-contain"
              />
            </div>
            <button
              type="button"
              onClick={() => setSelectedProof(null)}
              className="w-full py-2.5 rounded-xl bg-ink-100 dark:bg-ink-850 text-ink-800 dark:text-ink-100 text-xs font-semibold hover:bg-ink-200"
            >
              Close Inspector
            </button>
          </div>
        )}
      </Modal>

      {/* Rejection Modal */}
      <Modal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Payment Submission"
        description="Specify the reason for payment rejection so customer can re-submit."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-200 mb-1">
              Rejection Reason
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-xl border border-ink-200 dark:border-ink-800 p-2.5 text-xs font-medium focus:border-red-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRejectModalOpen(false)}
              className="flex-1 rounded-xl border border-ink-200 dark:border-ink-800 py-2.5 text-xs font-semibold text-ink-700 dark:text-ink-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={processingAction}
              className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white hover:bg-red-700"
            >
              {processingAction ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
