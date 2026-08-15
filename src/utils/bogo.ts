import type { CartItem, Offer } from '../types';
import { isOfferActive, offerTargetsProduct } from '../lib/api/offers';

/**
 * Computes the total BOGO discount for a cart, given the currently active offers.
 * For each BOGO offer, every full "buy + get" group of qualifying units in the
 * cart gets its cheapest unit(s) discounted by the offer's get-discount-percent.
 * A product is only ever discounted by one (its first-matching) BOGO offer.
 */
export function computeBogoDiscount(items: CartItem[], offers: Offer[]): number {
  const bogoOffers = offers.filter((o) => o.discountType === 'bogo' && isOfferActive(o));
  if (bogoOffers.length === 0) return 0;

  let totalDiscount = 0;
  const claimedProductIds = new Set<string>();

  for (const offer of bogoOffers) {
    const groupSize = offer.bogoBuyQty + offer.bogoGetQty;
    if (groupSize <= 0) continue;

    // Expand matching, unclaimed cart items into individual unit prices.
    const unitPrices: number[] = [];
    for (const { product, quantity } of items) {
      if (claimedProductIds.has(product.id)) continue;
      if (!offerTargetsProduct(offer, { id: product.id, categoryId: product.categoryId })) continue;
      for (let i = 0; i < quantity; i++) unitPrices.push(product.price);
    }
    if (unitPrices.length < groupSize) continue;

    // Sort descending so the "buy" slots are filled by the priciest units first,
    // leaving the cheapest units in each group to be discounted (standard BOGO).
    unitPrices.sort((a, b) => b - a);

    const fullGroups = Math.floor(unitPrices.length / groupSize);
    for (let g = 0; g < fullGroups; g++) {
      const groupStart = g * groupSize;
      const getStart = groupStart + offer.bogoBuyQty;
      for (let i = getStart; i < getStart + offer.bogoGetQty; i++) {
        totalDiscount += unitPrices[i] * (offer.bogoGetDiscountPercent / 100);
      }
    }

    // Mark all products this offer touched as claimed so a later offer can't double-apply.
    for (const { product } of items) {
      if (offerTargetsProduct(offer, { id: product.id, categoryId: product.categoryId })) claimedProductIds.add(product.id);
    }
  }

  return Math.round(totalDiscount);
}

/** Returns the label of the first active BOGO offer that targets this product, if any. */
export function findActiveBogoOfferFor(product: { id: string; categoryId?: string }, offers: Offer[]): Offer | undefined {
  return offers.find((o) => o.discountType === 'bogo' && isOfferActive(o) && offerTargetsProduct(o, product));
}
