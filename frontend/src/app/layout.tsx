import type { Metadata } from 'next';
import { Inter, Noto_Sans_Bengali } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/header/Header';
import { Footer } from '@/components/footer/Footer';
import { AiAssistantWidget } from '@/components/chat/AiAssistantWidget';
import { CartProvider } from '@/context/cart-context';
import { UserProvider } from '@/context/user-context';
import { ToastProvider } from '@/context/toast-context';
import { ThemeProvider } from '@/context/theme-context';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

/** Inter has no glyph for the taka sign (৳), so Bengali text falls back here. */
const notoBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-bengali',
});

export const metadata: Metadata = {
  title: {
    default: 'Fast Buy BD',
    template: '%s · Fast Buy BD',
  },
  description:
    'Order packaged food, grocery staples, household, personal care, baby care, kitchen essentials from trusted stores across Bangladesh. Express delivery, transparent multi-store prices.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${notoBengali.variable}`}>
      <body className="min-h-screen font-sans bg-ink-50 text-ink-900 dark:bg-ink-950 dark:text-ink-50 transition-colors duration-200">
        <ThemeProvider>
          <ToastProvider>
            <UserProvider>
              <CartProvider>
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
                >
                  Skip to content
                </a>
                <Header />
                <main id="main-content">{children}</main>
                <Footer />
                <AiAssistantWidget />
              </CartProvider>
            </UserProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
