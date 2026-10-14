/**
 * The Promotion Builder's data: a blank promotion, the starting templates and the
 * small helpers the steps share. The builder edits a `PromotionInput`, the exact
 * shape the API accepts; the server validates it and owns every calculation.
 */
import type { AdminPromotion, PromotionCondition, PromotionConfig, PromotionInput, PromotionReward, ProductGroup, RewardType } from '../../../api/promotionTypes';
import type { Product } from '../../../types';

export const GROUP_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

/** What the builder remembers about a product so it can show a row instead of an id. */
export interface PickedProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  stock: number | null;
  image?: string;
}

export const toPicked = (p: Product): PickedProduct => ({ id: p.id, name: p.name, price: p.price, currency: p.currency, stock: p.stock ?? null, image: p.images[0] });

export const newGroup = (key: string, name: string, scope: ProductGroup['scope'] = 'all'): ProductGroup => ({
  key,
  name,
  scope,
  productIds: [],
  categoryIds: [],
  subcategoryIds: [],
  brands: [],
  excludedProductIds: [],
});

const application = (changes: Partial<PromotionConfig['application']> = {}): PromotionConfig['application'] => ({
  repeat: false,
  maxApplications: null,
  applyToDiscounted: true,
  qualifierCanBeReward: false,
  maxDiscount: null,
  ...changes,
});

const config = (changes: Partial<PromotionConfig>): PromotionConfig => ({
  version: 1,
  conditions: { match: 'all', groups: [] },
  trigger: null,
  rewards: [],
  application: application(),
  ...changes,
});

export function blankPromotion(): PromotionInput {
  return {
    name: '',
    internalDescription: null,
    title: null,
    titleAr: null,
    description: null,
    descriptionAr: null,
    badgeLabel: null,
    badgeLabelAr: null,
    bannerImage: null,
    status: 'draft',
    startsAt: null,
    endsAt: null,
    couponCode: null,
    showOnStorefront: true,
    showCouponCode: false,
    priority: 0,
    isCombinable: true,
    combinesWithCoupons: true,
    stackGroup: null,
    usageLimitTotal: null,
    usageLimitPerCustomer: null,
    groups: [newGroup('A', 'Qualifying products')],
    config: config({ rewards: [newReward('percent_off')] }),
  };
}

/** What a saved promotion sends back, minus the read-only fields. */
export function toInput(p: AdminPromotion): PromotionInput {
  return {
    name: p.name,
    internalDescription: p.internalDescription,
    title: p.title,
    titleAr: p.titleAr,
    description: p.description,
    descriptionAr: p.descriptionAr,
    badgeLabel: p.badgeLabel,
    badgeLabelAr: p.badgeLabelAr,
    bannerImage: p.bannerImage,
    status: p.status,
    startsAt: p.startsAt,
    endsAt: p.endsAt,
    couponCode: p.couponCode,
    showOnStorefront: p.showOnStorefront,
    showCouponCode: p.showCouponCode,
    priority: p.priority,
    isCombinable: p.isCombinable,
    combinesWithCoupons: p.combinesWithCoupons,
    stackGroup: p.stackGroup ? { name: p.stackGroup.name, policy: p.stackGroup.policy } : null,
    usageLimitTotal: p.usageLimitTotal,
    usageLimitPerCustomer: p.usageLimitPerCustomer,
    groups: p.groups,
    config: p.config,
  };
}

export function newReward(type: RewardType, group = 'A'): PromotionReward {
  switch (type) {
    case 'percent_off':
      return { type, group, percent: 10, units: null, select: 'cheapest' };
    case 'fixed_off':
      return { type, group, amount: 50, per: 'unit', units: null, select: 'cheapest' };
    case 'fixed_price':
      return { type, group, price: 199, units: null, select: 'cheapest' };
    case 'tiered_percent':
      return { type, group, tiers: [{ percent: 0 }, { percent: 50 }], beyond: 'repeat', scope: 'group', order: 'price_desc' };
    case 'gift':
      return { type, items: [], requireStock: true };
    case 'gift_choice':
      return { type, options: [], fromGroup: null, maxValue: null, choose: 1, requireStock: true };
    case 'order_percent_off':
      return { type, percent: 10 };
    case 'order_fixed_off':
      return { type, amount: 100 };
  }
}

export function newCondition(type: PromotionCondition['type'], group = 'A'): PromotionCondition {
  switch (type) {
    case 'group_quantity':
      return { type, group, min: 2, max: null, mode: 'aggregate' };
    case 'group_subtotal':
      return { type, group, min: 500 };
    case 'cart_subtotal':
      return { type, min: 1000, max: null };
    case 'cart_quantity':
      return { type, min: 3, max: null };
  }
}

export const REWARD_TYPES: { type: RewardType; label: string; help: string; example: string; level: 'Products' | 'Gift' | 'Cart' }[] = [
  { type: 'percent_off', label: 'Percentage off', help: 'Takes a percentage off eligible products. With a buy quantity, it becomes "buy X, get Y at N% off" (100% = free).', example: '20% off skincare · Buy 2 get 1 free', level: 'Products' },
  { type: 'fixed_off', label: 'Amount off', help: 'Takes a fixed amount off each eligible unit, or one amount spread over the eligible items.', example: '50 EGP off each · Buy 2, save 100 EGP', level: 'Products' },
  { type: 'fixed_price', label: 'Special price', help: 'Sells eligible units at a set price, whatever their normal price.', example: 'Any serum for 199 EGP', level: 'Products' },
  { type: 'tiered_percent', label: 'Discount by unit position', help: 'Each further unit gets its own discount: the first at full price, the second cheaper, the third cheaper still.', example: '2nd unit 50% off, 3rd unit 70% off', level: 'Products' },
  { type: 'gift', label: 'Free gift', help: 'Adds one or more specific products to the cart for free.', example: 'Free mini cleanser with any serum', level: 'Gift' },
  { type: 'gift_choice', label: 'Gift of the customer’s choice', help: 'The customer picks from a list of gifts in their cart.', example: 'Choose 1 of 3 minis', level: 'Gift' },
  { type: 'order_percent_off', label: 'Percentage off the cart', help: 'Takes a percentage off the whole cart, after the product offers.', example: '10% off orders over 1,000 EGP', level: 'Cart' },
  { type: 'order_fixed_off', label: 'Amount off the cart', help: 'Takes a fixed amount off the whole cart, after the product offers.', example: '100 EGP off orders over 1,500 EGP', level: 'Cart' },
];

export const CONDITION_TYPES: { type: PromotionCondition['type']; label: string; help: string }[] = [
  { type: 'cart_subtotal', label: 'Cart subtotal', help: 'The whole cart must be worth at least this much, before promotions.' },
  { type: 'group_subtotal', label: 'Spend on a product group', help: 'The products of one group in the cart must be worth at least this much.' },
  { type: 'group_quantity', label: 'Quantity from a product group', help: 'The cart must hold this many units of a group. Unlike the buy quantity, this only checks; it does not use the units up.' },
  { type: 'cart_quantity', label: 'Items in the cart', help: 'The cart must hold this many units in total.' },
];

export interface Template {
  id: string;
  title: string;
  example: string;
  build: () => Pick<PromotionInput, 'groups' | 'config'>;
}

const BUY = 'Qualifying products';
const GET = 'Reward products';

/** Starting points. Each one only pre-fills the same fields the steps edit: nothing is special-cased later. */
export const TEMPLATES: Template[] = [
  {
    id: 'percent',
    title: 'Percentage off',
    example: '20% off selected products',
    build: () => ({ groups: [newGroup('A', 'Discounted products')], config: config({ rewards: [newReward('percent_off')] }) }),
  },
  {
    id: 'fixed',
    title: 'Amount off',
    example: '50 EGP off each item',
    build: () => ({ groups: [newGroup('A', 'Discounted products')], config: config({ rewards: [newReward('fixed_off')] }) }),
  },
  {
    id: 'price',
    title: 'Special price',
    example: 'Now 199 EGP',
    build: () => ({ groups: [newGroup('A', 'Products on offer', 'selected')], config: config({ rewards: [newReward('fixed_price')] }) }),
  },
  {
    id: 'bxgy',
    title: 'Buy X get Y',
    example: 'Buy 1 get 1 free · Buy 2 get 1 at 50%',
    build: () => ({
      groups: [newGroup('A', BUY)],
      config: config({
        trigger: { group: 'A', quantity: 1, mode: 'aggregate' },
        rewards: [{ type: 'percent_off', group: 'A', percent: 100, units: 1, select: 'cheapest' }],
        application: application({ repeat: true }),
      }),
    }),
  },
  {
    id: 'cross',
    title: 'Buy A, save on B',
    example: 'Buy a serum, get 50% off a toner',
    build: () => ({
      groups: [newGroup('A', BUY, 'selected'), newGroup('B', GET, 'selected')],
      config: config({
        trigger: { group: 'A', quantity: 1, mode: 'aggregate' },
        rewards: [{ type: 'percent_off', group: 'B', percent: 50, units: 1, select: 'cheapest' }],
        application: application({ repeat: true }),
      }),
    }),
  },
  {
    id: 'gift',
    title: 'Free gift with purchase',
    example: 'Buy any serum, get a free mini',
    build: () => ({
      groups: [newGroup('A', BUY, 'selected')],
      config: config({ trigger: { group: 'A', quantity: 1, mode: 'aggregate' }, rewards: [newReward('gift')] }),
    }),
  },
  {
    id: 'gift-choice',
    title: 'Choose a gift',
    example: 'Spend 1,000 EGP, pick 1 of 3 gifts',
    build: () => ({
      groups: [],
      config: config({ conditions: { match: 'all', groups: [{ match: 'all', conditions: [newCondition('cart_subtotal')] }] }, rewards: [newReward('gift_choice')] }),
    }),
  },
  {
    id: 'tiered',
    title: 'More units, bigger discount',
    example: '2nd unit 50% off, 3rd 70% off',
    build: () => ({
      groups: [newGroup('A', 'Products on offer')],
      config: config({ rewards: [{ type: 'tiered_percent', group: 'A', tiers: [{ percent: 0 }, { percent: 50 }, { percent: 70 }], beyond: 'repeat', scope: 'group', order: 'price_desc' }] }),
    }),
  },
  {
    id: 'volume',
    title: 'Volume discount',
    example: 'Buy 3 of the same product, 10% off all 3',
    build: () => ({
      groups: [newGroup('A', 'Products on offer')],
      config: config({
        trigger: { group: 'A', quantity: 3, mode: 'per_product' },
        rewards: [{ type: 'percent_off', group: 'A', percent: 10, units: null, select: 'cheapest' }],
        application: application({ repeat: true, qualifierCanBeReward: true }),
      }),
    }),
  },
  {
    id: 'cart',
    title: 'Cart discount',
    example: '10% off orders over 1,000 EGP',
    build: () => ({
      groups: [],
      config: config({ conditions: { match: 'all', groups: [{ match: 'all', conditions: [newCondition('cart_subtotal')] }] }, rewards: [newReward('order_percent_off')] }),
    }),
  },
];

export const STEPS = [
  { id: 'basics', title: 'Basics', hint: 'Name, schedule, coupon' },
  { id: 'products', title: 'Products', hint: 'Which products take part' },
  { id: 'conditions', title: 'Conditions', hint: 'When it applies' },
  { id: 'rewards', title: 'Rewards', hint: 'What the customer gets' },
  { id: 'rules', title: 'Rules', hint: 'Limits and stacking' },
  { id: 'review', title: 'Review & test', hint: 'Simulate and save' },
] as const;

/** Which step holds the field a server error points at ("body.config.rewards.0.percent"). */
export function stepOfError(path: string): number {
  const p = path.replace(/^body\.(draft\.)?/, '');
  if (p.startsWith('groups')) return 1;
  if (p.startsWith('config.conditions') || p.startsWith('config.trigger')) return 2;
  if (p.startsWith('config.rewards')) return 3;
  if (p.startsWith('config.application') || /^(priority|isCombinable|combinesWithCoupons|stackGroup|usageLimit)/.test(p)) return 4;
  return 0;
}

/** Problems the browser can see without asking the server, by step. The server checks everything again. */
export function localIssues(p: PromotionInput): { step: number; message: string }[] {
  const issues: { step: number; message: string }[] = [];
  const bad = (n: number | null) => n !== null && !Number.isFinite(n);
  if (!p.name.trim()) issues.push({ step: 0, message: 'Give the promotion a name.' });
  if (p.couponCode !== null && !p.couponCode.trim()) issues.push({ step: 0, message: 'Enter the coupon code, or turn the code requirement off.' });
  if (p.startsAt && p.endsAt && new Date(p.endsAt) <= new Date(p.startsAt)) issues.push({ step: 0, message: 'The end date must be after the start date.' });
  p.groups.forEach((g) => {
    if (!g.name.trim()) issues.push({ step: 1, message: `Name product group ${g.key}.` });
  });
  if (p.config.trigger && bad(p.config.trigger.quantity)) issues.push({ step: 2, message: 'Enter the buy quantity.' });
  p.config.conditions.groups.forEach((group) =>
    group.conditions.forEach((c) => {
      if (bad(c.min)) issues.push({ step: 2, message: 'A condition is missing its minimum.' });
    })
  );
  if (p.config.rewards.length === 0) issues.push({ step: 3, message: 'Add at least one reward.' });
  p.config.rewards.forEach((r, i) => {
    const n = i + 1;
    if ((r.type === 'percent_off' || r.type === 'order_percent_off') && bad(r.percent)) issues.push({ step: 3, message: `Reward ${n}: enter the percentage.` });
    if ((r.type === 'fixed_off' || r.type === 'order_fixed_off') && bad(r.amount)) issues.push({ step: 3, message: `Reward ${n}: enter the amount.` });
    if (r.type === 'fixed_price' && bad(r.price)) issues.push({ step: 3, message: `Reward ${n}: enter the price.` });
    if (r.type === 'gift' && r.items.length === 0) issues.push({ step: 3, message: `Reward ${n}: choose the gift product.` });
    if (r.type === 'gift_choice' && r.fromGroup === null && r.options.length < 2) issues.push({ step: 3, message: `Reward ${n}: offer at least 2 gifts to choose from, or use a product group.` });
  });
  return issues;
}

// ---------------------------------------------------------------- dates

/** ISO (UTC) -> the value of a datetime-local input, in this device's time zone. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const fromLocalInput = (value: string): string | null => (value ? new Date(value).toISOString() : null);

export const deviceTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** The same moment as the shop sees it (Cairo), shown next to the device time when they differ. */
export function inCairo(iso: string | null): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

export const money = (n: number) => `${n.toLocaleString('en-US')} EGP`;

export const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  draft: { label: 'Draft', bg: 'rgba(107,114,128,0.12)', color: '#4b5563' },
  scheduled: { label: 'Scheduled', bg: 'rgba(59,130,246,0.12)', color: '#1d4ed8' },
  active: { label: 'Active', bg: 'rgba(34,197,94,0.14)', color: '#15803d' },
  paused: { label: 'Paused', bg: 'rgba(234,179,8,0.16)', color: '#854d0e' },
  expired: { label: 'Expired', bg: 'rgba(239,68,68,0.1)', color: '#b91c1c' },
  inactive: { label: 'Inactive', bg: 'rgba(107,114,128,0.12)', color: '#4b5563' },
};
