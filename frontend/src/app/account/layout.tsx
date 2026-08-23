import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My account',
  description: 'Your demo profile, membership status and recent order.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
