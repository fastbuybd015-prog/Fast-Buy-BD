import Link from 'next/link';
import { Check } from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { Logo } from '@/components/ui/Logo';
import { banner } from '@/lib/images';

const HIGHLIGHTS = [
  'One basket across six trusted stores',
  '1 day free trial, then only ৳50/month',
  'Free delivery on orders over ৳1,000',
];

const AUTH_BANNER = banner('1601599561213-832382fd07ba', 900, 1200);

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="container-page py-8 lg:py-12">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-card border border-ink-200 bg-white shadow-card lg:grid-cols-2">
        <div className="order-2 p-6 sm:p-8 lg:order-1 lg:p-10">
          <div className="mb-6">
            <Logo size="md" />
          </div>

          <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>

          <div className="mt-6">{children}</div>

          <div className="mt-6 border-t border-ink-100 pt-5 text-center text-sm text-ink-500">
            {footer}
          </div>
        </div>

        <div className="relative order-1 min-h-[180px] bg-ink-900 lg:order-2">
          <SmartImage
            src={AUTH_BANNER}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-ink-900/95 via-ink-900/70 to-ink-900/30" />

          <div className="relative flex h-full flex-col justify-end gap-4 p-6 sm:p-8 lg:p-10">
            <p className="text-lg font-semibold leading-snug text-white sm:text-xl">
              Your daily needs in discounted price, delivered in 45 minutes.
            </p>
            <ul className="space-y-2">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-white/85">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
