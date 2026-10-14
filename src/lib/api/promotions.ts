import { api } from '../../api/client';
import type { AdminPromotion, EffectiveStatus, PreviewInput, PreviewResult, PromotionDisplay, PromotionInput, PromotionMeta, PromotionStatus } from '../../api/promotionTypes';

/** Storefront: running promotions, already worded. Products point at them by id. */
export async function fetchPromotions(): Promise<PromotionDisplay[]> {
  return api.get<PromotionDisplay[]>('/promotions');
}

// ---------------------------------------------------------------- admin

export async function fetchAdminPromotions(filters: { status?: EffectiveStatus; search?: string } = {}): Promise<AdminPromotion[]> {
  return api.get<AdminPromotion[]>('/admin/promotions', { status: filters.status, search: filters.search?.trim() });
}

export async function fetchAdminPromotion(id: string): Promise<AdminPromotion> {
  return api.get<AdminPromotion>(`/admin/promotions/${id}`);
}

/** Brands and exclusive groups for the builder's pickers. */
export async function fetchPromotionMeta(): Promise<PromotionMeta> {
  return api.get<PromotionMeta>('/admin/promotions/meta');
}

export async function createPromotion(input: PromotionInput): Promise<string> {
  return (await api.post<{ id: string }>('/admin/promotions', input)).id;
}

export async function updatePromotion(id: string, input: PromotionInput): Promise<void> {
  await api.put(`/admin/promotions/${id}`, input);
}

export async function setPromotionStatus(id: string, status: PromotionStatus): Promise<{ status: PromotionStatus; effectiveStatus: EffectiveStatus }> {
  return api.patch(`/admin/promotions/${id}/status`, { status });
}

export async function duplicatePromotion(id: string): Promise<string> {
  return (await api.post<{ id: string }>(`/admin/promotions/${id}/duplicate`)).id;
}

export async function deletePromotion(id: string): Promise<void> {
  await api.delete(`/admin/promotions/${id}`);
}

/** Prices a sample cart on the server and explains every decision. Changes nothing. */
export async function previewPromotions(input: PreviewInput): Promise<PreviewResult> {
  return api.post<PreviewResult>('/admin/promotions/preview', input);
}
