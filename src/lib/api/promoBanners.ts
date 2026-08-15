import { supabase } from '../supabase';
import type { PromoBanner, Product } from '../../types';

interface PromoBannerRow {
  id: string;
  title: string;
  image: string;
  link: string | null;
  price: number | null;
  sort_order: number;
  is_enabled: boolean;
}

function mapBanner(row: PromoBannerRow): PromoBanner {
  return {
    id: row.id,
    title: row.title,
    image: row.image,
    link: row.link ?? undefined,
    price: row.price != null ? Number(row.price) : undefined,
    sortOrder: row.sort_order,
    isEnabled: row.is_enabled,
  };
}

export async function fetchPromoBanners(): Promise<PromoBanner[]> {
  const { data, error } = await supabase.from('promo_banners').select('*').order('sort_order');
  if (error) throw error;
  return (data ?? []).map(mapBanner);
}

export interface PromoBannerInput {
  title: string;
  image: string;
  link?: string;
  price?: number;
  sortOrder: number;
  isEnabled: boolean;
}

export async function createPromoBanner(input: PromoBannerInput): Promise<void> {
  const { error } = await supabase.from('promo_banners').insert({
    title: input.title, image: input.image, link: input.link || null, price: input.price ?? null,
    sort_order: input.sortOrder, is_enabled: input.isEnabled,
  });
  if (error) throw error;
}

export async function updatePromoBanner(id: string, input: PromoBannerInput): Promise<void> {
  const { error } = await supabase.from('promo_banners').update({
    title: input.title, image: input.image, link: input.link || null, price: input.price ?? null,
    sort_order: input.sortOrder, is_enabled: input.isEnabled,
  }).eq('id', id);
  if (error) throw error;
}

export async function deletePromoBanner(id: string): Promise<void> {
  const { error } = await supabase.from('promo_banners').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Builds a synthetic, cart-compatible "product" out of a shoppable promo banner
 * (one with a price set) — so tapping the banner can go straight into the
 * existing cart/checkout flow without it being a real catalog product.
 */
export function bannerToDealProduct(banner: PromoBanner): Product {
  return {
    id: `deal-${banner.id}`,
    name: banner.title,
    slug: `deal-${banner.id}`,
    category: '',
    brand: '',
    price: banner.price ?? 0,
    currency: 'EGP',
    rating: 0,
    reviewCount: 0,
    images: [banner.image],
    shortDescription: banner.title,
    description: banner.title,
    ingredients: [],
    benefits: [],
    inStock: true,
    tags: [],
    isDeal: true,
  };
}
