import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { FiChevronLeft, FiChevronRight, FiCopy, FiCheck } from 'react-icons/fi';
import type { CouponAnnouncement } from '../../api/types';
import type { PromotionDisplay } from '../../api/promotionTypes';
import { fetchCouponAnnouncements } from '../../lib/api/coupons';
import { useLocalized, usePromotions } from '../../hooks/usePromotions';
import { PROMO_ICONS } from '../product/PromoBadge';
import { useTranslation } from 'react-i18next';

export const ANNOUNCEMENT_BAR_HEIGHT = 36; // px — kept in sync with Navbar's top offset and Layout's main padding

/** How long each message stays before the next one slides in. */
const ROTATE_MS = 5000;

export type Announcement = { type: 'promotion'; promotion: PromotionDisplay } | { type: 'coupon'; coupon: CouponAnnouncement };

/**
 * What the strip above the Navbar announces: every running storefront promotion
 * (highest priority first), then the newest storewide coupon. Only coupons whose
 * targetType is 'all' come back from the API — a product-restricted code would be
 * misleading shown on every page regardless of what's in view.
 */
export function useAnnouncements(): Announcement[] {
  const { data: promotions } = usePromotions();
  const { data: coupons = [] } = useQuery({ queryKey: ['coupons', 'announcements'], queryFn: fetchCouponAnnouncements, staleTime: 60_000 });
  return useMemo(() => {
    const list: Announcement[] = [...(promotions?.values() ?? [])]
      .sort((a, b) => b.priority - a.priority)
      .map((promotion) => ({ type: 'promotion', promotion }));
    if (coupons[0]) list.push({ type: 'coupon', coupon: coupons[0] });
    return list;
  }, [promotions, coupons]);
}

/** Fixed strip above the Navbar. Shows one message at a time and moves on every few seconds. */
export default function AnnouncementBar({ items }: { items: Announcement[] }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;
  const current = items[index % count];

  useEffect(() => {
    if (count < 2 || paused || reduceMotion) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearTimeout(timer);
  }, [index, count, paused, reduceMotion]);

  const step = (by: number) => setIndex((i) => (i + by + count) % count);

  return (
    <div
      className="announcement-bar fixed top-0 inset-x-0 z-50 flex items-center justify-center text-white text-xs md:text-sm font-medium px-2"
      style={{ height: ANNOUNCEMENT_BAR_HEIGHT }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {count > 1 && (
        <button type="button" onClick={() => step(-1)} aria-label={t('announcement.previous')} className="announcement-arrow">
          <FiChevronLeft size={15} className="rtl-flip" />
        </button>
      )}
      <div className="relative h-full flex-1 min-w-0 max-w-3xl overflow-hidden" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index % count}
            className="absolute inset-0 flex items-center justify-center gap-2 px-1"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {current.type === 'promotion' ? <PromotionMessage promotion={current.promotion} /> : <CouponMessage coupon={current.coupon} />}
          </motion.div>
        </AnimatePresence>
      </div>
      {count > 1 && (
        <button type="button" onClick={() => step(1)} aria-label={t('announcement.next')} className="announcement-arrow">
          <FiChevronRight size={15} className="rtl-flip" />
        </button>
      )}
    </div>
  );
}

function PromotionMessage({ promotion }: { promotion: PromotionDisplay }) {
  const text = useLocalized();
  const Icon = PROMO_ICONS[promotion.kind];
  return (
    <Link to={`/offer/${promotion.id}`} className="announcement-link">
      <Icon size={13} aria-hidden="true" className="shrink-0" style={{ color: 'var(--color-gold-light)' }} />
      <span className="truncate">{text(promotion.summary)}</span>
    </Link>
  );
}

function CouponMessage({ coupon }: { coupon: CouponAnnouncement }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard API unavailable — ignore, the code is still visible to copy manually
    }
  };

  return (
    <>
      <span className="truncate">{t('announcement.useCode', { code: coupon.code })}</span>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0"
        style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
      >
        {copied ? <FiCheck size={11} /> : <FiCopy size={11} />}
        {copied ? t('announcement.copied') : t('announcement.copy')}
      </button>
    </>
  );
}
