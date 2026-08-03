import { createContext, useCallback, useContext, type ReactNode } from 'react';
import type { Product } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface RecentlyViewedContextValue {
  items: Product[];
  addView: (product: Product) => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | undefined>(undefined);

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<Product[]>('dk-recently-viewed', []);

  const addView = useCallback((product: Product) => {
    setItems((prev) => [product, ...prev.filter((p) => p.id !== product.id)].slice(0, 8));
  }, [setItems]);

  return (
    <RecentlyViewedContext.Provider value={{ items, addView }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) throw new Error('useRecentlyViewed must be used within RecentlyViewedProvider');
  return ctx;
}
