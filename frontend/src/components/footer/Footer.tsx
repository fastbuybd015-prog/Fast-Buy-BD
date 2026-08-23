'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter, Youtube } from 'lucide-react';
import { categories } from '@/data/categories';
import { Logo } from '@/components/ui/Logo';

const COMPANY_LINKS = [
  { href: '/about', label: 'About Fast Buy BD' },
  { href: '/stores', label: 'Our stores' },
  { href: '/subscription', label: 'Membership' },
  { href: '/account', label: 'My account' },
];

const SUPPORT_LINKS = [
  { href: '/support', label: 'Customer support' },
  { href: '/support#delivery', label: 'Delivery information' },
  { href: '/support#returns', label: 'Return policy' },
  { href: '/support#faq', label: 'FAQ' },
];

const LEGAL_LINKS = [
  { href: '/terms', label: 'Terms & conditions' },
  { href: '/privacy', label: 'Privacy policy' },
  { href: '/terms#refund', label: 'Refund policy' },
];

const SOCIALS = [
  { href: 'https://facebook.com', label: 'Facebook', icon: Facebook },
  { href: 'https://instagram.com', label: 'Instagram', icon: Instagram },
  { href: 'https://twitter.com', label: 'Twitter', icon: Twitter },
  { href: 'https://youtube.com', label: 'YouTube', icon: Youtube },
];

export function Footer() {
  const pathname = usePathname();

  // Do not render storefront footer on Admin and Store Merchant portals
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/store-dashboard')) {
    return null;
  }

  return (
    <footer className="mt-14 border-t border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 transition-colors">
      <div className="container-page py-10 lg:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo size="md" />
            <p className="mt-2 text-sm font-semibold text-brand-700 dark:text-brand-400">
              Your daily needs in discounted price
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500 dark:text-ink-400">
              An online marketplace connecting verified local stores with families across
              Bangladesh. Sealed and packaged products, honest prices, same day express delivery.
            </p>

            <ul className="mt-5 space-y-2 text-sm text-ink-600 dark:text-ink-400">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
                House 14, Road 7, Dhanmondi, Dhaka 1205
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
                16247 (9am – 10pm)
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
                support@fastbuybd.com
              </li>
            </ul>
          </div>

          <FooterColumn
            title="Categories"
            links={categories.slice(0, 6).map((category) => ({
              href: `/category/${category.slug}`,
              label: category.name,
            }))}
          />
          <FooterColumn title="Company" links={COMPANY_LINKS} />
          <FooterColumn title="Support" links={SUPPORT_LINKS} />
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-ink-100 dark:border-ink-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="link-muted">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 dark:border-ink-700 text-ink-500 dark:text-ink-400 transition-colors hover:border-brand-200 hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-700 dark:hover:text-brand-300 focus-ring"
              >
                <social.icon className="h-4 w-4" aria-hidden />
              </a>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-ink-400 dark:text-ink-500 sm:text-left">
          © {new Date().getFullYear()} Fast Buy BD. Transparent multi-store marketplace across Dhaka.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link href={link.href} className="link-muted">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
