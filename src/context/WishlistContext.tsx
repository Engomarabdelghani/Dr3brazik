import { createContext, useCallback, useContext, type ReactNode } from 'react';
import type { Product } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface WishlistContextValue {
  items: Product[];
  toggle: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  remove: (productId: string) => void;
  clear: () => void;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<Product[]>('dk-wishlist', []);

  const toggle = useCallback((product: Product) => {
    setItems((prev) =>
      prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product]
    );
  }, [setItems]);

  const isInWishlist = useCallback((productId: string) => items.some((p) => p.id === productId), [items]);
  const remove = useCallback((productId: string) => setItems((prev) => prev.filter((p) => p.id !== productId)), [setItems]);
  const clear = useCallback(() => setItems([]), [setItems]);

  return (
    <WishlistContext.Provider value={{ items, toggle, isInWishlist, remove, clear }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
