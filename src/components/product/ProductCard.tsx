import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiHeart, FiEye, FiShoppingBag } from 'react-icons/fi';
import type { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useOffers } from '../../hooks/useCatalog';
import { getBogoLabel } from '../../lib/api/offers';
import { findActiveBogoOfferFor } from '../../utils/bogo';
import { cld } from '../../utils/cloudinary';
import RatingStars from '../ui/RatingStars';
import PriceTag from '../ui/PriceTag';
import Badge from '../ui/Badge';

export default function ProductCard({ product, onQuickView }: { product: Product; onQuickView?: (p: Product) => void }) {
  const { addItem } = useCart();
  const { toggle, isInWishlist } = useWishlist();
  const { data: offers = [] } = useOffers();
  const wished = isInWishlist(product.id);
  // A live active Offer (effectivePrice) always wins over a static, manually-set
  // "old price" on the product itself — the Offer is the current campaign, so it
  // should be what customers see everywhere, not just on its dedicated page.
  const hasActiveOfferPrice = product.effectivePrice != null && product.effectivePrice < product.price;
  const discount = hasActiveOfferPrice
    ? Math.round(((product.price - product.effectivePrice!) / product.price) * 100)
    : product.oldPrice
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : product.discountPercent;
  const bogoOffer = findActiveBogoOfferFor({ id: product.id, categoryId: product.categoryId }, offers);

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

        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNew && <Badge tone="ink">New</Badge>}
          {discount ? <Badge tone="gold">-{discount}%</Badge> : null}
          {bogoOffer && <Badge tone="success">{getBogoLabel(bogoOffer)}</Badge>}
        </div>

        <button
          aria-label="Toggle wishlist"
          onClick={() => toggle(product)}
          className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center glass shadow-sm transition-transform hover:scale-110"
        >
          <FiHeart size={16} fill={wished ? 'var(--color-gold)' : 'none'} color={wished ? 'var(--color-gold)' : 'var(--color-ink)'} />
        </button>

        <div className="absolute inset-x-3 bottom-3 flex gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={() => addItem(product)}
            className="flex-1 h-10 rounded-full bg-[var(--color-ink)] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[var(--color-gold)] transition-colors"
          >
            <FiShoppingBag size={14} /> Add to Cart
          </button>
          {onQuickView && (
            <button
              onClick={() => onQuickView(product)}
              aria-label="Quick view"
              className="w-10 h-10 rounded-full glass flex items-center justify-center"
            >
              <FiEye size={16} />
            </button>
          )}
        </div>
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
            price={product.effectivePrice ?? product.price}
            oldPrice={hasActiveOfferPrice ? product.price : product.oldPrice}
            currency={product.currency}
          />
        </div>
      </div>
    </motion.div>
  );
}
