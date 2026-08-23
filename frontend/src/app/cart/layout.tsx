import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping cart',
  description: 'Review the products in your Fast Buy BD basket before checkout.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
