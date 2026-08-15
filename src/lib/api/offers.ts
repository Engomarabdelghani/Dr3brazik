import { supabase } from '../supabase';
import type { Offer, DiscountType, OfferTargetType } from '../../types';

interface OfferRow {
  id: string;
  title: string;
  discount_type: DiscountType;
  discount_value: number | null;
  target_type: OfferTargetType;
  category_id: string | null;
  banner_image: string | null;
  start_date: string;
  end_date: string;
  is_enabled: boolean;
  bogo_buy_qty: number;
  bogo_get_qty: number;
  bogo_get_discount_percent: number;
  offer_products?: { product_id: string }[];
}

function mapOffer(row: OfferRow): Offer {
  return {
    id: row.id,
    title: row.title,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value ?? 0),
    targetType: row.target_type,
    categoryId: row.category_id ?? undefined,
    productIds: row.offer_products?.map((p) => p.product_id),
    bannerImage: row.banner_image ?? undefined,
    startDate: row.start_date,
    endDate: row.end_date,
    isEnabled: row.is_enabled,
    bogoBuyQty: row.bogo_buy_qty ?? 1,
    bogoGetQty: row.bogo_get_qty ?? 1,
    bogoGetDiscountPercent: row.bogo_get_discount_percent ?? 100,
  };
}

export async function fetchOffers(): Promise<Offer[]> {
  const { data, error } = await supabase
    .from('offers')
    .select('*, offer_products(product_id)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapOffer);
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

function toRow(input: OfferInput) {
  return {
    title: input.title,
    discount_type: input.discountType,
    discount_value: input.discountType === 'bogo' ? 0 : input.discountValue,
    target_type: input.targetType,
    category_id: input.targetType === 'category' ? input.categoryId : null,
    banner_image: input.bannerImage || null,
    start_date: input.startDate,
    end_date: input.endDate,
    is_enabled: input.isEnabled,
    bogo_buy_qty: input.discountType === 'bogo' ? (input.bogoBuyQty ?? 1) : 1,
    bogo_get_qty: input.discountType === 'bogo' ? (input.bogoGetQty ?? 1) : 1,
    bogo_get_discount_percent: input.discountType === 'bogo' ? (input.bogoGetDiscountPercent ?? 100) : 100,
  };
}

export async function createOffer(input: OfferInput): Promise<string> {
  const { data, error } = await supabase.from('offers').insert(toRow(input)).select('id').single();
  if (error) throw error;

  if (input.targetType === 'products' && input.productIds?.length) {
    await supabase.from('offer_products').insert(input.productIds.map((productId) => ({ offer_id: data.id, product_id: productId })));
  }
  return data.id;
}

export async function updateOffer(id: string, input: OfferInput): Promise<void> {
  const { error } = await supabase.from('offers').update(toRow(input)).eq('id', id);
  if (error) throw error;

  await supabase.from('offer_products').delete().eq('offer_id', id);
  if (input.targetType === 'products' && input.productIds?.length) {
    await supabase.from('offer_products').insert(input.productIds.map((productId) => ({ offer_id: id, product_id: productId })));
  }
}

export async function deleteOffer(id: string): Promise<void> {
  const { error } = await supabase.from('offers').delete().eq('id', id);
  if (error) throw error;
}

export async function setOfferEnabled(id: string, isEnabled: boolean): Promise<void> {
  const { error } = await supabase.from('offers').update({ is_enabled: isEnabled }).eq('id', id);
  if (error) throw error;
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
