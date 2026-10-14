/**
 * The promotion parts of the cart, drawer and checkout. Everything shown here
 * comes from the server's quote: which offers applied, what they took off, the
 * free gifts and what is still missing. Nothing is calculated in the browser.
 */
import { FiCheck, FiGift, FiInfo, FiTrendingUp } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import type { CartGiftChoice } from '../../api/promotionTypes';
import { useCart } from '../../context/CartContext';
import { useLocalized, useProductName } from '../../hooks/usePromotions';
import { cld } from '../../utils/cloudinary';

const money = (n: number) => `${n.toLocaleString('en-US')} EGP`;

function GiftThumb({ image, size }: { image: string | null; size: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'w-12 h-14 rounded-lg' : 'w-20 h-24 rounded-xl';
  return image ? (
    <img src={cld(image, 200)} alt="" loading="lazy" decoding="async" className={`${box} object-cover shrink-0`} />
  ) : (
    <span className={`${box} shrink-0 flex items-center justify-center`} style={{ backgroundColor: 'var(--color-cream)' }}>
      <FiGift size={18} style={{ color: 'var(--color-gold)' }} aria-hidden="true" />
    </span>
  );
}

/** Free gifts as their own lines: clearly not something the customer is paying for. */
export function CartGiftLines({ variant = 'card' }: { variant?: 'card' | 'compact' }) {
  const { t } = useTranslation();
  const { promotions } = useCart();
  const name = useProductName();
  if (promotions.gifts.length === 0) return null;

  return (
    <ul className={variant === 'card' ? 'space-y-4' : 'space-y-3'} aria-label={t('promotions.freeGifts')}>
      {promotions.gifts.map((gift) =>
        variant === 'card' ? (
          <li key={gift.key} className="gift-line p-4 md:p-5 flex gap-4 md:gap-6">
            <GiftThumb image={gift.image} size="md" />
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <span className="promo-badge promo-badge-gift promo-badge-sm">
                  <FiGift className="promo-badge-icon" aria-hidden="true" /> {t('promotions.freeGift')}
                </span>
                <p className="font-semibold mt-2 line-clamp-2">{name(gift)}</p>
              </div>
              <div className="flex items-center justify-between mt-3 text-sm">
                <span style={{ color: 'var(--color-muted)' }}>{t('promotions.qty', { count: gift.quantity })}</span>
                <span className="font-bold">
                  <bdi className="line-through font-normal me-2 text-xs" style={{ color: 'var(--color-muted)' }}>{money(gift.value * gift.quantity)}</bdi>
                  <bdi>{t('promotions.free')}</bdi>
                </span>
              </div>
            </div>
          </li>
        ) : (
          <li key={gift.key} className="flex items-center gap-3 text-sm">
            <GiftThumb image={gift.image} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-medium line-clamp-1">{name(gift)}</p>
              <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-muted)' }}>
                <FiGift size={11} style={{ color: 'var(--color-gold)' }} aria-hidden="true" /> {t('promotions.freeGift')} · {t('promotions.qty', { count: gift.quantity })}
              </p>
            </div>
            <p className="font-semibold">{t('promotions.free')}</p>
          </li>
        )
      )}
    </ul>
  );
}

/**
 * The customer chooses their gift here. Nothing is chosen for them: until they tap
 * one, no gift is in the cart, and tapping the chosen gift again takes it back out.
 */
function GiftChooser({ choice }: { choice: CartGiftChoice }) {
  const { t } = useTranslation();
  const { selectGifts, isPricing } = useCart();
  const text = useLocalized();
  const name = useProductName();
  const single = choice.slots === 1;
  const pending = choice.remaining > 0;
  const heading = single ? t('promotions.chooseGift') : t('promotions.chooseGifts', { count: choice.slots });

  const toggle = (productId: string) => {
    const current = choice.selected;
    if (current.includes(productId)) return selectGifts(choice.promotionId, current.filter((id) => id !== productId));
    // One gift: the new pick replaces the old. Several: the oldest pick makes room.
    selectGifts(choice.promotionId, single ? [productId] : [...current, productId].slice(-choice.slots));
  };

  return (
    <fieldset className={`gift-line p-4 md:p-5 ${pending ? 'gift-line-pending' : ''}`} disabled={isPricing}>
      <legend className="sr-only">{heading}</legend>
      <p className="font-semibold text-sm flex items-center gap-2" aria-hidden="true">
        <FiGift style={{ color: 'var(--color-gold)' }} /> {heading}
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
        {text(choice.title)} · {pending ? t('promotions.giftPickHint') : t('promotions.giftPicked')}
      </p>
      {/* A whole category can be dozens of gifts: the list scrolls inside the card instead of pushing the cart down. */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3 ${choice.options.length > 6 ? 'gift-options-scroll' : ''}`}>
        {choice.options.map((option) => {
          const selected = choice.selected.includes(option.productId);
          return (
            <button
              type="button"
              key={option.productId}
              aria-pressed={selected}
              disabled={!option.available && !selected}
              onClick={() => toggle(option.productId)}
              className={`gift-option ${selected ? 'gift-option-selected' : ''} ${option.available || selected ? '' : 'gift-option-unavailable'}`}
            >
              {option.image ? (
                <img src={cld(option.image, 160)} alt="" loading="lazy" className="w-full aspect-square object-cover rounded-lg" />
              ) : (
                <span className="w-full aspect-square rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)' }}>
                  <FiGift size={20} style={{ color: 'var(--color-gold)' }} aria-hidden="true" />
                </span>
              )}
              <span className="block text-xs font-medium mt-2 line-clamp-2 leading-snug">{name(option)}</span>
              <span className="block text-[11px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
                {option.available || selected ? t('promotions.giftValue', { value: money(option.value) }) : t('promotions.giftOutOfStock')}
              </span>
              {selected && (
                <span className="gift-option-check">
                  <FiCheck size={11} aria-hidden="true" />
                  <span className="sr-only">{t('promotions.giftSelected')}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** One chooser per "choose a gift" promotion that currently applies. */
export function CartGiftChoices() {
  const { promotions } = useCart();
  if (promotions.giftChoices.length === 0) return null;
  return (
    <div className="space-y-4">
      {promotions.giftChoices.map((choice) => (
        <GiftChooser key={choice.promotionId} choice={choice} />
      ))}
    </div>
  );
}

/** "Add 1 more to unlock…" and, when it helps, why an expected offer is missing. */
export function CartOfferMessages({ dense = false }: { dense?: boolean }) {
  const { t } = useTranslation();
  const { promotions } = useCart();
  const text = useLocalized();
  if (promotions.hints.length === 0 && promotions.notices.length === 0) return null;

  return (
    <ul className="space-y-2" aria-label={t('promotions.almostThere')}>
      {promotions.hints.map((hint) => (
        <li key={`hint-${hint.promotionId}`} className={`offer-note offer-note-hint ${dense ? 'text-xs' : 'text-sm'}`}>
          <FiTrendingUp className="shrink-0 mt-0.5" aria-hidden="true" />
          <span>{text(hint.message)}</span>
        </li>
      ))}
      {promotions.notices.map((notice) => (
        <li key={`notice-${notice.promotionId}`} className={`offer-note ${dense ? 'text-xs' : 'text-sm'}`}>
          <FiInfo className="shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            <span className="font-semibold">{text(notice.title)}: </span>
            {text(notice.message)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The discount part of a price summary, one row per reason: each promotion that
 * took money off, then the coupon. Rows only; the caller
 * supplies the list wrapper.
 */
export function DiscountRows({ muted = 'var(--color-muted)' }: { muted?: string }) {
  const { t } = useTranslation();
  const { promotions, coupon, couponDiscount } = useCart();
  const text = useLocalized();
  const saving = { color: '#15803d' };

  return (
    <>
      {promotions.applied
        .filter((p) => p.discount > 0)
        .map((p) => (
          <div key={p.id} className="flex justify-between gap-3">
            <span className="min-w-0 truncate" style={{ color: muted }} title={text(p.summary)}>
              {text(p.title)}
              {p.couponCode && coupon === p.couponCode ? ` (${p.couponCode})` : ''}
            </span>
            <span className="font-semibold whitespace-nowrap" style={saving}>-{money(p.discount)}</span>
          </div>
        ))}
      {couponDiscount > 0 && coupon && (
        <div className="flex justify-between gap-3">
          <span className="min-w-0 truncate" style={{ color: muted }}>{t('promotions.coupon', { code: coupon })}</span>
          <span className="font-semibold whitespace-nowrap" style={saving}>-{money(couponDiscount)}</span>
        </div>
      )}
    </>
  );
}

/** Free gifts that applied but cost nothing: listed so the customer sees the offer was counted. */
export function AppliedGiftRows({ muted = 'var(--color-muted)' }: { muted?: string }) {
  const { t } = useTranslation();
  const { promotions } = useCart();
  const text = useLocalized();
  const giftOnly = promotions.applied.filter((p) => p.discount === 0 && p.giftValue > 0);
  return (
    <>
      {giftOnly.map((p) => (
        <div key={p.id} className="flex justify-between gap-3">
          <span className="min-w-0 truncate" style={{ color: muted }}>{text(p.title)}</span>
          <span className="font-semibold whitespace-nowrap flex items-center gap-1" style={{ color: '#15803d' }}>
            <FiGift size={12} aria-hidden="true" /> {t('promotions.free')}
          </span>
        </div>
      ))}
    </>
  );
}
