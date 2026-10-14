import { useState } from 'react';
import { FiChevronRight, FiTag } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import type { GroupOffer } from '../../hooks/usePromotions';
import { useLocalized } from '../../hooks/usePromotions';
import PromoBadge from '../product/PromoBadge';
import { PromotionDetailsModal } from '../product/PromotionDetails';

/**
 * The offer label for a category or subcategory tile: the promotion that covers
 * it, or a plain "Offers" tag when only some of its products are on offer.
 */
export function GroupOfferBadge({ offer, size = 'md' }: { offer: GroupOffer | undefined; size?: 'sm' | 'md' }) {
  const { t } = useTranslation();
  if (!offer?.some) return null;
  const main = offer.main[0];
  if (main) return <PromoBadge kind={main.kind} label={main.badge} size={size} />;
  return (
    <span className={`promo-badge promo-badge-price ${size === 'sm' ? 'promo-badge-sm' : ''}`}>
      <FiTag className="promo-badge-icon" aria-hidden="true" />
      <span className="truncate">{t('promotions.offers')}</span>
    </span>
  );
}

/** A small mark inside a filter chip: this category or subcategory has offers. */
export function GroupOfferMark({ offer }: { offer: GroupOffer | undefined }) {
  const { t } = useTranslation();
  const text = useLocalized();
  if (!offer?.some) return null;
  const label = offer.main[0] ? text(offer.main[0].badge) : t('promotions.offers');
  return (
    <span className="offer-mark" title={label}>
      <FiTag size={10} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Above the product grid: the offers that run across the category or subcategory being browsed. */
export function CategoryOfferStrip({ offer, name }: { offer: GroupOffer | undefined; name: string }) {
  const { t } = useTranslation();
  const text = useLocalized();
  const [open, setOpen] = useState(false);
  if (!offer || offer.main.length === 0) return null;

  return (
    <section className="offer-strip mb-8" aria-label={t('promotions.offerOn', { name })}>
      <p className="eyebrow">{t('promotions.offerOn', { name })}</p>
      <ul className="mt-2.5 space-y-2">
        {offer.main.map((promotion) => (
          <li key={promotion.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <PromoBadge kind={promotion.kind} label={promotion.badge} />
            <span className="text-sm min-w-0">{text(promotion.summary)}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 hover:text-[var(--color-gold)] transition-colors"
      >
        {t('promotions.viewDetails')} <FiChevronRight size={12} className="rtl-flip" aria-hidden="true" />
      </button>
      <PromotionDetailsModal open={open} onClose={() => setOpen(false)} promotions={offer.main} productName={name} />
    </section>
  );
}
