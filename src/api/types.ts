/**
 * Request/response shapes of the Node API that are not already in src/types
 * (the UI/domain types the components use).
 */
import type { Coupon, OrderStatus } from '../types';

export type AdminRole = 'owner' | 'admin';

export interface AuthAdmin {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export interface AuthSession {
  accessToken: string;
  expiresIn: number;
  admin: AuthAdmin;
}

export interface TeamMember extends AuthAdmin {
  createdAt: string;
  lastLoginAt: string | null;
}

/** GET /coupons/announcements: only public, storewide, active codes. */
export type CouponAnnouncement = Pick<Coupon, 'code' | 'discountType' | 'discountValue' | 'minOrderAmount' | 'endDate'>;

export interface CartItemRef {
  productId?: string;
  dealBannerId?: string;
  quantity: number;
}

export type CouponCheck =
  | { ok: true; code: string; discount: number }
  | { ok: false; code: string; errorCode: string; message: string };

export interface CartQuote {
  lines: {
    key: string;
    productId: string | null;
    dealBannerId: string | null;
    name: string;
    quantity: number;
    available: boolean;
    problem: 'PRODUCT_UNAVAILABLE' | 'DEAL_UNAVAILABLE' | 'LIMIT_EXCEEDED' | null;
    price: number;
    effectivePrice: number;
    lineTotal: number;
    stock: number | null;
    maxOrderQuantity: number | null;
    cap: number | null;
  }[];
  subtotal: number;
  bogoDiscount: number;
  bogoLabel: string | null;
  coupon: CouponCheck | null;
  couponDiscount: number;
  discount: number;
  shipping: { ok: true; zoneId: string; cityId: string | null; price: number } | { ok: false; reason: string } | null;
  total: number;
}

export interface PlaceOrderInput {
  customer: { name: string; phone: string; address: string; notes?: string };
  zoneId: string;
  cityId?: string | null;
  paymentMethod: 'cod' | 'card';
  couponCode?: string | null;
  items: CartItemRef[];
}

/** POST /orders response: what was saved, used to build the WhatsApp message. */
export interface PlacedOrder {
  orderId: string;
  orderNumber: number;
  /** Shown to the customer and the admin, e.g. S-0513 (category letter, day, order number). */
  orderCode: string;
  items: { name: string; quantity: number; price: number; lineTotal: number }[];
  subtotal: number;
  discount: number;
  shippingPrice: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface AdminOrderStats {
  counts: Record<OrderStatus, number>;
  total: number;
  revenue: number;
  today: number;
  todayRevenue: number;
}

export type AdminOrderSort = 'newest' | 'oldest' | 'total_desc' | 'total_asc';

export interface AdminOrderSummary {
  id: string;
  orderNumber: number;
  orderCode: string;
  status: OrderStatus;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  governorate: string;
  city: string | null;
  paymentMethod: 'cod' | 'wallet' | null;
  itemCount: number;
  shortfallUnits: number;
  total: number;
}

/** PATCH /admin/orders/:id/status: what happened to stock. */
export interface OrderStatusChange {
  status: OrderStatus;
  /** Units put back in stock by cancelling. */
  stockReturned: number;
  /** Units taken from stock again by reopening a cancelled order. */
  stockTaken: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: number;
  orderCode: string;
  status: OrderStatus;
  /** Cancelled orders: whether their items went back to stock. */
  stockReturned: boolean;
  createdAt: string;
  updatedAt: string;
  customer: { name: string; phone: string; address: string; notes: string | null };
  governorate: string;
  city: string | null;
  paymentMethod: 'cod' | 'wallet' | null;
  lines: {
    id: string;
    itemType: 'product' | 'deal';
    productId: string | null;
    promoBannerId: string | null;
    name: string;
    sku: string | null;
    unitBasePrice: number;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    stockShortfall: number;
  }[];
  subtotal: number;
  bogoDiscount: number;
  couponCode: string | null;
  couponDiscount: number;
  discount: number;
  shippingPrice: number;
  total: number;
}
