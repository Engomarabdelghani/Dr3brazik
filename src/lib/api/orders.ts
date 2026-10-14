import { api, apiBlob, apiRequest } from '../../api/client';
import type { AdminOrder, AdminOrderSort, AdminOrderStats, AdminOrderSummary, CartItemRef, OrderPaymentMethod, OrderStatusChange, CartQuote, PlaceOrderInput, PlacedOrder } from '../../api/types';
import type { GiftSelection } from '../../api/promotionTypes';
import type { CartItem, OrderStatus } from '../../types';
import { DEAL_ID_PREFIX } from './promoBanners';

/** Cart items → the ids the API expects (deal items carry the banner id). */
export function toCartRefs(items: CartItem[]): CartItemRef[] {
  return items.map(({ product, quantity }) =>
    product.id.startsWith(DEAL_ID_PREFIX)
      ? { dealBannerId: product.id.slice(DEAL_ID_PREFIX.length), quantity }
      : { productId: product.id, quantity }
  );
}

export async function fetchCartQuote(input: {
  items: CartItemRef[];
  couponCode?: string | null;
  zoneId?: string;
  cityId?: string;
  giftSelections?: GiftSelection[];
  customerPhone?: string | null;
}): Promise<CartQuote> {
  return api.post<CartQuote>('/cart/quote', input);
}

/** The Idempotency-Key makes a double-submit return the same order instead of a second one. */
export async function placeOrder(input: PlaceOrderInput, idempotencyKey: string): Promise<PlacedOrder> {
  return api.post<PlacedOrder>('/orders', input, { 'Idempotency-Key': idempotencyKey });
}

/**
 * The InstaPay transfer screenshot, uploaded as soon as the customer picks it. The key
 * that comes back goes on the order. Allowed a full minute: mobile data can be slow.
 */
export async function uploadPaymentProof(file: File): Promise<string> {
  const body = new FormData();
  body.append('file', file, file.name);
  const { data } = await apiRequest<{ key: string }>('/orders/payment-proof', { method: 'POST', body, timeoutMs: 60_000 });
  return data.key;
}

// ---------------------------------------------------------------- admin

export interface AdminOrderQuery {
  status?: OrderStatus;
  paymentMethod?: OrderPaymentMethod;
  sort?: AdminOrderSort;
  search?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

export async function fetchAdminOrders(query: AdminOrderQuery): Promise<{ orders: AdminOrderSummary[]; total: number }> {
  const { data, meta } = await apiRequest<AdminOrderSummary[]>('/admin/orders', { query: { ...query } });
  return { orders: data, total: meta?.total ?? data.length };
}

export async function fetchAdminOrderStats(): Promise<AdminOrderStats> {
  return api.get<AdminOrderStats>('/admin/orders/stats');
}

export async function fetchAdminOrder(id: string): Promise<AdminOrder> {
  return api.get<AdminOrder>(`/admin/orders/${id}`);
}

/** The transfer screenshot of an InstaPay order. It is not a public URL, so it is fetched with the admin token. */
export async function fetchAdminPaymentProof(id: string): Promise<Blob> {
  return apiBlob(`/admin/orders/${id}/payment-proof`);
}

/** Cancelling puts the items back in stock; reopening a cancelled order takes them again. */
export async function setOrderStatus(id: string, status: OrderStatus): Promise<OrderStatusChange> {
  return api.patch<OrderStatusChange>(`/admin/orders/${id}/status`, { status });
}
