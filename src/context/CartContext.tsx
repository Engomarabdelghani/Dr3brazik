import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CartItem, Product } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  subtotal: number;
  itemCount: number;
  coupon: string | null;
  discount: number;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const VALID_COUPONS: Record<string, number> = {
  KARAM10: 0.1,
  GOLD15: 0.15,
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<CartItem[]>('dk-cart', []);
  const [isOpen, setIsOpen] = useState(false);
  const [coupon, setCoupon] = useLocalStorage<string | null>('dk-coupon', null);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsOpen(true);
  }, [setItems]);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, [setItems]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.product.id !== productId)
        : prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  }, [setItems]);

  const clearCart = useCallback(() => setItems([]), [setItems]);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items]
  );

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const discount = useMemo(() => {
    if (!coupon || !VALID_COUPONS[coupon]) return 0;
    return Math.round(subtotal * VALID_COUPONS[coupon]);
  }, [coupon, subtotal]);

  const applyCoupon = useCallback((code: string) => {
    const upper = code.trim().toUpperCase();
    if (VALID_COUPONS[upper]) {
      setCoupon(upper);
      return true;
    }
    return false;
  }, [setCoupon]);

  const removeCoupon = useCallback(() => setCoupon(null), [setCoupon]);

  const value: CartContextValue = {
    items, addItem, removeItem, updateQuantity, clearCart,
    isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
    subtotal, itemCount, coupon, discount, applyCoupon, removeCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
