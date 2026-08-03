import type { Product } from '../types';
import { products as generatedProducts } from './generated';

export { categories, brands, getCategory, getSubcategory } from './taxonomy';
export type { Category, Subcategory } from './taxonomy';

/**
 * The full product catalog. This is assembled from src/data/generated/,
 * which is auto-generated from scripts/products.csv — see scripts/generate-products.mjs.
 *
 * To add/edit/remove products at any scale (including 1000+), edit
 * scripts/products.csv (in Excel, Google Sheets, or a text editor) and run:
 *   npm run catalog
 * Do not add products directly in this file — they'll be lost on next generate.
 */
export const products: Product[] = generatedProducts;

export const getProductBySlug = (slug: string) => products.find((product) => product.slug === slug);
export const getFeatured = () => products.filter((product) => product.isFeatured);
export const getNewArrivals = () => products.filter((product) => product.isNew);
export const getFlashSale = () => products.filter((product) => product.isFlashSale);
export const getRelated = (product: Product) =>
  products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4);
export const getByCategory = (categoryId: string) => products.filter((p) => p.category === categoryId);
export const getBySubcategory = (categoryId: string, subcategoryId: string) =>
  products.filter((p) => p.category === categoryId && p.subcategory === subcategoryId);
