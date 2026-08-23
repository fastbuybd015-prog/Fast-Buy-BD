'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, CheckCircle2, ArrowLeft, Package, CreditCard, BadgePercent } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { userApi } from '@/lib/api/user';
import type { InAppNotification } from '@/types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const res = await userApi.getNotifications();
      setNotifications(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id: string) => {
    await userApi.markNotificationAsRead(id);
    fetchNotifs();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="h-4 w-4 text-brand-600 dark:text-brand-400" />;
      case 'payment':
        return <CreditCard className="h-4 w-4 text-emerald-600 dark:emerald-400" />;
      default:
        return <BadgePercent className="h-4 w-4 text-accent-500" />;
    }
  };

  return (
    <div className="container-page py-8 max-w-3xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <Link
            href="/account"
            className="inline-flex items-center gap-1 text-xs font-semibold text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-200 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Account
          </Link>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Notifications</h1>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Realtime order milestones, payment confirmations, and smart grocery alerts
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-ink-500 dark:text-ink-400">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-800">
          <Bell className="h-8 w-8 text-ink-400 dark:text-ink-500 mx-auto mb-2" />
          <h3 className="font-semibold text-ink-900 dark:text-ink-50 text-sm">No notifications yet</h3>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">You will receive updates when your orders status changes.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notif) => {
            const timeStr = new Date(notif.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Card
                key={notif.id}
                className={`border-ink-100 dark:border-ink-800 transition-all ${
                  notif.isRead
                    ? 'bg-white dark:bg-ink-900'
                    : 'bg-brand-50/30 dark:bg-brand-950/40 border-brand-200 dark:border-brand-800'
                }`}
              >
                <CardContent className="p-4 flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-ink-100/70 dark:bg-ink-800 shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-xs text-ink-900 dark:text-ink-50">{notif.title}</h4>
                      <span className="text-[11px] text-ink-400 dark:text-ink-500">{timeStr}</span>
                    </div>
                    <p className="text-xs text-ink-600 dark:text-ink-300 mt-1">{notif.message}</p>

                    {notif.referenceId && (
                      <div className="mt-2">
                        <Link
                          href={`/orders/${notif.referenceId}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-800"
                        >
                          View Order Tracking →
                        </Link>
                      </div>
                    )}
                  </div>

                  {!notif.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(notif.id)}
                      className="text-[11px] font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-800 shrink-0"
                    >
                      Mark read
                    </button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
