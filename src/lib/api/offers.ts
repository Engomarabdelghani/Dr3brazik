import { api } from '../../api/client';
import type { Offer, DiscountType, OfferTargetType } from '../../types';

/** Storefront: enabled offers (including upcoming/expired; use isOfferActive). */
export async function fetchOffers(): Promise<Offer[]> {
  return api.get<Offer[]>('/offers');
}

/** Admin: every offer, disabled ones included. */
export async function fetchAdminOffers(): Promise<Offer[]> {
  return api.get<Offer[]>('/admin/offers');
}

export interface OfferInput {
  title: string;
  discountType: DiscountType;
  discountValue: number;
  targetType: OfferTargetType;
  categoryId?: string;
  productIds?: string[];
  bannerImage?: string;
  startDate: string;
  endDate: string;
  isEnabled: boolean;
  bogoBuyQty?: number;
  bogoGetQty?: number;
  bogoGetDiscountPercent?: number;
}

export async function createOffer(input: OfferInput): Promise<string> {
  return (await api.post<{ id: string }>('/admin/offers', input)).id;
}

export async function updateOffer(id: string, input: OfferInput): Promise<void> {
  await api.put(`/admin/offers/${id}`, input);
}

export async function deleteOffer(id: string): Promise<void> {
  await api.delete(`/admin/offers/${id}`);
}

export async function setOfferEnabled(id: string, isEnabled: boolean): Promise<void> {
  await api.patch(`/admin/offers/${id}/enabled`, { isEnabled });
}

export function isOfferActive(offer: Offer): boolean {
  const now = Date.now();
  return offer.isEnabled && new Date(offer.startDate).getTime() <= now && now <= new Date(offer.endDate).getTime();
}

/** Human-readable label for a BOGO offer, e.g. "Buy 1 Get 1 Free" or "Buy 2 Get 1 50% Off". */
export function getBogoLabel(offer: Offer): string {
  const { bogoBuyQty, bogoGetQty, bogoGetDiscountPercent } = offer;
  const suffix = bogoGetDiscountPercent >= 100 ? 'Free' : `${bogoGetDiscountPercent}% Off`;
  return `Buy ${bogoBuyQty} Get ${bogoGetQty} ${suffix}`;
}

/** Whether a given product (by id/categoryId) is targeted by this offer. */
export function offerTargetsProduct(offer: Offer, product: { id: string; categoryId?: string }): boolean {
  if (offer.targetType === 'category') return Boolean(product.categoryId) && offer.categoryId === product.categoryId;
  return Boolean(offer.productIds?.includes(product.id));
}
