'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  ArrowLeft,
  Store as StoreIcon,
  MapPin,
  CreditCard,
  Upload,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { SmartImage } from '@/components/ui/SmartImage';
import { ordersApi } from '@/lib/api/orders';
import { paymentsApi } from '@/lib/api/payments';
import { useToast } from '@/context/toast-context';
import type { Order, OrderStatus } from '@/types';

const TIMELINE_STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'PENDING_PAYMENT', label: 'Order Placed', desc: 'Order details recorded in system' },
  { status: 'PAYMENT_SUBMITTED', label: 'Payment Submitted', desc: 'bKash / Nagad / Rocket TrxID submitted' },
  { status: 'PAYMENT_VERIFIED', label: 'Payment Verified', desc: 'Verified by FastShop Finance team' },
  { status: 'PROCESSING', label: 'Store Processing', desc: 'Stores preparing fresh inventory' },
  { status: 'PACKED', label: 'Packed & Bagged', desc: 'Ready at merchant counters' },
  { status: 'SHIPPED', label: 'Shipped with Courier', desc: 'Picked up by express delivery agent' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Courier rider is in your sector' },
  { status: 'DELIVERED', label: 'Delivered', desc: 'Order received and verified by customer' },
];

function getStepIndex(status: OrderStatus): number {
  switch (status) {
    case 'PENDING_PAYMENT':
      return 0;
    case 'PAYMENT_SUBMITTED':
      return 1;
    case 'PAYMENT_VERIFIED':
      return 2;
    case 'PROCESSING':
      return 3;
    case 'PACKED':
      return 4;
    case 'SHIPPED':
      return 5;
    case 'OUT_FOR_DELIVERY':
      return 6;
    case 'DELIVERED':
      return 7;
    case 'CANCELLED':
    case 'REFUNDED':
      return -1;
    default:
      return 0;
  }
}

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const { showToast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  // Manual payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await ordersApi.getOrderById(orderId);
      setOrder(res);
    } catch {
      showToast('Failed to load order tracking details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Real-time WebSocket connection for live order milestones
    const wsBaseUrl = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/^http/, 'ws')
      : 'ws://localhost:4000/api/v1';

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(`${wsBaseUrl}/orders/${orderId}/ws`);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'ORDER_STATUS_UPDATED') {
            fetchOrder();
            showToast(
              `Live Order Update: ${payload.data.orderStatus || payload.data.paymentStatus || 'Status changed'}`,
              'success',
            );
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
      };
    } catch {
      // fallback to standard API
    }

    return () => {
      ws?.close();
    };
  }, [orderId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderNumber || !transactionId) {
      showToast('Please enter your sender mobile number and Transaction ID', 'warning');
      return;
    }

    setSubmittingPayment(true);
    try {
      await paymentsApi.submitPayment({
        orderId,
        orderNumber: order?.orderNumber || orderId,
        method: paymentMethod,
        amount: order?.total || 0,
        senderNumber,
        transactionId: transactionId.trim().toUpperCase(),
        proofUrl:
          proofPreview ||
          'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60',
        customerName: order?.delivery.fullName || 'Shopper',
        customerPhone: order?.delivery.phone || senderNumber,
      });

      showToast('Payment submitted! Our team will verify and dispatch your order.', 'success');
      setPaymentModalOpen(false);
      fetchOrder();
    } catch {
      showToast('Failed to submit payment details', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="container-page py-16 flex flex-col items-center justify-center">
        <Clock className="h-8 w-8 text-brand-600 animate-spin mb-3" />
        <p className="text-sm text-ink-600 dark:text-ink-300">Loading live tracking details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-page py-16 text-center max-w-md mx-auto">
        <Package className="h-12 w-12 text-ink-300 dark:text-ink-600 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50 mb-2">Order Not Found</h2>
        <p className="text-sm text-ink-500 dark:text-ink-400 mb-6">
          Could not find an order matching #{orderId}.
        </p>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
      </div>
    );
  }

  const currentStep = getStepIndex(order.orderStatus);

  return (
    <div className="container-page py-8 max-w-5xl">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all orders
        </Link>

        <button
          type="button"
          onClick={fetchOrder}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850 text-xs font-semibold text-ink-700 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Live Status
        </button>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 shadow-xs mb-6 transition-colors">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink-900 dark:text-ink-50">
              {order.orderNumber || order.id}
            </h1>
            <Badge tone={order.paymentStatus === 'VERIFIED' ? 'success' : 'brand'}>
              {order.paymentStatus}
            </Badge>
            {wsConnected && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Tracking
              </span>
            )}
          </div>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
            Placed on {new Date(order.placedAt).toLocaleString('en-GB')}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-xs font-semibold text-ink-500 dark:text-ink-400">Order Total</div>
          <div className="text-2xl font-black text-brand-600 dark:text-brand-400">৳{order.total.toLocaleString()}</div>
        </div>
      </div>

      {/* Payment Action Prompt (if pending) — Theme-Harmonized Card */}
      {order.paymentStatus === 'PENDING' && order.paymentMethod !== 'cod' && (
        <div className="mb-6 rounded-2xl border border-brand-200 dark:border-brand-800 bg-brand-50/80 dark:bg-brand-950/40 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-ink-900 dark:text-ink-50">
                Payment Required to Begin Processing
              </h3>
              <p className="text-xs text-ink-600 dark:text-ink-300 mt-0.5">
                Send ৳{order.total} via bKash / Nagad / Rocket and submit your Transaction ID.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPaymentModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-xs transition-all shrink-0 focus-ring"
          >
            Submit TrxID Proof
          </button>
        </div>
      )}

      {/* Main Grid: Tracking Timeline + Summary */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: 8-Stage Realtime Tracking Timeline */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <Card className="border-ink-200 dark:border-ink-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                Live Order Timeline
              </CardTitle>
              <CardDescription>Real-time delivery milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-ink-200 dark:before:bg-ink-800">
                {TIMELINE_STEPS.map((step, idx) => {
                  const isDone = currentStep >= idx;
                  const isCurrent = currentStep === idx;

                  return (
                    <div key={step.status} className="relative flex items-start gap-3">
                      <div
                        className={`absolute -left-6 sm:-left-8 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border-2 transition-all ${
                          isDone
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-ink-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-300 dark:text-ink-600'
                        } ${isCurrent ? 'ring-4 ring-brand-500/20' : ''}`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-ink-300 dark:bg-ink-700" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold text-sm ${
                              isDone ? 'text-ink-900 dark:text-ink-50' : 'text-ink-400 dark:text-ink-500'
                            }`}
                          >
                            {step.label}
                          </span>
                          {isCurrent && (
                            <Badge tone="brand" className="text-[10px]">
                              Current State
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Details, Delivery Address & Payment Info */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Items Summary */}
          <Card className="border-ink-200 dark:border-ink-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                Ordered Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 pb-3 border-b border-ink-100 dark:border-ink-800 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative h-11 w-11 rounded-lg bg-ink-50 dark:bg-ink-800 overflow-hidden shrink-0">
                      <SmartImage src={item.image} alt={item.name} fill sizes="44px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-ink-900 dark:text-ink-100 truncate">{item.name}</div>
                      <div className="text-[11px] text-ink-500 dark:text-ink-400">
                        {item.store} • Qty {item.quantity}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-ink-900 dark:text-ink-50">
                    ৳{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Delivery & Payment Details */}
          <Card className="border-ink-200 dark:border-ink-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                Delivery & Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-start gap-2 text-ink-600 dark:text-ink-400">
                <MapPin className="h-4 w-4 text-ink-400 dark:text-ink-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-ink-900 dark:text-ink-100">{order.delivery.fullName}</div>
                  <div>{order.delivery.phone}</div>
                  <div className="text-ink-500 dark:text-ink-400">
                    {order.delivery.address}, {order.delivery.area}, {order.delivery.city}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-ink-100 dark:border-ink-800 flex items-center justify-between text-ink-600 dark:text-ink-400">
                <span>Payment Method</span>
                <span className="font-semibold text-ink-900 dark:text-ink-100 uppercase">
                  {order.paymentMethod}
                </span>
              </div>

              <div className="flex items-center justify-between text-ink-600 dark:text-ink-400">
                <span>Payment Status</span>
                <Badge tone={order.paymentStatus === 'VERIFIED' ? 'success' : 'warning'}>
                  {order.paymentStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Manual Payment Proof Submission Modal */}
      <Modal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Submit Mobile Payment Proof"
        description="Provide your sender number and bKash / Nagad / Rocket Transaction ID"
        size="lg"
      >
        <form onSubmit={handleSubmitPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1.5">
              Select Payment Channel
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'bkash', label: 'bKash', color: 'border-pink-300 bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300' },
                { id: 'nagad', label: 'Nagad', color: 'border-orange-300 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300' },
                { id: 'rocket', label: 'Rocket', color: 'border-purple-300 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`p-3 rounded-xl border text-center font-bold text-xs capitalize transition-all ${
                    paymentMethod === m.id
                      ? `${m.color} ring-2 ring-brand-500`
                      : 'border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850 text-ink-700 dark:text-ink-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-ink-50 dark:bg-ink-850 border border-ink-100 dark:border-ink-700 text-xs space-y-1">
            <div className="font-semibold text-ink-900 dark:text-ink-100">Merchant Account Number:</div>
            <div className="font-mono font-bold text-sm text-brand-700 dark:text-brand-400">
              {paymentMethod === 'bkash'
                ? '01711-223344 (bKash Merchant)'
                : paymentMethod === 'nagad'
                ? '01822-334455 (Nagad Merchant)'
                : '01933-445566 (Rocket Account)'}
            </div>
            <div className="text-ink-500 dark:text-ink-400">Amount to send: ৳{order.total}</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
              Your Sender Mobile Number
            </label>
            <input
              type="text"
              required
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value)}
              placeholder="e.g. 01712345678"
              className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850 p-2.5 text-xs text-ink-900 dark:text-ink-100 font-mono focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
              Transaction ID (TrxID)
            </label>
            <input
              type="text"
              required
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. 9J4K8L7M2N"
              className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-850 p-2.5 text-xs text-ink-900 dark:text-ink-100 font-mono font-bold uppercase focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
              Upload Screenshot Proof (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full text-xs text-ink-500 dark:text-ink-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 dark:file:bg-brand-950/60 file:text-brand-700 dark:file:text-brand-300 hover:file:bg-brand-100 cursor-pointer"
            />
            {proofPreview && (
              <div className="mt-2 relative h-32 w-full rounded-xl overflow-hidden border border-ink-200 dark:border-ink-700">
                <img
                  src={proofPreview}
                  alt="Proof preview"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPaymentModalOpen(false)}
              className="flex-1 rounded-xl border border-ink-200 dark:border-ink-700 py-2.5 text-xs font-semibold text-ink-700 dark:text-ink-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingPayment}
              className="flex-1 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white hover:bg-brand-700 shadow-md"
            >
              {submittingPayment ? 'Submitting...' : 'Submit Payment Proof'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
