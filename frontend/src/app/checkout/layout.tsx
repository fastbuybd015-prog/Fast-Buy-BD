import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Enter delivery details and place your demo order.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
