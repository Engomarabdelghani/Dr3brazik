/**
 * Shapes of the promotion API (server/src/modules/promotions). The server does
 * the pricing and the wording; these types only describe what it sends.
 */

/** Text the server wrote in both languages; pick one with useLocalized(). */
export interface Localized {
  en: string;
  ar: string;
}

export type PromotionKind = 'percent' | 'fixed' | 'fixed_price' | 'bxgy' | 'tiered' | 'gift' | 'gift_choice' | 'order' | 'free_shipping';

export interface PromotionGift {
  productId: string;
  name: string;
  nameAr: string | null;
  slug: string;
  image: string | null;
  quantity: number;
  value: number;
  inStock: boolean;
}

/** GET /promotions: one running promotion, ready to show. */
export interface PromotionDisplay {
  id: string;
  kind: PromotionKind;
  scope: 'product' | 'order';
  badge: Localized;
  title: Localized;
  summary: Localized;
  description: Localized | null;
  details: Localized[];
  /** The campaign's banner, for the Offers page and the promotion's own page (/offer/<id>). */
  bannerImage: string | null;
  requiresCoupon: boolean;
  couponCode: string | null;
  /** Units to add before anything is discounted; null when one is enough. */
  minQuantity: number | null;
  hasGift: boolean;
  gifts: PromotionGift[];
  giftChoose: number | null;
  /** Gifts on offer in all; `gifts` lists the first few when the choice is a whole category. */
  giftCount: number;
  startsAt: string | null;
  endsAt: string | null;
  priority: number;
}

/** How a product takes part: it counts toward the offer, it receives the reward, or both. */
export type PromotionRole = 'qualifying' | 'reward' | 'both';

export interface ProductPromotionRef {
  id: string;
  role: PromotionRole;
}

// ---------------------------------------------------------------- cart

export interface CartGift {
  key: string;
  promotionId: string;
  productId: string;
  name: string;
  nameAr: string | null;
  slug: string;
  image: string | null;
  quantity: number;
  value: number;
  chosen: boolean;
}

export interface CartGiftChoice {
  promotionId: string;
  title: Localized;
  /** How many gifts may be picked, and how many of those are still to pick. */
  slots: number;
  remaining: number;
  /** What the customer picked. Empty until they choose: nothing is added for them. */
  selected: string[];
  options: { productId: string; name: string; nameAr: string | null; image: string | null; value: number; available: boolean }[];
}

export interface CartPromotions {
  applied: { id: string; kind: PromotionKind; badge: Localized; title: Localized; summary: Localized; applications: number; discount: number; giftValue: number; freeShipping?: boolean; couponCode: string | null }[];
  gifts: CartGift[];
  giftChoices: CartGiftChoice[];
  hints: { promotionId: string; badge: Localized; message: Localized }[];
  notices: { promotionId: string; title: Localized; message: Localized }[];
}

export interface GiftSelection {
  promotionId: string;
  productIds: string[];
}

// ---------------------------------------------------------------- admin

export type PromotionStatus = 'draft' | 'active' | 'paused' | 'inactive';
export type EffectiveStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'expired' | 'inactive';
export type QuantityMode = 'aggregate' | 'per_product';
export type MatchMode = 'all' | 'any';
export type UnitSelect = 'cheapest' | 'most_expensive';

export interface ProductGroup {
  /** A-F: what conditions and rewards refer to. */
  key: string;
  name: string;
  scope: 'all' | 'selected';
  productIds: string[];
  categoryIds: string[];
  subcategoryIds: string[];
  brands: string[];
  excludedProductIds: string[];
}

export type PromotionCondition =
  | { type: 'group_quantity'; group: string; min: number; max: number | null; mode: QuantityMode }
  | { type: 'group_subtotal'; group: string; min: number }
  | { type: 'cart_subtotal'; min: number; max: number | null }
  | { type: 'cart_quantity'; min: number; max: number | null };

export interface ConditionGroup {
  match: MatchMode;
  conditions: PromotionCondition[];
}

export type PromotionReward =
  | { type: 'percent_off'; group: string; percent: number; units: number | null; select: UnitSelect }
  | { type: 'fixed_off'; group: string; amount: number; per: 'unit' | 'total'; units: number | null; select: UnitSelect }
  | { type: 'fixed_price'; group: string; price: number; units: number | null; select: UnitSelect }
  | { type: 'tiered_percent'; group: string; tiers: { percent: number }[]; beyond: 'repeat' | 'last' | 'none'; scope: 'group' | 'per_product'; order: 'price_desc' | 'price_asc' }
  | { type: 'gift'; items: { productId: string; quantity: number }[]; requireStock: boolean }
  /** Gifts are either listed (`options`) or every product of a product group (`fromGroup`), optionally up to a price. */
  | { type: 'gift_choice'; options: string[]; fromGroup: string | null; maxValue: number | null; choose: number; requireStock: boolean }
  | { type: 'order_percent_off'; percent: number }
  | { type: 'order_fixed_off'; amount: number }
  | { type: 'free_shipping' };

export type RewardType = PromotionReward['type'];

export interface PromotionConfig {
  version: 1;
  conditions: { match: MatchMode; groups: ConditionGroup[] };
  trigger: { group: string; quantity: number; mode: QuantityMode } | null;
  rewards: PromotionReward[];
  application: {
    repeat: boolean;
    maxApplications: number | null;
    applyToDiscounted: boolean;
    qualifierCanBeReward: boolean;
    maxDiscount: number | null;
  };
}

/** What the builder edits and POST/PUT /admin/promotions accept. */
export interface PromotionInput {
  name: string;
  internalDescription: string | null;
  title: string | null;
  titleAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  badgeLabel: string | null;
  badgeLabelAr: string | null;
  bannerImage: string | null;
  status: PromotionStatus;
  startsAt: string | null;
  endsAt: string | null;
  couponCode: string | null;
  showOnStorefront: boolean;
  showCouponCode: boolean;
  priority: number;
  isCombinable: boolean;
  combinesWithCoupons: boolean;
  stackGroup: { name: string; policy: 'priority' | 'best_discount' } | null;
  usageLimitTotal: number | null;
  usageLimitPerCustomer: number | null;
  groups: ProductGroup[];
  config: PromotionConfig;
}

export interface AdminPromotion extends PromotionInput {
  id: string;
  effectiveStatus: EffectiveStatus;
  usageCount: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
  display: PromotionDisplay;
}

export interface PromotionMeta {
  brands: string[];
  stackGroups: { id: string; name: string; policy: 'priority' | 'best_discount'; members: number }[];
  limits: { groups: number; conditionGroups: number; conditionsPerGroup: number; rewards: number; tiers: number; giftItems: number; giftOptions: number; giftGroupOptions: number; targetsPerList: number };
}

// ---------------------------------------------------------------- admin preview

export interface PreviewConditionGroup {
  match: MatchMode;
  passed: boolean;
  conditions: { passed: boolean; label: string }[];
}

export interface PreviewResult {
  at: string;
  lines: {
    key: string;
    productId: string | null;
    name: string;
    quantity: number;
    available: boolean;
    problem: string | null;
    price: number;
    lineTotal: number;
    promotionDiscount: number;
    finalTotal: number;
  }[];
  gifts: CartGift[];
  giftChoices: CartGiftChoice[];
  applied: {
    id: string;
    name: string;
    isDraft: boolean;
    badge: string;
    summary: string;
    applications: number;
    discount: number;
    orderDiscount: number;
    giftValue: number;
    freeShipping: boolean;
    conditions: PreviewConditionGroup[];
    lines: { key: string; name: string; qualifyingUnits: number; rewardedUnits: number; discount: number }[];
    steps: { index: number; qualifying: { name: string; units: number }[]; rewarded: { name: string; units: number; discount: number }[]; gifts: { name: string; quantity: number }[] }[];
    gifts: { name: string; quantity: number; value: number; chosen: boolean }[];
    missingGifts: string[];
  }[];
  rejected: { id: string; name: string; isDraft: boolean; code: string; reason: string; conditions: PreviewConditionGroup[]; hint: string | null }[];
  totals: {
    subtotal: number;
    promotionDiscount: number;
    coupon: { ok: true; code: string; discount: number } | { ok: false; code: string; errorCode: string; message: string } | null;
    couponDiscount: number;
    discount: number;
    total: number;
    freeShipping: boolean;
  };
}

export interface PreviewInput {
  items: { productId: string; quantity: number }[];
  couponCode?: string | null;
  customerPhone?: string | null;
  at?: string | null;
  draft?: PromotionInput;
  draftId?: string;
  draftOnly?: boolean;
}
