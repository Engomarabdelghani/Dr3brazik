import { supabase } from '../supabase';
import type { Product } from '../../types';
import { mapProduct } from '../mappers';
import { fetchCategoryRows, fetchSubcategoryRows } from './categories';

export interface DashboardStats {
  productCount: number;
  visibleProductCount: number;
  outOfStockCount: number;
  categoryCount: number;
  offerCount: number;
  activeOfferCount: number;
  totalImages: number;
  recentProducts: Product[];
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [productCount, visibleProductCount, outOfStockCount, categoryCount, offerCount, activeOfferCount, recent, cats, subs, imageTotal] =
    await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_visible', true),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('stock', 0),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('offers').select('*', { count: 'exact', head: true }),
      supabase
        .from('offers')
        .select('*', { count: 'exact', head: true })
        .eq('is_enabled', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString()),
      supabase.from('products_with_effective_price').select('*, images').order('created_at', { ascending: false }).limit(5),
      fetchCategoryRows(),
      fetchSubcategoryRows(),
      supabase.rpc('total_product_images'),
    ]);

  const categoriesById = new Map(cats.map((c) => [c.id, { id: c.id, slug: c.slug, name: c.name }]));
  const subcategoriesById = new Map(subs.map((s) => [s.id, { id: s.id, slug: s.slug, name: s.name, categoryId: s.category_id }]));

  const recentProducts = (recent.data ?? []).map((row) => mapProduct(row, categoriesById, subcategoriesById));

  return {
    productCount: productCount.count ?? 0,
    visibleProductCount: visibleProductCount.count ?? 0,
    outOfStockCount: outOfStockCount.count ?? 0,
    categoryCount: categoryCount.count ?? 0,
    offerCount: offerCount.count ?? 0,
    activeOfferCount: activeOfferCount.count ?? 0,
    totalImages: (imageTotal.data as number) ?? 0,
    recentProducts,
  };
}
