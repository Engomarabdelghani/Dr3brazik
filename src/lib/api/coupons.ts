import { supabase } from '../supabase';
import type { Coupon, CouponDiscountType, CouponTargetType, CartItem } from '../../types';

interface CouponRow {
  id: string;
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  target_type: CouponTargetType;
  min_order_amount: number | null;
  start_date: string | null;
  end_date: string | null;
  is_enabled: boolean;
  coupon_products?: { product_id: string }[];
}

function mapCoupon(row: CouponRow): Coupon {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    targetType: row.target_type,
    productIds: row.coupon_products?.map((p) => p.product_id),
    minOrderAmount: row.min_order_amount != null ? Number(row.min_order_amount) : undefined,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    isEnabled: row.is_enabled,
  };
}

export async function fetchCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*, coupon_products(product_id)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapCoupon);
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
}

function toRow(input: CouponInput) {
  return {
    code: input.code.trim().toUpperCase(),
    discount_type: input.discountType,
    discount_value: input.discountValue,
    target_type: input.targetType,
    min_order_amount: input.minOrderAmount ?? null,
    start_date: input.startDate ?? null,
    end_date: input.endDate ?? null,
    is_enabled: input.isEnabled,
  };
}

export async function createCoupon(input: CouponInput): Promise<string> {
  const { data, error } = await supabase.from('coupons').insert(toRow(input)).select('id').single();
  if (error) throw error;
  if (input.targetType === 'products' && input.productIds?.length) {
    await supabase.from('coupon_products').insert(input.productIds.map((productId) => ({ coupon_id: data.id, product_id: productId })));
  }
  return data.id;
}

export async function updateCoupon(id: string, input: CouponInput): Promise<void> {
  const { error } = await supabase.from('coupons').update(toRow(input)).eq('id', id);
  if (error) throw error;
  await supabase.from('coupon_products').delete().eq('coupon_id', id);
  if (input.targetType === 'products' && input.productIds?.length) {
    await supabase.from('coupon_products').insert(input.productIds.map((productId) => ({ coupon_id: id, product_id: productId })));
  }
}

export async function deleteCoupon(id: string): Promise<void> {
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) throw error;
}

export function isCouponActive(coupon: Coupon): boolean {
  if (!coupon.isEnabled) return false;
  const now = Date.now();
  if (coupon.startDate && new Date(coupon.startDate).getTime() > now) return false;
  if (coupon.endDate && new Date(coupon.endDate).getTime() < now) return false;
  return true;
}

function couponTargetsProduct(coupon: Coupon, productId: string): boolean {
  if (coupon.targetType === 'all') return true;
  return Boolean(coupon.productIds?.includes(productId));
}

export interface CouponValidationResult {
  ok: boolean;
  message?: string;
  discount?: number;
}

/** Validates a code against the current cart and computes the discount — the single source of truth used both when applying and on every re-render. */
export function evaluateCoupon(coupon: Coupon | undefined, items: CartItem[], subtotal: number): CouponValidationResult {
  if (!coupon) return { ok: false, message: 'Invalid coupon code' };
  if (!isCouponActive(coupon)) return { ok: false, message: 'This coupon is no longer active' };
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    return { ok: false, message: `This coupon requires a minimum order of ${coupon.minOrderAmount} EGP` };
  }

  const eligibleSubtotal = coupon.targetType === 'all'
    ? subtotal
    : items.reduce((sum, i) => couponTargetsProduct(coupon, i.product.id) ? sum + (i.product.effectivePrice ?? i.product.price) * i.quantity : sum, 0);

  if (eligibleSubtotal <= 0) {
    return { ok: false, message: 'This coupon does not apply to any items in your cart' };
  }

  const discount = coupon.discountType === 'percent'
    ? Math.round(eligibleSubtotal * (coupon.discountValue / 100))
    : Math.min(Math.round(coupon.discountValue), Math.round(eligibleSubtotal));

  return { ok: true, discount };
}
