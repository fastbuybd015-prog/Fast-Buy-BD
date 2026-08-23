'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useUser } from '@/context/user-context';
import { useToast } from '@/context/toast-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useUser();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const next: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = 'Enter a valid email address';
    if (password.length < 6) next.password = 'Password must be at least 6 characters';

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    window.setTimeout(() => {
      const user = login({ email, password });
      showToast({
        title: `Welcome back, ${user.name.split(' ')[0]}`,
        description: 'You are signed in to the demo account.',
      });
      router.push('/');
    }, 600);
  };

  const continueWithGoogle = () => {
    const user = login({ email: 'demo.user@gmail.com', password: 'google-demo' });
    showToast({
      title: `Signed in as ${user.name}`,
      description: 'Demo Google sign-in — no real account was used.',
      variant: 'info',
    });
    router.push('/');
  };

  return (
    <>
      <AuthShell
        title="Welcome back"
        subtitle="Sign in to continue shopping and track your membership."
        footer={
          <>
            New to Fast Buy BD?{' '}
            <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
              Create an account
            </Link>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          <TextInput
            label="Email address"
            type="email"
            required
            value={email}
            error={errors.email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((current) => ({ ...current, email: undefined }));
            }}
            placeholder="you@example.com"
            autoComplete="email"
            icon={<Mail className="h-4 w-4" aria-hidden />}
          />

          <div>
            <div className="relative">
              <TextInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                error={errors.password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((current) => ({ ...current, password: undefined }));
                }}
                placeholder="••••••••"
                autoComplete="current-password"
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

            <div className="mt-2 flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-brand-600" />
                Keep me signed in
              </label>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="rounded-sm text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 focus-ring"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <Button type="submit" size="lg" fullWidth loading={submitting}>
            {submitting ? 'Signing in…' : 'Login'}
          </Button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-ink-200 dark:bg-ink-800" />
            <span className="text-xs font-medium uppercase tracking-wide text-ink-400">or</span>
            <span className="h-px flex-1 bg-ink-200 dark:bg-ink-800" />
          </div>

          <Button type="button" variant="outline" size="lg" fullWidth onClick={continueWithGoogle}>
            <GoogleMark />
            Continue with Google
          </Button>

          <p className="rounded-lg bg-ink-50 dark:bg-ink-950 p-3 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
            Demo login — any valid looking email and a 6+ character password will sign you in.
            No credentials are sent anywhere.
          </p>
        </form>
      </AuthShell>

      <Modal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="Reset your password"
        description="This demo does not send real emails."
      >
        <p className="text-sm text-ink-600 dark:text-ink-300">
          In a production build we would email a reset link to your address. For this project
          you can sign in again with any email and password.
        </p>
        <Button className="mt-5" fullWidth onClick={() => setForgotOpen(false)}>
          Got it
        </Button>
      </Modal>
    </>
  );
}

function GoogleMark() {
  return (
    <span
      className="flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-ink-900 text-[11px] font-bold leading-none text-[#4285F4] ring-1 ring-ink-200 dark:ring-ink-800"
      aria-hidden
    >
      G
    </span>
  );
}
