/**
 * Tiny localStorage helpers. Everything is wrapped in try/catch so the demo
 * keeps working in private windows or when storage is unavailable.
 */

export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — the demo still works from memory */
  }
}

export function removeStorage(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const STORAGE_KEYS = {
  cart: 'fastbuybd.cart',
  user: 'fastbuybd.user',
  subscription: 'fastbuybd.subscription',
  lastOrder: 'fastbuybd.lastOrder',
} as const;
