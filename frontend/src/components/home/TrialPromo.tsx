import Link from 'next/link';
import { Check, Crown } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';
import { SUBSCRIPTION_PRICE } from '@/lib/constants';
import { formatPrice } from '@/lib/format';

const BENEFITS = [
  'Free delivery on every order',
  'Member only prices on 200+ items',
  'Priority 30 minute delivery slots',
  'Cancel anytime, no lock-in',
];

export function TrialPromo() {
  return (
    <section className="container-page mt-10">
      <div className="overflow-hidden rounded-card border border-brand-100 dark:border-brand-900 bg-brand-50 dark:bg-brand-950/60">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-12 lg:items-center lg:gap-10">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-ink-900 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300 shadow-sm">
              <Crown className="h-3.5 w-3.5 text-amber-500" aria-hidden />
              Fast Buy Membership
            </span>

            <h2 className="mt-4 text-2xl font-bold leading-tight text-ink-900 dark:text-ink-50 sm:text-3xl">
              Get 1 day free trial
            </h2>
            <p className="mt-2 max-w-lg text-sm text-ink-600 dark:text-ink-300 sm:text-base">
              Try every membership benefit free for 24 hours. When the trial ends, continue
              for only{' '}
              <strong className="font-semibold text-brand-700 dark:text-brand-400">
                {formatPrice(SUBSCRIPTION_PRICE)}/month
              </strong>{' '}
              — cancel whenever you like.
            </p>

            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-sm text-ink-700 dark:text-ink-200">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                  {benefit}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/register" className={buttonStyles('primary', 'lg')}>
                Start free trial
              </Link>
              <Link href="/subscription" className={buttonStyles('outline', 'lg')}>
                See membership details
              </Link>
            </div>
          </div>

          <div className="rounded-card border border-brand-100 dark:border-brand-900 bg-white dark:bg-ink-900 p-6 shadow-card dark:shadow-none lg:col-span-5">
            <p className="text-sm font-medium text-ink-500 dark:text-ink-400">Your trial</p>
            <p className="mt-1 text-3xl font-bold text-ink-900 dark:text-ink-50">1 Day Free</p>
            <div className="my-5 h-px bg-ink-100 dark:bg-ink-800" />
            <p className="text-sm font-medium text-ink-500 dark:text-ink-400">After the trial ends</p>
            <p className="mt-1 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-brand-700 dark:text-brand-400">
                {formatPrice(SUBSCRIPTION_PRICE)}
              </span>
              <span className="text-sm font-medium text-ink-500 dark:text-ink-400">/ month</span>
            </p>
            <p className="mt-4 text-xs leading-relaxed text-ink-400 dark:text-ink-500">
              Demo subscription — no payment is collected and nothing is charged to any card.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
