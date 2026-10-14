import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { CartItem, Product } from '../types';
import type { CartQuote } from '../api/types';
import type { CartPromotions, GiftSelection } from '../api/promotionTypes';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { validateCoupon, type CouponValidationResult } from '../lib/api/coupons';
import { fetchCartQuote, toCartRefs } from '../lib/api/orders';

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
  /** Everything taken off the subtotal: promotions + coupon. */
  discount: number;
  promotionDiscount: number;
  /** Applied promotions, free gifts, gift choices and hints, as priced by the server. */
  promotions: CartPromotions;
  /** Gifts the customer picked, sent with every quote and with the order. */
  giftSelections: GiftSelection[];
  selectGifts: (promotionId: string, productIds: string[]) => void;
  /** Checks the code with the server; on success it is kept and applied to every quote. */
  applyCoupon: (code: string) => Promise<CouponValidationResult>;
  removeCoupon: () => void;
  /** The latest server quote (null until the first one arrives or when the cart is empty). */
  quote: CartQuote | null;
  /** true while the totals on screen are being re-priced (the cart just changed). */
  isPricing: boolean;
  /** Checkout passes the phone number so per-customer offers are right before the order is placed. */
  setCustomerPhone: (phone: string) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const NO_PROMOTIONS: CartPromotions = { applied: [], gifts: [], giftChoices: [], hints: [], notices: [] };

/**
 * The most a customer may have of this product in one order: the admin's
 * per-product "max quantity per order" and the actual stock on hand, whichever
 * is lower. Returns null when neither applies (no cap set, unlimited stock).
 * Synthetic banner "deal" items have no real stock, so they're never capped here.
 */
export function orderCapFor(product: Product): number | null {
  const caps: number[] = [];
  if (product.maxOrderQuantity != null) caps.push(product.maxOrderQuantity);
  if (!product.isDeal && product.stock != null) caps.push(product.stock);
  return caps.length ? Math.max(Math.min(...caps), 0) : null;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<CartItem[]>('dk-cart', []);
  const [isOpen, setIsOpen] = useState(false);
  const [coupon, setCoupon] = useLocalStorage<string | null>('dk-coupon', null);
  const [giftSelections, setGiftSelections] = useLocalStorage<GiftSelection[]>('dk-gifts', []);
  const [customerPhone, setCustomerPhone] = useState('');

  const refs = useMemo(() => toCartRefs(items), [items]);

  // The server prices the cart: saved snapshots can be days old, and coupons and
  // promotions are evaluated there. Re-fetched whenever the items, the coupon
  // or the chosen gifts change.
  const { data: quote = null, isFetching, isPlaceholderData } = useQuery({
    queryKey: ['cart-quote', refs, coupon, giftSelections, customerPhone],
    queryFn: () => fetchCartQuote({ items: refs, couponCode: coupon, giftSelections, customerPhone: customerPhone || null }),
    enabled: refs.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  // Bring the saved snapshots up to date with the quote (price, offer price, stock,
  // limit), and drop lines that can no longer be bought (hidden/deleted product, ended deal).
  useEffect(() => {
    if (!quote || quote.lines.length !== items.length) return;
    let changed = false;
    const next: CartItem[] = [];
    for (const item of items) {
      const line = quote.lines.find((l) => l.key === item.product.id);
      if (!line) {
        next.push(item);
        continue;
      }
      if (!line.available && line.problem !== 'LIMIT_EXCEEDED') {
        changed = true;
        continue;
      }
      const product = item.product;
      const fresh: Product = product.isDeal
        ? { ...product, price: line.price }
        : {
            ...product,
            price: line.price,
            // In the cart a product stands at its catalog price; promotions are shown as discounts on the line.
            effectivePrice: line.price,
            stock: line.stock ?? product.stock,
            inStock: (line.stock ?? 0) > 0,
            maxOrderQuantity: line.maxOrderQuantity ?? undefined,
          };
      const cap = line.cap;
      const quantity = cap != null && cap > 0 ? Math.min(item.quantity, cap) : item.quantity;
      if (
        fresh.price !== product.price ||
        fresh.effectivePrice !== product.effectivePrice ||
        fresh.stock !== product.stock ||
        fresh.maxOrderQuantity !== product.maxOrderQuantity ||
        quantity !== item.quantity
      ) {
        changed = true;
      }
      next.push({ product: fresh, quantity });
    }
    if (changed) setItems(next);
  }, [quote, items, setItems]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      const cap = orderCapFor(product);
      if (existing) {
        const nextQty = cap != null ? Math.min(existing.quantity + quantity, cap) : existing.quantity + quantity;
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: nextQty } : i
        );
      }
      const nextQty = cap != null ? Math.min(quantity, cap) : quantity;
      return [...prev, { product, quantity: nextQty }];
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
        : prev.map((i) => {
            if (i.product.id !== productId) return i;
            const cap = orderCapFor(i.product);
            return { ...i, quantity: cap != null ? Math.min(quantity, cap) : quantity };
          })
    );
  }, [setItems]);

  const clearCart = useCallback(() => {
    setItems([]);
    setGiftSelections([]);
  }, [setItems, setGiftSelections]);

  const selectGifts = useCallback((promotionId: string, productIds: string[]) => {
    setGiftSelections((prev) => [...prev.filter((s) => s.promotionId !== promotionId), { promotionId, productIds }]);
  }, [setGiftSelections]);

  // While the first quote loads, show the snapshot prices.
  const localSubtotal = useMemo(
    () => items.reduce((sum, i) => sum + (i.product.effectivePrice ?? i.product.price) * i.quantity, 0),
    [items]
  );
  const subtotal = quote?.subtotal ?? localSubtotal;

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  // A coupon that stops applying (disabled, expired, cart changed) silently stops discounting, as before.
  const couponOk = quote?.coupon?.ok === true;
  const couponDiscount = couponOk ? quote!.couponDiscount : 0;
  // Promotions are never estimated in the browser: until the server has priced them, they are 0.
  const promotionDiscount = quote?.promotionDiscount ?? 0;
  const discount = couponDiscount + promotionDiscount;

  const applyCoupon = useCallback(async (code: string): Promise<CouponValidationResult> => {
    const upper = code.trim().toUpperCase();
    if (!upper) return { ok: false, message: 'Invalid coupon code' };
    try {
      const result = await validateCoupon(upper, refs);
      if (!result.ok) return { ok: false, message: result.message };
      setCoupon(upper);
      return { ok: true, discount: result.discount };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Could not check this code. Please try again.' };
    }
  }, [refs, setCoupon]);

  const removeCoupon = useCallback(() => setCoupon(null), [setCoupon]);

  const hasItems = items.length > 0;
  const value: CartContextValue = {
    items, addItem, removeItem, updateQuantity, clearCart,
    isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
    subtotal, itemCount, coupon: couponOk ? coupon : null, couponDiscount, discount, applyCoupon, removeCoupon,
    promotionDiscount,
    // An API still on an older version (mid-deploy) sends a quote without promotions; the page must not crash on it.
    promotions: (hasItems && quote?.promotions) || NO_PROMOTIONS,
    giftSelections,
    selectGifts,
    quote: hasItems ? quote : null,
    // Not `!quote`: if the quote request fails, checkout must still be possible (the server prices the order anyway).
    isPricing: hasItems && (isFetching || isPlaceholderData),
    setCustomerPhone,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
