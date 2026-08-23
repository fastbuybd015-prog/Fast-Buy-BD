'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Subscription, SubscriptionStatus, User, UserRole } from '@/types';
import { STORAGE_KEYS, readStorage, removeStorage, writeStorage } from '@/lib/storage';
import { SUBSCRIPTION_PRICE, TRIAL_DURATION_MS } from '@/lib/constants';

const EMPTY_SUBSCRIPTION: Subscription = {
  status: 'none',
  trialStartedAt: null,
  trialEndsAt: null,
  subscribedAt: null,
  pricePerMonth: SUBSCRIPTION_PRICE,
};

interface UserContextValue {
  user: User | null;
  role: UserRole;
  subscription: Subscription;
  /** Live status, recalculated as the trial clock runs out. */
  status: SubscriptionStatus;
  /** Milliseconds left in the trial, 0 when there is no active trial. */
  trialMsRemaining: number;
  hydrated: boolean;
  register: (input: { name: string; email: string; password?: string; role?: UserRole }) => User;
  login: (input: { email: string; password?: string; role?: UserRole }) => User;
  switchRole: (newRole: UserRole) => void;
  logout: () => void;
  startTrial: () => void;
  subscribe: () => void;
  updateProfile: (input: Partial<Pick<User, 'name' | 'phone' | 'address' | 'avatar'>>) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

function nameFromEmail(email: string): string {
  const handle = email.split('@')[0] ?? 'demo user';
  return handle
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function resolveStatus(subscription: Subscription, now: number): SubscriptionStatus {
  if (subscription.status === 'active') return 'active';
  if (!subscription.trialEndsAt) return 'none';
  return new Date(subscription.trialEndsAt).getTime() > now ? 'trial' : 'expired';
}

function detectRole(email: string, requestedRole?: UserRole): UserRole {
  if (requestedRole) return requestedRole;
  const lower = email.toLowerCase();
  if (lower.includes('admin')) return 'ADMIN';
  if (lower.includes('store') || lower.includes('merchant')) return 'STORE_OWNER';
  return 'CUSTOMER';
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription>(EMPTY_SUBSCRIPTION);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const savedUser = readStorage<User | null>(STORAGE_KEYS.user, null);
    // Ensure default role is present
    if (savedUser && !savedUser.role) {
      savedUser.role = 'CUSTOMER';
    }
    setUser(savedUser);
    setSubscription(readStorage<Subscription>(STORAGE_KEYS.subscription, EMPTY_SUBSCRIPTION));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (user) writeStorage(STORAGE_KEYS.user, user);
    else removeStorage(STORAGE_KEYS.user);
  }, [user, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeStorage(STORAGE_KEYS.subscription, subscription);
  }, [subscription, hydrated]);

  // Keeps the trial countdown moving without re-rendering the whole tree often.
  useEffect(() => {
    if (subscription.status === 'active' || !subscription.trialEndsAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [subscription.status, subscription.trialEndsAt]);

  const startTrial = useCallback(() => {
    const startedAt = new Date();
    setSubscription({
      status: 'trial',
      trialStartedAt: startedAt.toISOString(),
      trialEndsAt: new Date(startedAt.getTime() + TRIAL_DURATION_MS).toISOString(),
      subscribedAt: null,
      pricePerMonth: SUBSCRIPTION_PRICE,
    });
    setNow(Date.now());
  }, []);

  const register = useCallback<UserContextValue['register']>(
    ({ name, email, role }) => {
      const userRole = detectRole(email, role);
      const created: User = {
        id: `usr-${Date.now().toString(36)}`,
        name: name.trim() || nameFromEmail(email),
        email: email.trim().toLowerCase(),
        role: userRole,
        assignedStoreId: userRole === 'STORE_OWNER' ? 'store-fast-mart' : undefined,
        assignedStoreName: userRole === 'STORE_OWNER' ? 'Fast Mart' : undefined,
        createdAt: new Date().toISOString(),
      };
      setUser(created);
      startTrial();
      return created;
    },
    [startTrial],
  );

  const login = useCallback<UserContextValue['login']>(({ email, role }) => {
    const existing = readStorage<User | null>(STORAGE_KEYS.user, null);
    const userRole = detectRole(email, role);
    const signedIn: User =
      existing && existing.email === email.trim().toLowerCase()
        ? { ...existing, role: userRole }
        : {
            id: `usr-${Date.now().toString(36)}`,
            name: nameFromEmail(email),
            email: email.trim().toLowerCase(),
            role: userRole,
            assignedStoreId: userRole === 'STORE_OWNER' ? 'store-fast-mart' : undefined,
            assignedStoreName: userRole === 'STORE_OWNER' ? 'Fast Mart' : undefined,
            createdAt: new Date().toISOString(),
          };

    setUser(signedIn);
    return signedIn;
  }, []);

  const switchRole = useCallback((newRole: UserRole) => {
    setUser((current) => {
      if (!current) {
        return {
          id: `usr-demo-${newRole.toLowerCase()}`,
          name: newRole === 'ADMIN' ? 'Admin Officer' : newRole === 'STORE_OWNER' ? 'Store Manager' : 'Shopper Tanvir',
          email: `${newRole.toLowerCase()}@fastshop.com`,
          role: newRole,
          assignedStoreId: newRole === 'STORE_OWNER' ? 'store-fast-mart' : undefined,
          assignedStoreName: newRole === 'STORE_OWNER' ? 'Fast Mart' : undefined,
          createdAt: new Date().toISOString(),
        };
      }
      return {
        ...current,
        role: newRole,
        assignedStoreId: newRole === 'STORE_OWNER' ? 'store-fast-mart' : undefined,
        assignedStoreName: newRole === 'STORE_OWNER' ? 'Fast Mart' : undefined,
      };
    });
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const subscribe = useCallback(() => {
    setSubscription((current) => ({
      ...current,
      status: 'active',
      subscribedAt: new Date().toISOString(),
    }));
  }, []);

  const updateProfile = useCallback<UserContextValue['updateProfile']>((input) => {
    setUser((current) => (current ? { ...current, ...input } : current));
  }, []);

  const status = useMemo(() => resolveStatus(subscription, now), [subscription, now]);

  const trialMsRemaining = useMemo(() => {
    if (status !== 'trial' || !subscription.trialEndsAt) return 0;
    return Math.max(0, new Date(subscription.trialEndsAt).getTime() - now);
  }, [status, subscription.trialEndsAt, now]);

  const role = user?.role || 'CUSTOMER';

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      role,
      subscription,
      status,
      trialMsRemaining,
      hydrated,
      register,
      login,
      switchRole,
      logout,
      startTrial,
      subscribe,
      updateProfile,
    }),
    [
      user,
      role,
      subscription,
      status,
      trialMsRemaining,
      hydrated,
      register,
      login,
      switchRole,
      logout,
      startTrial,
      subscribe,
      updateProfile,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used inside <UserProvider>');
  }
  return context;
}
