'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BadgeCheck, Clock, Crown, TimerReset } from 'lucide-react';
import { useUser } from '@/context/user-context';
import { SUBSCRIPTION_PRICE } from '@/lib/constants';
import { useToast } from '@/context/toast-context';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCountdown, formatDate, formatPrice } from '@/lib/format';

/**
 * Trial / subscription state card. Used on the subscription page, the
 * registration success screen and the account page.
 */
export function SubscriptionPanel({ compact = false }: { compact?: boolean }) {
  const { user, subscription, status, trialMsRemaining, subscribe, startTrial, hydrated } =
    useUser();
  const { showToast } = useToast();
  const [processing, setProcessing] = useState(false);

  const handleSubscribe = () => {
    setProcessing(true);
    window.setTimeout(() => {
      subscribe();
      setProcessing(false);
      showToast({
        title: 'Subscription activated',
        description: `You are now an Fast Buy member at ${formatPrice(SUBSCRIPTION_PRICE)}/month.`,
      });
    }, 800);
  };

  if (!hydrated) {
    return <div className="h-48 animate-pulse rounded-card border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900" />;
  }

  return (
    <div className="overflow-hidden rounded-card border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 shadow-card dark:shadow-none transition-colors">
      <div className="border-b border-ink-100 dark:border-ink-800 bg-ink-50/70 dark:bg-ink-850/60 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900 dark:text-ink-50">
            <Crown className="h-4 w-4 text-amber-500" aria-hidden />
            Your membership
          </h2>
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="p-5">
        {status === 'active' ? (
          <div>
            <p className="flex items-center gap-2 text-base font-semibold text-ink-900 dark:text-ink-50">
              <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
              Subscription activated
            </p>
            <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
              {formatPrice(SUBSCRIPTION_PRICE)}/month · member since{' '}
              <strong className="text-ink-700 dark:text-ink-200 font-semibold">
                {subscription.subscribedAt ? formatDate(subscription.subscribedAt) : 'today'}
              </strong>
              . Cancel anytime from this page.
            </p>
          </div>
        ) : status === 'trial' ? (
          <div>
            <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Free trial</p>
            <p className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-bold text-ink-900 dark:text-ink-50">1 Day Free</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/60 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-300">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {formatCountdown(trialMsRemaining)}
              </span>
            </p>
            <p className="mt-2 text-xs text-ink-500 dark:text-ink-400">
              Your trial ends on{' '}
              {subscription.trialEndsAt ? formatDate(subscription.trialEndsAt) : 'tomorrow'}.
              After that, continue for {formatPrice(SUBSCRIPTION_PRICE)}/month.
            </p>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
              <div
                className="h-full rounded-full bg-brand-500 transition-[width] duration-500"
                style={{
                  width: `${Math.max(2, (trialMsRemaining / (24 * 60 * 60 * 1000)) * 100)}%`,
                }}
              />
            </div>
          </div>
        ) : status === 'expired' ? (
          <div>
            <p className="flex items-center gap-2 text-base font-semibold text-ink-900 dark:text-ink-50">
              <TimerReset className="h-5 w-5 text-accent-500" aria-hidden />
              Your free trial has ended
            </p>
            <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
              Subscribe for {formatPrice(SUBSCRIPTION_PRICE)}/month to keep free delivery,
              member prices and priority slots.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-base font-semibold text-ink-900 dark:text-ink-50">Start your 1 day free trial</p>
            <p className="mt-1.5 text-xs text-ink-500 dark:text-ink-400 leading-relaxed">
              {user
                ? 'Activate 24 hours of free membership — no card required.'
                : 'Create a free account and your 1 day trial starts immediately.'}
            </p>
          </div>
        )}

        {!compact ? (
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            {status === 'active' ? (
              <Link href="/" className={`${buttonStyles('outline', 'md')} w-full sm:w-auto`}>
                Continue shopping
              </Link>
            ) : status === 'none' && !user ? (
              <>
                <Link href="/register" className={buttonStyles('primary', 'md')}>
                  Create account & start trial
                </Link>
                <Link href="/login" className={buttonStyles('outline', 'md')}>
                  I already have an account
                </Link>
              </>
            ) : status === 'none' ? (
              <Button onClick={startTrial}>Start 1 day free trial</Button>
            ) : (
              <Button onClick={handleSubscribe} loading={processing}>
                {processing
                  ? 'Activating…'
                  : `Subscribe for ${formatPrice(SUBSCRIPTION_PRICE)}/month`}
              </Button>
            )}
          </div>
        ) : null}

        <p className="mt-4 text-[11px] leading-relaxed text-ink-400 dark:text-ink-500">
          Demo subscription — no payment method is collected and nothing is charged.
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'none' | 'trial' | 'expired' | 'active' }) {
  if (status === 'active') return <Badge tone="success">Active member</Badge>;
  if (status === 'trial') return <Badge tone="brand">Free trial active</Badge>;
  if (status === 'expired') return <Badge tone="danger">Trial expired</Badge>;
  return <Badge tone="muted">Not started</Badge>;
}
