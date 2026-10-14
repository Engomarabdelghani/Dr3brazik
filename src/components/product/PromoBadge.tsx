import { FiGift, FiLayers, FiPercent, FiShoppingBag, FiTag } from 'react-icons/fi';
import type { Localized, PromotionKind } from '../../api/promotionTypes';
import { useLocalized } from '../../hooks/usePromotions';

const ICONS: Record<PromotionKind, typeof FiTag> = {
  percent: FiPercent,
  fixed: FiTag,
  fixed_price: FiTag,
  bxgy: FiLayers,
  tiered: FiLayers,
  gift: FiGift,
  gift_choice: FiGift,
  order: FiShoppingBag,
};

/** Three quiet treatments: quantity offers (dark), gifts (light, gift icon), price offers (cream). */
const TONE: Record<PromotionKind, 'quantity' | 'gift' | 'price'> = {
  percent: 'price',
  fixed: 'price',
  fixed_price: 'price',
  order: 'price',
  bxgy: 'quantity',
  tiered: 'quantity',
  gift: 'gift',
  gift_choice: 'gift',
};

/** The short label of a promotion, as written by the server. */
export default function PromoBadge({ kind, label, size = 'md' }: { kind: PromotionKind; label: Localized; /** auto: small on phones, regular from tablets up. */ size?: 'sm' | 'md' | 'auto' }) {
  const text = useLocalized()(label);
  const Icon = ICONS[kind];
  return (
    <span className={`promo-badge promo-badge-${TONE[kind]} ${size === 'sm' ? 'promo-badge-sm' : size === 'auto' ? 'promo-badge-auto' : ''}`} title={text}>
      <Icon aria-hidden="true" className="promo-badge-icon" />
      <span className="truncate">{text}</span>
    </span>
  );
}
