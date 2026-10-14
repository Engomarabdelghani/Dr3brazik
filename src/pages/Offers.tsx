import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTag } from 'react-icons/fi';
import type { Product } from '../types';
import { useProducts } from '../hooks/useCatalog';
import { useLocalized, usePromotions } from '../hooks/usePromotions';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import OfferBanner from '../components/shop/OfferBanner';
import SectionHeading from '../components/common/SectionHeading';
import { useSeo } from '../hooks/useSeo';
import { useTranslation } from 'react-i18next';

/** How much is off the product's price right now, from the prices the server sent. */
function discountPercentOf(p: Product) {
  const current = p.promoPrice ?? p.effectivePrice ?? p.price;
  if (current < p.price) return Math.round(((p.price - current) / p.price) * 100);
  if (p.oldPrice) return Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
  return p.discountPercent ?? 0;
}

/**
 * Every running promotion (each links to its own page), then every product that
 * is part of one or is marked down. Promotions are the only kind of offer now.
 */
export default function Offers() {
  const { t } = useTranslation();
  const text = useLocalized();
  const { data: products = [], isLoading } = useProducts();
  const { data: promotionsById } = usePromotions();
  useSeo({ title: 'Offers & Promotions', description: 'Every active discount, bundle, and gift offer in one place.', path: '/offers' });

  const promotions = useMemo(() => [...(promotionsById?.values() ?? [])].sort((a, b) => b.priority - a.priority), [promotionsById]);

  const discounted = useMemo(
    () =>
      products
        .filter((p) => p.promotions?.some((ref) => promotionsById?.has(ref.id)) || p.oldPrice || p.discountPercent || p.isFlashSale)
        .sort((a, b) => discountPercentOf(b) - discountPercentOf(a)),
    [products, promotionsById]
  );

  return (
    <div>
      <OfferBanner />

      {promotions.length > 0 && (
        <div className="container-luxe pt-16 md:pt-20">
          <SectionHeading eyebrow={t('offers.activePromotions')} title={t('offers.currentOffers')} description={t('offers.everyDeal')} />
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {promotions.map((promotion, i) => {
              const title = text(promotion.title);
              const badge = text(promotion.badge);
              return (
                <motion.div
                  key={promotion.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: Math.min(i, 6) * 0.08 }}
                >
                  <Link to={`/offer/${promotion.id}`} className="group block relative rounded-3xl overflow-hidden h-52" style={{ backgroundColor: 'var(--color-coffee)' }}>
                    {promotion.bannerImage && (
                      <img
                        src={promotion.bannerImage}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-110"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      {title !== badge && <p className="text-white/80 text-xs font-medium mb-1 truncate">{title}</p>}
                      <p className="text-2xl font-extrabold leading-tight" style={{ color: 'var(--color-gold-light)' }}>{badge}</p>
                      <p className="text-white/80 text-xs mt-1.5 line-clamp-2">{text(promotion.summary)}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <div className="container-luxe py-16 md:py-20">
        <SectionHeading eyebrow={t('offers.biggestSavings')} title={t('offers.discountedProducts')} description={t('offers.discountDescription')} />

        {isLoading ? (
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : discounted.length === 0 ? (
          <div className="mt-10">
            <EmptyState icon={FiTag} title={t('offers.noActiveOffers')} description={t('offers.checkBack')} actionLabel={t('offers.browseShop')} actionTo="/shop" />
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
            {discounted.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
