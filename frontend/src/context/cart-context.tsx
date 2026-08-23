'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { CartItem, Product } from '@/types';
import { STORAGE_KEYS, readStorage, writeStorage } from '@/lib/storage';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '@/lib/constants';

interface CartTotals {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  totals: CartTotals;
  /** False during the first render pass, before localStorage is read. */
  hydrated: boolean;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  getQuantity: (productId: string) => number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const MAX_QUANTITY = 20;

function toCartItem(product: Product, quantity: number): CartItem {
  return {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    image: product.image,
    store: product.store,
    storeId: product.storeId,
    unit: product.unit,
    price: product.price,
    originalPrice: product.originalPrice,
    quantity,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStorage<CartItem[]>(STORAGE_KEYS.cart, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStorage(STORAGE_KEYS.cart, items);
  }, [items, hydrated]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (!existing) {
        return [...current, toCartItem(product, Math.min(quantity, MAX_QUANTITY))];
      }

      return current.map((item) =>
        item.productId === product.id
          ? { ...item, quantity: Math.min(item.quantity + quantity, MAX_QUANTITY) }
          : item,
      );
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter((item) => item.productId !== productId);
      }
      return current.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(quantity, MAX_QUANTITY) }
          : item,
      );
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const getQuantity = useCallback(
    (productId: string) =>
      items.find((item) => item.productId === productId)?.quantity ?? 0,
    [items],
  );

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  const totals = useMemo<CartTotals>(() => {
    const subtotal = items.reduce(
      (total, item) => total + item.originalPrice * item.quantity,
      0,
    );
    const payable = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
    const discount = subtotal - payable;
    const deliveryFee =
      items.length === 0 || payable >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

    return {
      subtotal,
      discount,
      deliveryFee,
      total: payable + deliveryFee,
    };
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      totals,
      hydrated,
      addItem,
      removeItem,
      setQuantity,
      getQuantity,
      clearCart,
    }),
    [items, itemCount, totals, hydrated, addItem, removeItem, setQuantity, getQuantity, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside <CartProvider>');
  }
  return context;
}
