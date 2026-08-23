import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Register and start your 1 day free trial of Fast Buy Membership.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
