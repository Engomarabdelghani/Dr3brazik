import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiHeart, FiEye, FiShoppingBag } from 'react-icons/fi';
import type { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useLocalized, useProductPromotions } from '../../hooks/usePromotions';
import { cld } from '../../utils/cloudinary';
import RatingStars from '../ui/RatingStars';
import PriceTag from '../ui/PriceTag';
import Badge from '../ui/Badge';
import PromoBadge from './PromoBadge';
import PromoRibbon from './PromoRibbon';
import { PromotionDetailsModal } from './PromotionDetails';
import { useTranslation } from 'react-i18next';

/** Promotions whose whole effect is the lower price already shown on the card. */
const PRICE_KINDS = new Set(['percent', 'fixed', 'fixed_price']);

export default function ProductCard({ product, onQuickView }: { product: Product; onQuickView?: (p: Product) => void }) {
  const { t } = useTranslation();
  const text = useLocalized();
  const { addItem } = useCart();
  const { toggle, isInWishlist } = useWishlist();
  const promotions = useProductPromotions(product);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const wished = isInWishlist(product.id);

  // The price comes from the server: what one unit costs after the automatic
  // promotions. It always wins over a static, manually-set "old price": it is the
  // current campaign.
  const currentPrice = product.promoPrice ?? product.effectivePrice ?? product.price;
  const reduced = currentPrice < product.price;
  const discount = reduced
    ? Math.round(((product.price - currentPrice) / product.price) * 100)
    : product.oldPrice
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : product.discountPercent;

  // Every product on offer carries its offer at the top of its image. When there are
  // several, the one the price does not already show (a quantity offer, a gift, a
  // coupon offer) comes first, with a count for the rest.
  const priceShown = product.promoPrice != null;
  const inPrice = (p: (typeof promotions)[number]) => priceShown && PRICE_KINDS.has(p.kind) && !p.requiresCoupon;
  const lead = promotions.find((p) => !inPrice(p)) ?? promotions[0];
  const others = promotions.length - 1;
  // "15% Off" on the badge and "SALE 15% OFF" beside it would say the same thing twice.
  const badgeSaysDiscount = lead !== undefined && inPrice(lead);

  return (
    <motion.div
      className="card-luxe overflow-hidden group relative"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative overflow-hidden aspect-[4/5]">
        <Link to={`/product/${product.slug}`}>
          <motion.img
            src={cld(product.images[0], 600)}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </Link>

        <div className="absolute top-3 start-3 flex flex-col items-start gap-2 max-w-[calc(100%-4.25rem)]">
          {product.inStock && (
            <>
              {product.isNew && <Badge tone="ink">{t('products.new')}</Badge>}
              {lead && (
                <button
                  type="button"
                  onClick={() => setDetailsOpen(true)}
                  aria-haspopup="dialog"
                  aria-label={`${t('promotions.viewDetails')}: ${text(lead.badge)}`}
                  className="promo-on-image"
                >
                  <PromoBadge kind={lead.kind} label={lead.badge} size="auto" />
                  {others > 0 && <span className="promo-badge promo-badge-auto">{t('promotions.moreOffers', { count: others })}</span>}
                </button>
              )}
              {discount && !badgeSaysDiscount ? (
                <span
                  className="text-[9px] sm:text-[12px] md:text-[17px] font-black leading-none"
                  style={{
                    color: 'var(--color-coffee)',
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    letterSpacing: '0.08em',
                    textShadow: '0 0 0 rgba(0,0,0,0)',
                  }}
                >
                  {t('products.sale', { discount })}
                </span>
              ) : null}
            </>
          )}
        </div>

        <button
          aria-label={t('products.toggleWishlist')}
          onClick={() => toggle(product)}
          className="absolute top-4 end-4 w-9 h-9 rounded-full flex items-center justify-center glass shadow-sm transition-transform hover:scale-110"
        >
          <FiHeart size={16} fill={wished ? 'var(--color-gold)' : 'none'} color={wished ? 'var(--color-gold)' : 'var(--color-ink)'} />
        </button>

        {onQuickView && (
          <button
            onClick={() => onQuickView(product)}
            aria-label={t('products.quickView')}
            className="absolute bottom-3 end-3 w-9 h-9 rounded-full glass shadow-sm items-center justify-center hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <FiEye size={16} />
          </button>
        )}
      </div>

      <div className="px-4 pt-3">
        <button
          onClick={() => product.inStock && addItem(product)}
          disabled={!product.inStock}
          className={`w-full h-11 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${product.inStock
              ? 'bg-[var(--color-coffee)] text-white hover:bg-[var(--color-gold)]'
              : 'bg-[var(--color-border)] text-[var(--color-muted)] cursor-not-allowed'
            }`}
        >
          <FiShoppingBag size={15} /> {product.inStock ? t('products.addToCart') : t('products.outOfStock')}
        </button>
      </div>

      <div className="p-4">
        <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>{product.brand}</p>
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-semibold text-sm mb-1.5 line-clamp-2 leading-snug hover:text-[var(--color-gold)] transition-colors">
            {product.name}
          </h3>
        </Link>
        <RatingStars rating={product.rating} reviewCount={product.reviewCount} size={12} />
        <div className="mt-2">
          <PriceTag
            price={currentPrice}
            oldPrice={reduced ? product.price : product.oldPrice}
            currency={product.currency}
          />
        </div>

        {/* What the offers are, drifting by on a ribbon. The conditions (quantity, coupon) are part of each sentence. */}
        {lead && (
          <div className="mt-2.5">
            <PromoRibbon promotions={[lead, ...promotions.filter((p) => p !== lead)]} onOpen={() => setDetailsOpen(true)} />
          </div>
        )}
      </div>

      {promotions.length > 0 && (
        <PromotionDetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} promotions={promotions} productName={product.name} />
      )}
    </motion.div>
  );
}
