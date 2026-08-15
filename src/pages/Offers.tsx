import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTag } from 'react-icons/fi';
import type { Product } from '../types';
import { useProducts, useOffers, useCategories } from '../hooks/useCatalog';
import { isOfferActive, getBogoLabel, offerTargetsProduct } from '../lib/api/offers';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import OfferBanner from '../components/shop/OfferBanner';
import SectionHeading from '../components/common/SectionHeading';

function discountPercentOf(p: Product) {
  if (p.oldPrice) return Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
  return p.discountPercent ?? 0;
}

export default function Offers() {
  const { data: products = [], isLoading } = useProducts();
  const { data: offers = [] } = useOffers();
  const { data: categories = [] } = useCategories();

  const activeOffers = useMemo(() => offers.filter(isOfferActive), [offers]);

  const discounted = useMemo(() => {
    const bogoTargeted = new Set(
      products.filter((p) => activeOffers.some((o) => o.discountType === 'bogo' && offerTargetsProduct(o, { id: p.id, categoryId: p.categoryId }))).map((p) => p.id)
    );
    return products
      .filter((p) => p.oldPrice || p.discountPercent || p.isFlashSale || bogoTargeted.has(p.id))
      .sort((a, b) => discountPercentOf(b) - discountPercentOf(a));
  }, [products, activeOffers]);

  return (
    <div>
      <OfferBanner />

      {activeOffers.length > 0 && (
        <div className="container-luxe pt-16 md:pt-20">
          <SectionHeading eyebrow="Active Promotions" title="Current Offers" description="Every deal running right now — tap one to shop it." />
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeOffers.map((offer, i) => {
              const category = categories.find((c) => c.id === offer.categoryId);
              const href = offer.targetType === 'category' && category ? `/shop?category=${category.id}` : '/shop';
              const label = offer.discountType === 'bogo'
                ? getBogoLabel(offer)
                : offer.discountType === 'percent'
                  ? `${offer.discountValue}% OFF`
                  : `${offer.discountValue} EGP OFF`;
              return (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                >
                  <Link to={href} className="group block relative rounded-3xl overflow-hidden h-52" style={{ backgroundColor: 'var(--color-ink)' }}>
                    {offer.bannerImage && (
                      <img
                        src={offer.bannerImage}
                        alt={offer.title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-110"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      {offer.discountType === 'bogo' && (
                        <span className="badge-luxe self-start mb-2" style={{ backgroundColor: 'rgba(34,197,94,0.9)', color: '#fff' }}>
                          <FiTag size={11} className="inline mr-1" /> BOGO
                        </span>
                      )}
                      <p className="text-white/70 text-xs font-medium mb-1 truncate">{offer.title}</p>
                      <p className="text-2xl font-extrabold" style={{ color: 'var(--color-gold-light)' }}>{label}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <div className="container-luxe py-16 md:py-20">
        <SectionHeading
          eyebrow="Biggest Savings First"
          title="Discounted Products"
          description="Every product below is marked down for a limited time — sorted by the deepest discount."
        />

        {isLoading ? (
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : discounted.length === 0 ? (
          <div className="mt-10">
            <EmptyState icon={FiTag} title="No active offers" description="Check back soon for new promotions." actionLabel="Browse Shop" actionTo="/shop" />
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
