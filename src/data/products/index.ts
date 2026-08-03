import type { Product } from '../../types';
import { skincareProducts } from './skincare';
import { haircareProducts } from './haircare';
import { bodycareProducts } from './bodycare';

export const categories = [
  { id: 'skincare', name: 'Skincare', nameAr: 'العناية بالبشرة' },
  { id: 'makeup', name: 'Makeup', nameAr: 'المكياج' },
  { id: 'fragrance', name: 'Fragrance', nameAr: 'العطور' },
  { id: 'haircare', name: 'Hair Care', nameAr: 'العناية بالشعر' },
  { id: 'bodycare', name: 'Body Care', nameAr: 'العناية بالجسم' },
];

export const brands = ['Dr. Karam', 'Lumière', 'Velvet Atelier', 'Noir Botanics', 'Maison Élan'];

/**
 * Full catalog, assembled from the per-category files below. To add products
 * at scale, edit the matching category file directly (skincare.ts, makeup.ts,
 * fragrance.ts, haircare.ts, bodycare.ts) — no need to touch this file unless
 * you're adding a brand-new category, in which case: create CategoryName.ts
 * following the same pattern, then import + spread it into this array.
 */
export const products: Product[] = [
  ...skincareProducts,
  ...haircareProducts,
  ...bodycareProducts,
];

export const getProductBySlug = (slug: string) => products.find((p) => p.slug === slug);
export const getFeatured = () => products.filter((p) => p.isFeatured);
export const getNewArrivals = () => products.filter((p) => p.isNew);
export const getFlashSale = () => products.filter((p) => p.isFlashSale);
export const getRelated = (product: Product) =>
  products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
