import { useQuery } from '@tanstack/react-query';
import { fetchStorefrontProducts, fetchProductBySlug } from '../lib/api/products';
import { fetchCategories } from '../lib/api/categories';
import type { Product } from '../types';

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: fetchCategories, staleTime: 5 * 60_000 });
}

export function useProducts() {
  return useQuery({ queryKey: ['products'], queryFn: fetchStorefrontProducts, staleTime: 60_000 });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductBySlug(slug!),
    enabled: Boolean(slug),
  });
}

export const getFeatured = (products: Product[]) => products.filter((p) => p.isFeatured);
export const getNewArrivals = (products: Product[]) => products.filter((p) => p.isNew);
export const getFlashSale = (products: Product[]) => products.filter((p) => p.isFlashSale);
export const getRelated = (product: Product, products: Product[]) =>
  products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
