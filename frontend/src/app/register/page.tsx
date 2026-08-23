'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Eye, EyeOff, Lock, Mail, User as UserIcon } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { SubscriptionPanel } from '@/components/subscription/SubscriptionPanel';
import { Button, buttonStyles } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { useUser } from '@/context/user-context';
import { SUBSCRIPTION_PRICE } from '@/lib/constants';
import { useToast } from '@/context/toast-context';
import { formatPrice } from '@/lib/format';

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const TRIAL_BENEFITS = [
  'Free delivery on every order',
  'Member only prices on 200+ items',
  'Priority 30 minute delivery slots',
];

export default function RegisterPage() {
  const { register } = useUser();
  const { showToast } = useToast();

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 3) next.name = 'Please enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = 'Enter a valid email address';
    if (form.password.length < 6) next.password = 'Use at least 6 characters';
    if (form.password !== form.confirmPassword)
      next.confirmPassword = 'Passwords do not match';

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    window.setTimeout(() => {
      const user = register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setSubmitting(false);
      setRegistered(true);
      showToast({
        title: `Account created for ${user.name.split(' ')[0]}`,
        description: 'Your 1 day free trial has started.',
      });
    }, 700);
  };

  if (registered) {
    return (
      <AuthShell
        title="Your free trial is active"
        subtitle="Welcome to Fast Buy BD — you have 24 hours of full membership."
        footer={
          <>
            Ready to shop?{' '}
            <Link href="/" className="font-semibold text-brand-600 hover:text-brand-700">
              Browse products
            </Link>
          </>
        }
      >
        <div className="space-y-4">
          <SubscriptionPanel />

          <div className="rounded-card border border-ink-200 dark:border-ink-800 bg-ink-50 dark:bg-ink-950 p-4">
            <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">After your trial ends</p>
            <p className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-brand-700">
                {formatPrice(SUBSCRIPTION_PRICE)}
              </span>
              <span className="text-sm text-ink-500 dark:text-ink-400">/ month</span>
            </p>
            <ul className="mt-3 space-y-1.5">
              {TRIAL_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <Link href="/subscription" className={`${buttonStyles('outline', 'md')} w-full`}>
            Manage membership
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Register once and get a 1 day free trial — no card required."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Login instead
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <TextInput
          label="Full name"
          required
          value={form.name}
          error={errors.name}
          onChange={(event) => update('name', event.target.value)}
          placeholder="Rana Ahmed"
          autoComplete="name"
          icon={<UserIcon className="h-4 w-4" aria-hidden />}
        />

        <TextInput
          label="Email address"
          type="email"
          required
          value={form.email}
          error={errors.email}
          onChange={(event) => update('email', event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          icon={<Mail className="h-4 w-4" aria-hidden />}
        />

        <div className="relative">
          <TextInput
            label="Password"
            type={showPassword ? 'text' : 'password'}
            required
            value={form.password}
            error={errors.password}
            hint="At least 6 characters"
            onChange={(event) => update('password', event.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            icon={<Lock className="h-4 w-4" aria-hidden />}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute right-3 top-[38px] rounded-md p-1 text-ink-400 transition-colors hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-ink-700 dark:hover:text-ink-300 focus-ring"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>

        <TextInput
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          required
          value={form.confirmPassword}
          error={errors.confirmPassword}
          onChange={(event) => update('confirmPassword', event.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          icon={<Lock className="h-4 w-4" aria-hidden />}
        />

        <div className="rounded-lg border border-brand-100 dark:border-brand-900/60 bg-brand-50 dark:bg-brand-950/60 p-3.5">
          <p className="text-sm font-semibold text-brand-800 dark:text-brand-300">
            Includes a 1 day free trial
          </p>
          <p className="mt-0.5 text-xs text-brand-700 dark:text-brand-400">
            Then {formatPrice(SUBSCRIPTION_PRICE)}/month. Cancel anytime — this is a demo, so
            nothing is charged.
          </p>
        </div>

        <Button type="submit" size="lg" fullWidth loading={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="text-center text-xs leading-relaxed text-ink-400">
          By registering you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-2 hover:text-ink-600 dark:hover:text-ink-300">
            terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-ink-600 dark:hover:text-ink-300">
            privacy policy
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}
