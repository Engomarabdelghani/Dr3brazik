import { supabase } from '../supabase';
import type { PromoBanner, PromoBannerAction, Product } from '../../types';

interface PromoBannerRow {
  id: string;
  title: string;
  image: string;
  link: string | null;
  price: number | null;
  action_type: PromoBannerAction;
  sort_order: number;
  is_enabled: boolean;
  start_date: string | null;
  end_date: string | null;
  promo_banner_products?: { product_id: string }[];
}

function mapBanner(row: PromoBannerRow): PromoBanner {
  return {
    id: row.id,
    title: row.title,
    image: row.image,
    link: row.link ?? undefined,
    price: row.price != null ? Number(row.price) : undefined,
    actionType: row.action_type ?? 'link',
    productIds: row.promo_banner_products?.map((p) => p.product_id),
    sortOrder: row.sort_order,
    isEnabled: row.is_enabled,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
  };
}

export async function fetchPromoBanners(): Promise<PromoBanner[]> {
  const { data, error } = await supabase
    .from('promo_banners')
    .select('*, promo_banner_products(product_id)')
    .order('sort_order');
  if (error) throw error;

  return (data ?? [])
    .map(mapBanner)
    .filter((banner) => isPromoBannerActive(banner));
}

export interface PromoBannerInput {
  title: string;
  image: string;
  link?: string;
  price?: number;
  actionType: PromoBannerAction;
  productIds?: string[];
  sortOrder: number;
  isEnabled: boolean;
  startDate?: string;
  endDate?: string;
}

function toRow(input: PromoBannerInput) {
  return {
    title: input.title,
    image: input.image,
    link: input.actionType === 'link' ? (input.link || null) : null,
    price: input.actionType === 'deal' ? (input.price ?? null) : null,
    action_type: input.actionType,
    sort_order: input.sortOrder,
    is_enabled: input.isEnabled,
    start_date: input.startDate ?? null,
    end_date: input.endDate ?? null,
  };
}

export async function createPromoBanner(input: PromoBannerInput): Promise<void> {
  const { data, error } = await supabase.from('promo_banners').insert(toRow(input)).select('id').single();
  if (error) throw error;
  if (input.actionType === 'bundle' && input.productIds?.length) {
    await supabase.from('promo_banner_products').insert(input.productIds.map((productId) => ({ banner_id: data.id, product_id: productId })));
  }
}

export async function updatePromoBanner(id: string, input: PromoBannerInput): Promise<void> {
  const { error } = await supabase.from('promo_banners').update(toRow(input)).eq('id', id);
  if (error) throw error;
  await supabase.from('promo_banner_products').delete().eq('banner_id', id);
  if (input.actionType === 'bundle' && input.productIds?.length) {
    await supabase.from('promo_banner_products').insert(input.productIds.map((productId) => ({ banner_id: id, product_id: productId })));
  }
}

export async function deletePromoBanner(id: string): Promise<void> {
  const { error } = await supabase.from('promo_banners').delete().eq('id', id);
  if (error) throw error;
}

export function isPromoBannerActive(banner: PromoBanner): boolean {
  if (!banner.isEnabled) return false;

  const now = Date.now();
  if (banner.startDate && new Date(banner.startDate).getTime() > now) return false;
  if (banner.endDate && new Date(banner.endDate).getTime() < now) return false;

  return true;
}

/**
 * Builds a synthetic, cart-compatible "product" out of a shoppable promo banner
 * (actionType === 'deal') — so tapping the banner can go straight into the
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
