import { useId, useState } from 'react';
import { FiCheck, FiClock, FiCopy, FiGift } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import type { PromotionDisplay, PromotionRole } from '../../api/promotionTypes';
import { useLocalized, useProductName } from '../../hooks/usePromotions';
import { cld } from '../../utils/cloudinary';
import Modal from '../ui/Modal';
import PromoBadge from './PromoBadge';

const money = (n: number) => `${n.toLocaleString('en-US')} EGP`;

export function CouponCode({ code }: { code: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: the code is on screen to type */
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span style={{ color: 'var(--color-muted)' }}>{t('promotions.useCode')}</span>
      <code className="px-2.5 py-1 rounded-lg font-bold tracking-wider border border-dashed" style={{ borderColor: 'var(--color-gold)', backgroundColor: 'var(--color-cream)' }}>
        {code}
      </code>
      <button type="button" onClick={copy} className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-black/5 transition-colors" aria-live="polite">
        {copied ? <FiCheck size={13} /> : <FiCopy size={13} />} {copied ? t('promotions.copied') : t('promotions.copyCode')}
      </button>
    </div>
  );
}

/** Everything a customer needs to know about one promotion, in plain language. */
export function PromotionInfo({ promotion, role, headingId, compact = false }: { promotion: PromotionDisplay; role?: PromotionRole; headingId?: string; compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const text = useLocalized();
  const productName = useProductName();
  const title = text(promotion.title);
  const badge = text(promotion.badge);
  const ends = promotion.endsAt
    ? new Intl.DateTimeFormat(i18n.language.startsWith('ar') ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(promotion.endsAt))
    : null;

  return (
    <div className="min-w-0">
      <PromoBadge kind={promotion.kind} label={promotion.badge} />
      {/* The badge already says it when no custom title was written. */}
      <h3 id={headingId} className={title === badge ? 'sr-only' : `font-bold mt-2.5 ${compact ? 'text-base' : 'text-lg'}`}>
        {title}
      </h3>
      <p className="text-sm mt-2 leading-relaxed">{text(promotion.summary)}</p>
      {promotion.description && (
        <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          {text(promotion.description)}
        </p>
      )}

      {role === 'qualifying' && <p className="text-xs mt-2 font-medium">{t('promotions.countsToward')}</p>}
      {role === 'reward' && <p className="text-xs mt-2 font-medium">{t('promotions.rewardProduct')}</p>}
      {promotion.minQuantity !== null && promotion.minQuantity > 1 && (
        <p className="text-xs mt-2 font-medium">{t('promotions.addToQualify', { count: promotion.minQuantity })}</p>
      )}

      {promotion.gifts.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <FiGift size={13} style={{ color: 'var(--color-gold)' }} aria-hidden="true" />
            {promotion.giftChoose ? t('promotions.chooseGifts', { count: promotion.giftChoose }) : t(promotion.gifts.length > 1 ? 'promotions.freeGifts' : 'promotions.freeGift')}
          </p>
          <ul className="grid grid-cols-2 gap-2">
            {promotion.gifts.map((gift) => (
              <li key={gift.productId} className="flex items-center gap-2.5 p-2 rounded-xl border min-w-0" style={{ borderColor: 'var(--color-border)', opacity: gift.inStock ? 1 : 0.55 }}>
                {gift.image ? (
                  <img src={cld(gift.image, 96)} alt="" loading="lazy" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <span className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
                    <FiGift size={15} aria-hidden="true" />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-xs font-medium line-clamp-2">
                    {gift.quantity > 1 ? `${gift.quantity} × ` : ''}
                    {productName(gift)}
                  </span>
                  <span className="block text-[11px]" style={{ color: 'var(--color-muted)' }}>
                    {gift.inStock ? t('promotions.giftValue', { value: money(gift.value) }) : t('promotions.giftOutOfStock')}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {promotion.giftCount > promotion.gifts.length && (
            <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>{t('promotions.moreGifts', { count: promotion.giftCount - promotion.gifts.length })}</p>
          )}
        </div>
      )}

      {promotion.details.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold mb-1.5">{t('promotions.howItWorks')}</p>
          <ul className="space-y-1 text-xs leading-relaxed list-disc ps-4" style={{ color: 'var(--color-muted)' }}>
            {promotion.details.map((line) => (
              <li key={line.en}>{text(line)}</li>
            ))}
          </ul>
        </div>
      )}

      {promotion.couponCode ? (
        <div className="mt-4">
          <CouponCode code={promotion.couponCode} />
        </div>
      ) : (
        promotion.requiresCoupon && <p className="text-xs mt-4 font-medium">{t('promotions.requiresCode')}</p>
      )}
      {ends && (
        <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: 'var(--color-muted)' }}>
          <FiClock size={12} aria-hidden="true" /> {t('promotions.endsOn', { date: ends })}
        </p>
      )}
    </div>
  );
}

/** The offers of one product, in a dialog opened from its card or page. */
export function PromotionDetailsModal({ open, onClose, promotions, productName }: {
  open: boolean;
  onClose: () => void;
  promotions: (PromotionDisplay & { role?: PromotionRole })[];
  productName?: string;
}) {
  const { t } = useTranslation();
  const headingId = useId();
  return (
    <Modal open={open} onClose={onClose} labelledBy={headingId} closeLabel={t('common.close')}>
      <p className="eyebrow">{t(promotions.length > 1 ? 'promotions.offers' : 'promotions.offer')}</p>
      <h2 id={headingId} className="text-xl font-extrabold mt-1.5 pe-10 line-clamp-2">
        {productName ?? t('promotions.availableOffers')}
      </h2>
      <div className="mt-5 space-y-6">
        {promotions.map((promotion, index) => (
          <section key={promotion.id} className={index > 0 ? 'pt-6 border-t' : ''} style={{ borderColor: 'var(--color-border)' }}>
            <PromotionInfo promotion={promotion} role={promotion.role} />
          </section>
        ))}
      </div>
      <p className="text-[11px] mt-6 pt-4 border-t" style={{ color: 'var(--color-muted)', borderColor: 'var(--color-border)' }}>
        {t('promotions.confirmedInCart')}
      </p>
    </Modal>
  );
}
