import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { Localized, PromotionDisplay, PromotionRole } from '../api/promotionTypes';
import { fetchPromotions } from '../lib/api/promotions';
import type { Product } from '../types';
import { useProducts } from './useCatalog';

/** Running promotions by id. Fetched once and shared by every card on the page. */
export function usePromotions() {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: fetchPromotions,
    staleTime: 60_000,
    select: (list) => new Map(list.map((p) => [p.id, p])),
  });
}

export interface ProductPromotion extends PromotionDisplay {
  role: PromotionRole;
}

/**
 * The promotions the server attached to this product, most important first.
 * A promotion that has ended since the product was loaded simply drops out.
 */
export function useProductPromotions(product: Pick<Product, 'promotions'> | undefined | null): ProductPromotion[] {
  const { data } = usePromotions();
  return useMemo(() => {
    if (!data || !product?.promotions?.length) return [];
    return product.promotions.flatMap(({ id, role }) => {
      const promotion = data.get(id);
      return promotion ? [{ ...promotion, role }] : [];
    });
  }, [data, product?.promotions]);
}

export interface GroupOffer {
  /** Promotions that at least half of the group's products take part in, widest first (at most 2). */
  main: PromotionDisplay[];
  /** Some product in the group has an offer. */
  some: boolean;
}

interface Tally {
  total: number;
  withOffer: number;
  perPromotion: Map<string, number>;
}

/**
 * Which categories and subcategories have offers. Nothing is decided here: the
 * server already attached the promotions to each product, this only counts them
 * per category so a tile or a filter can show the offer its products share.
 */
export function useGroupOffers() {
  const { data: promotions } = usePromotions();
  const { data: products } = useProducts();

  return useMemo(() => {
    const tallies = new Map<string, Tally>();
    const count = (key: string, product: Product) => {
      let tally = tallies.get(key);
      if (!tally) tallies.set(key, (tally = { total: 0, withOffer: 0, perPromotion: new Map() }));
      tally.total++;
      const refs = (product.promotions ?? []).filter((ref) => promotions?.has(ref.id));
      if (refs.length) tally.withOffer++;
      for (const ref of refs) tally.perPromotion.set(ref.id, (tally.perPromotion.get(ref.id) ?? 0) + 1);
    };
    for (const product of products ?? []) {
      if (!product.category) continue;
      count(product.category, product);
      if (product.subcategory) count(`${product.category}/${product.subcategory}`, product);
    }

    const offers = new Map<string, GroupOffer>();
    for (const [key, tally] of tallies) {
      const main = [...tally.perPromotion]
        .filter(([, n]) => n * 2 >= tally.total)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .flatMap(([id]) => {
          const promotion = promotions?.get(id);
          return promotion ? [promotion] : [];
        });
      offers.set(key, { main, some: tally.withOffer > 0 });
    }
    return {
      category: (slug: string | null | undefined): GroupOffer | undefined => (slug ? offers.get(slug) : undefined),
      subcategory: (category: string | null | undefined, slug: string | null | undefined): GroupOffer | undefined =>
        category && slug ? offers.get(`${category}/${slug}`) : undefined,
    };
  }, [promotions, products]);
}

/** Picks the current language out of server-written text. */
export function useLocalized() {
  const { i18n } = useTranslation();
  const isArabic = i18n.language.startsWith('ar');
  return useCallback((text: Localized | null | undefined): string => (text ? (isArabic ? text.ar : text.en) : ''), [isArabic]);
}

/** A product's name in the current language, for gifts and other server-listed products. */
export function useProductName() {
  const { i18n } = useTranslation();
  const isArabic = i18n.language.startsWith('ar');
  return useCallback((p: { name: string; nameAr?: string | null }): string => (isArabic && p.nameAr ? p.nameAr : p.name), [isArabic]);
}
