import { useQuery } from '@tanstack/react-query';
import { fetchStorefrontProducts, fetchProductBySlug } from '../lib/api/products';
import { fetchCategories } from '../lib/api/categories';
import { fetchOffers } from '../lib/api/offers';
import { fetchPromoBanners } from '../lib/api/promoBanners';
import { fetchShippingZones } from '../lib/api/shippingZones';
import { fetchSocialPosts } from '../lib/api/socialPosts';
import { fetchTestimonials } from '../lib/api/testimonials';
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

export function useOffers() {
  return useQuery({ queryKey: ['offers'], queryFn: fetchOffers, staleTime: 60_000 });
}

export function usePromoBanners() {
  return useQuery({ queryKey: ['promo-banners'], queryFn: fetchPromoBanners, staleTime: 5 * 60_000 });
}

export function useShippingZones() {
  return useQuery({ queryKey: ['shipping-zones'], queryFn: fetchShippingZones, staleTime: 5 * 60_000 });
}

export function useSocialPosts() {
  return useQuery({ queryKey: ['social-posts'], queryFn: fetchSocialPosts, staleTime: 5 * 60_000 });
}

export function useTestimonials() {
  return useQuery({ queryKey: ['testimonials'], queryFn: fetchTestimonials, staleTime: 5 * 60_000 });
}

export const getFeatured = (products: Product[]) => products.filter((p) => p.isFeatured);
export const getNewArrivals = (products: Product[]) => products.filter((p) => p.isNew);
export const getFlashSale = (products: Product[]) => products.filter((p) => p.isFlashSale);
export const getRelated = (product: Product, products: Product[]) =>
  products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
