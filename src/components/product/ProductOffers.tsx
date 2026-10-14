import { useState } from 'react';
import { FiChevronRight } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useLocalized, useProductPromotions } from '../../hooks/usePromotions';
import type { Product } from '../../types';
import PromoBadge from './PromoBadge';
import { CouponCode, PromotionDetailsModal } from './PromotionDetails';

/** The product's offers over the top corner of its main image, as on the cards. */
export function ProductImageBadges({ product }: { product: Product }) {
  const promotions = useProductPromotions(product);
  if (promotions.length === 0 || !product.inStock) return null;
  return (
    // No pointer events: the image underneath zooms on hover.
    <div className="absolute top-4 start-4 z-10 flex flex-col items-start gap-2 max-w-[70%] pointer-events-none">
      {promotions.slice(0, 2).map((promotion) => (
        <span key={promotion.id} className="promo-on-image">
          <PromoBadge kind={promotion.kind} label={promotion.badge} />
        </span>
      ))}
    </div>
  );
}

/**
 * The offers a product takes part in, on its own page: what each one gives, what
 * it takes to get it (quantity, coupon), and the full rules one tap away.
 */
export default function ProductOffers({ product }: { product: Product }) {
  const { t } = useTranslation();
  const text = useLocalized();
  const promotions = useProductPromotions(product);
  const [openId, setOpenId] = useState<string | null>(null);
  if (promotions.length === 0) return null;
  const opened = promotions.find((p) => p.id === openId);

  return (
    <section className="mt-6" aria-label={t('promotions.availableOffers')}>
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] mb-2.5" style={{ color: 'var(--color-muted)' }}>
        {t('promotions.availableOffers')}
      </h2>
      <ul className="space-y-2.5">
        {promotions.map((promotion) => (
          <li key={promotion.id} className="rounded-2xl border p-3.5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <PromoBadge kind={promotion.kind} label={promotion.badge} />
              {promotion.requiresCoupon && !promotion.couponCode && <span className="text-[11px] font-semibold">{t('promotions.requiresCode')}</span>}
            </div>
            <p className="text-sm mt-2 leading-relaxed">{text(promotion.summary)}</p>
            {promotion.role === 'qualifying' && <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{t('promotions.countsToward')}</p>}
            {promotion.role === 'reward' && <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{t('promotions.rewardProduct')}</p>}
            {promotion.minQuantity !== null && promotion.minQuantity > 1 && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{t('promotions.addToQualify', { count: promotion.minQuantity })}</p>
            )}
            {promotion.couponCode && (
              <div className="mt-2.5">
                <CouponCode code={promotion.couponCode} />
              </div>
            )}
            <button
              type="button"
              onClick={() => setOpenId(promotion.id)}
              aria-haspopup="dialog"
              className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 hover:text-[var(--color-gold)] transition-colors"
            >
              {t('promotions.viewDetails')} <FiChevronRight size={12} className="rtl-flip" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <PromotionDetailsModal open={Boolean(opened)} onClose={() => setOpenId(null)} promotions={opened ? [opened] : []} productName={product.name} />
    </section>
  );
}
