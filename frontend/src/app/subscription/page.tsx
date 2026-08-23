import type { Metadata } from 'next';
import { Check, Clock, Crown, Truck, Wallet, Zap } from 'lucide-react';
import { SubscriptionPanel } from '@/components/subscription/SubscriptionPanel';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Trial & subscription',
  description:
    'Start a 1 day free trial of Fast Buy Membership, then continue for only ৳50 per month.',
};

const PLANS = [
  {
    name: 'Free trial',
    price: 'Free',
    period: 'for 24 hours',
    highlight: false,
    features: [
      'Full member benefits for 1 day',
      'Free delivery while the trial runs',
      'No card required to start',
      'Ends automatically — no charge',
    ],
  },
  {
    name: 'Fast Buy Membership',
    price: '৳50',
    period: 'per month',
    highlight: true,
    features: [
      'Free delivery on every order',
      'Member prices on 200+ products',
      'Priority 30 minute delivery slots',
      'Early access to weekend campaigns',
      'Cancel anytime, no lock-in',
    ],
  },
];

const FAQS = [
  {
    question: 'What happens when the trial ends?',
    answer:
      'Nothing is charged automatically. The membership badge simply switches to “Trial expired” and you can subscribe for ৳50/month whenever you want.',
  },
  {
    question: 'Can I cancel the subscription?',
    answer:
      'Yes. There is no lock-in period. In this demo the subscription state is stored in your browser only.',
  },
  {
    question: 'Is any payment actually taken?',
    answer:
      'No. This is a university demo project — the subscribe button simulates a successful payment and shows the activated state.',
  },
];

export default function SubscriptionPage() {
  return (
    <div className="container-page py-6">
      <Breadcrumbs items={[{ label: 'Trial & subscription' }]} />

      <header className="mb-8 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
          <Crown className="h-3.5 w-3.5 text-amber-500" aria-hidden />
          Fast Buy Membership
        </span>
        <h1 className="mt-4 text-2xl font-bold text-ink-900 dark:text-ink-50 sm:text-3xl">
          Get 1 day free, then ৳50/month
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-ink-500 dark:text-ink-400 sm:text-base">
          Membership pays for itself in a single delivery. Try everything free for 24 hours
          and keep it only if you like it.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="space-y-4 lg:col-span-6">
          <SubscriptionPanel />

          <ul className="grid gap-3 sm:grid-cols-2">
            <Perk icon={<Truck className="h-4 w-4" aria-hidden />} title="Free delivery" caption="On every order, any basket size" />
            <Perk icon={<Wallet className="h-4 w-4" aria-hidden />} title="Member prices" caption="Extra savings on 200+ items" />
            <Perk icon={<Clock className="h-4 w-4" aria-hidden />} title="Priority slots" caption="30 minute delivery windows" />
            <Perk icon={<Zap className="h-4 w-4 text-amber-500" aria-hidden />} title="Early access" caption="Campaigns open 12 hours early" />
          </ul>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlight
                  ? 'relative rounded-card border-2 border-brand-500 bg-white dark:bg-ink-900 p-5 shadow-card-hover'
                  : 'rounded-card border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-5 shadow-card dark:shadow-none'
              }
            >
              {plan.highlight ? (
                <span className="absolute -top-3 left-5 rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  Most popular
                </span>
              ) : null}

              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">
                {plan.name}
              </h2>
              <p className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-ink-900 dark:text-ink-50">{plan.price}</span>
                <span className="text-sm text-ink-500 dark:text-ink-400">{plan.period}</span>
              </p>

              <ul className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="section-title mb-4">Frequently asked questions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {FAQS.map((faq) => (
            <div key={faq.question} className="surface-card p-5">
              <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">{faq.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Perk({
  icon,
  title,
  caption,
}: {
  icon: React.ReactNode;
  title: string;
  caption: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-card border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 p-4 shadow-card dark:shadow-none">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold text-ink-900 dark:text-ink-50">{title}</span>
        <span className="block text-xs text-ink-500 dark:text-ink-400">{caption}</span>
      </span>
    </li>
  );
}
