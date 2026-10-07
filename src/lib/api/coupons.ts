import { api } from '../../api/client';
import type { CartItemRef, CouponAnnouncement, CouponCheck } from '../../api/types';
import type { Coupon, CouponDiscountType, CouponTargetType } from '../../types';

/**
 * The storefront no longer downloads coupons: private codes stay on the server.
 * It gets the public announcement list and asks the API to check one code.
 */
export async function fetchCouponAnnouncements(): Promise<CouponAnnouncement[]> {
  return api.get<CouponAnnouncement[]>('/coupons/announcements');
}

export async function validateCoupon(code: string, items: CartItemRef[]): Promise<CouponCheck> {
  const { coupon } = await api.post<{ coupon: CouponCheck }>('/coupons/validate', { code, items });
  return coupon;
}

/** Admin: every coupon. */
export async function fetchAdminCoupons(): Promise<Coupon[]> {
  return api.get<Coupon[]>('/admin/coupons');
}

export interface CouponInput {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  targetType: CouponTargetType;
  productIds?: string[];
  minOrderAmount?: number;
  startDate?: string;
  endDate?: string;
  isEnabled: boolean;
  isPublic: boolean;
}

export async function createCoupon(input: CouponInput): Promise<string> {
  return (await api.post<{ id: string }>('/admin/coupons', input)).id;
}

export async function updateCoupon(id: string, input: CouponInput): Promise<void> {
  await api.put(`/admin/coupons/${id}`, input);
}

export async function deleteCoupon(id: string): Promise<void> {
  await api.delete(`/admin/coupons/${id}`);
}

export function isCouponActive(coupon: Pick<Coupon, 'isEnabled' | 'startDate' | 'endDate'>): boolean {
  if (!coupon.isEnabled) return false;
  const now = Date.now();
  if (coupon.startDate && new Date(coupon.startDate).getTime() > now) return false;
  if (coupon.endDate && new Date(coupon.endDate).getTime() < now) return false;
  return true;
}

export interface CouponValidationResult {
  ok: boolean;
  message?: string;
  discount?: number;
}
