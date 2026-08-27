import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CartItem, Product } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { fetchOffers, isOfferActive, getBogoLabel } from '../lib/api/offers';
import { computeBogoDiscount, findActiveBogoOfferFor } from '../utils/bogo';
import { fetchCoupons, evaluateCoupon, type CouponValidationResult } from '../lib/api/coupons';

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
  couponDiscount: number;
  discount: number;
  bogoDiscount: number;
  bogoLabel: string | null;
  applyCoupon: (code: string) => CouponValidationResult;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<CartItem[]>('dk-cart', []);
  const [isOpen, setIsOpen] = useState(false);
  const [coupon, setCoupon] = useLocalStorage<string | null>('dk-coupon', null);
  const { data: offers = [] } = useQuery({ queryKey: ['offers'], queryFn: fetchOffers, staleTime: 60_000 });
  const { data: coupons = [] } = useQuery({ queryKey: ['coupons'], queryFn: fetchCoupons, staleTime: 60_000 });

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
    () => items.reduce((sum, i) => sum + (i.product.effectivePrice ?? i.product.price) * i.quantity, 0),
    [items]
  );

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  // Re-evaluated live against the current cart + coupon list — so if the admin
  // disables/deletes/edits a coupon mid-session, the applied discount updates
  // automatically instead of silently staying stale.
  const couponResult = useMemo(() => {
    if (!coupon) return { ok: false } as CouponValidationResult;
    const match = coupons.find((c) => c.code === coupon);
    return evaluateCoupon(match, items, subtotal);
  }, [coupon, coupons, items, subtotal]);

  const couponDiscount = couponResult.ok ? (couponResult.discount ?? 0) : 0;

  const bogoDiscount = useMemo(() => computeBogoDiscount(items, offers), [items, offers]);

  const bogoLabel = useMemo(() => {
    if (bogoDiscount <= 0) return null;
    const activeBogo = offers.filter((o) => o.discountType === 'bogo' && isOfferActive(o));
    const matched = items
      .map((i) => findActiveBogoOfferFor({ id: i.product.id, categoryId: i.product.categoryId }, activeBogo))
      .find(Boolean);
    return matched ? getBogoLabel(matched) : null;
  }, [bogoDiscount, offers, items]);

  const discount = couponDiscount + bogoDiscount;

  const applyCoupon = useCallback((code: string): CouponValidationResult => {
    const upper = code.trim().toUpperCase();
    const match = coupons.find((c) => c.code === upper);
    const result = evaluateCoupon(match, items, subtotal);
    if (result.ok) setCoupon(upper);
    return result;
  }, [coupons, items, subtotal, setCoupon]);

  const removeCoupon = useCallback(() => setCoupon(null), [setCoupon]);

  const value: CartContextValue = {
    items, addItem, removeItem, updateQuantity, clearCart,
    isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
    subtotal, itemCount, coupon: couponResult.ok ? coupon : null, couponDiscount, discount, bogoDiscount, bogoLabel, applyCoupon, removeCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
