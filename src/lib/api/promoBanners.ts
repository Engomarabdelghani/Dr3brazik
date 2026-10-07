import { api } from '../../api/client';
import type { PromoBanner, PromoBannerAction, Product } from '../../types';

/** Storefront: active banners only (enabled + inside their date window, checked by the server). */
export async function fetchPromoBanners(): Promise<PromoBanner[]> {
  return api.get<PromoBanner[]>('/promo-banners');
}

/** Admin: every banner, so disabled or expired ones can be edited and re-enabled. */
export async function fetchAdminPromoBanners(): Promise<PromoBanner[]> {
  return api.get<PromoBanner[]>('/admin/promo-banners');
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

export async function createPromoBanner(input: PromoBannerInput): Promise<void> {
  await api.post('/admin/promo-banners', input);
}

export async function updatePromoBanner(id: string, input: PromoBannerInput): Promise<void> {
  await api.put(`/admin/promo-banners/${id}`, input);
}

export async function deletePromoBanner(id: string): Promise<void> {
  await api.delete(`/admin/promo-banners/${id}`);
}

export function isPromoBannerActive(banner: PromoBanner): boolean {
  if (!banner.isEnabled) return false;

  const now = Date.now();
  if (banner.startDate && new Date(banner.startDate).getTime() > now) return false;
  if (banner.endDate && new Date(banner.endDate).getTime() < now) return false;

  return true;
}

/** Cart id prefix for deal items; the API receives the banner id as `dealBannerId`. */
export const DEAL_ID_PREFIX = 'deal-';

/**
 * Builds a synthetic, cart-compatible "product" out of a shoppable promo banner
 * (actionType === 'deal'), so tapping the banner goes straight into the
 * cart/checkout flow. The server prices it from the banner at checkout.
 */
export function bannerToDealProduct(banner: PromoBanner): Product {
  return {
    id: `${DEAL_ID_PREFIX}${banner.id}`,
    name: banner.title,
    slug: `${DEAL_ID_PREFIX}${banner.id}`,
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
