/**
 * Request/response shapes of the Node API that are not already in src/types
 * (the UI/domain types the components use).
 */
import type { Coupon, OrderStatus } from '../types';
import type { CartPromotions, GiftSelection } from './promotionTypes';

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
  /** kind 'promotion': the code belongs to a promotion, whose saving is listed with the promotions. */
  | { ok: true; code: string; discount: number; kind?: 'coupon' | 'promotion' }
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
    /** Catalog price of one unit. */
    price: number;
    lineTotal: number;
    /** Promotion discount on this line, and the line's total after it. */
    promotionDiscount: number;
    finalTotal: number;
    promotions: { id: string; qualifyingUnits: number; rewardedUnits: number; discount: number }[];
    stock: number | null;
    maxOrderQuantity: number | null;
    cap: number | null;
  }[];
  subtotal: number;
  coupon: CouponCheck | null;
  couponDiscount: number;
  promotionDiscount: number;
  /** Applied promotions, free gifts, gift choices and "almost there" hints. */
  promotions: CartPromotions;
  /** Promotions + coupon. */
  discount: number;
  /** A promotion makes delivery free, whatever the governorate. */
  freeShipping?: boolean;
  shipping: { ok: true; zoneId: string; cityId: string | null; price: number } | { ok: false; reason: string } | null;
  total: number;
}

export interface PlaceOrderInput {
  customer: { name: string; phone: string; address: string; notes?: string };
  zoneId: string;
  cityId?: string | null;
  /** card: Vodafone Cash (the server stores it as "wallet"). */
  paymentMethod: 'cod' | 'card' | 'instapay';
  /** InstaPay / Vodafone Cash only: the number the customer transferred from, and the key of the uploaded transfer screenshot. */
  payerNumber?: string;
  paymentProof?: string;
  couponCode?: string | null;
  items: CartItemRef[];
  giftSelections?: GiftSelection[];
  /** The total shown to the customer. If the server's differs, it refuses the order (PRICE_CHANGED). */
  expectedTotal?: number;
}

/** POST /orders response: what was saved, used to build the WhatsApp message. */
export interface PlacedOrder {
  orderId: string;
  orderNumber: number;
  /** Shown to the customer and the admin, e.g. S-0513 (category letter, day, order number). */
  orderCode: string;
  items: { name: string; quantity: number; price: number; lineTotal: number; isGift?: boolean }[];
  promotions: { title: string; titleAr: string; discount: number }[];
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

/** wallet: Vodafone Cash (and, on older orders, "Instapay / wallet"). */
export type OrderPaymentMethod = 'cod' | 'wallet' | 'instapay';

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
  paymentMethod: OrderPaymentMethod | null;
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
  paymentMethod: OrderPaymentMethod | null;
  /** InstaPay orders: the number the transfer came from. */
  payerNumber: string | null;
  /** InstaPay orders: whether the transfer screenshot is stored (see fetchAdminPaymentProof). */
  hasPaymentProof: boolean;
  lines: {
    id: string;
    /** gift: a free item a promotion added (unitPrice 0; unitBasePrice is its value). */
    itemType: 'product' | 'deal' | 'gift';
    productId: string | null;
    promoBannerId: string | null;
    name: string;
    sku: string | null;
    unitBasePrice: number;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    promotionDiscount: number;
    stockShortfall: number;
  }[];
  /** As applied when the order was placed; later edits to a promotion do not change this. */
  promotions: {
    id: string;
    promotionId: string | null;
    name: string;
    title: string;
    titleAr: string;
    couponCode: string | null;
    kind: string;
    applications: number;
    discount: number;
    giftValue: number;
    lines: { orderItemId: string; qualifyingUnits: number; rewardedUnits: number; discount: number }[];
  }[];
  subtotal: number;
  /** Only on orders placed before Offers were merged into Promotions. */
  bogoDiscount: number;
  couponCode: string | null;
  couponDiscount: number;
  promotionDiscount: number;
  discount: number;
  shippingPrice: number;
  total: number;
}
