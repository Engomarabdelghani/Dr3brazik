import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiTag } from 'react-icons/fi';
import { useProducts } from '../hooks/useCatalog';
import { useLocalized, usePromotions } from '../hooks/usePromotions';
import ProductCard from '../components/product/ProductCard';
import { PromotionInfo } from '../components/product/PromotionDetails';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useTranslation } from 'react-i18next';

/**
 * The page of one promotion: what a promo banner links to (/offer/<id>). It
 * shows the promotion's rules and the products the server attached it to. Offers
 * that existed before the merge kept their ids, so their old links land here.
 */
export default function OfferCollection() {
  const { t } = useTranslation();
  const text = useLocalized();
  const { id } = useParams();
  const { data: promotions, isLoading: promotionsLoading } = usePromotions();
  const { data: products = [], isLoading: productsLoading } = useProducts();

  const promotion = id ? promotions?.get(id) : undefined;
  const matchedProducts = useMemo(() => (promotion ? products.filter((p) => p.promotions?.some((ref) => ref.id === promotion.id)) : []), [promotion, products]);
  const isLoading = promotionsLoading || productsLoading;

  if (!isLoading && !promotion) {
    return (
      <div className="container-luxe py-20">
        <EmptyState icon={FiTag} title={t('offers.offerNotFound')} description={t('offers.offerEnded')} actionLabel={t('offers.browseOffers')} actionTo="/offers" />
      </div>
    );
  }

  const title = promotion ? text(promotion.title) : '';
  const badge = promotion ? text(promotion.badge) : '';

  return (
    <div>
      <div
        className="relative overflow-hidden py-14 md:py-20"
        style={{ background: promotion?.bannerImage ? undefined : 'linear-gradient(135deg, var(--color-coffee), #2a1c1e)' }}
      >
        {promotion?.bannerImage && (
          <>
            <img src={promotion.bannerImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/55" />
          </>
        )}
        <div className="relative container-luxe text-center">
          <Link to="/offers" className="inline-flex items-center gap-2 text-sm font-medium mb-6 text-white/70 hover:text-white transition-colors">
            <FiArrowLeft className="rtl-flip" /> {t('offers.backToOffers')}
          </Link>
          {isLoading || !promotion ? (
            <div className="skeleton h-10 w-64 mx-auto rounded-lg" />
          ) : (
            <>
              {title !== badge && <p className="text-white/80 text-sm font-medium mb-2">{title}</p>}
              <h1 className="text-3xl md:text-5xl font-extrabold" style={{ color: 'var(--color-gold-light)' }}>{badge}</h1>
              <p className="text-white/85 text-sm md:text-base mt-3 max-w-2xl mx-auto">{text(promotion.summary)}</p>
            </>
          )}
        </div>
      </div>

      <div className="container-luxe py-14 md:py-16">
        {promotion && (
          <div className="card-luxe p-5 md:p-6 mb-10 max-w-3xl">
            <PromotionInfo promotion={promotion} compact />
          </div>
        )}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : matchedProducts.length === 0 ? (
          // A cart-wide offer has no products of its own: the whole shop takes part.
          <EmptyState
            icon={FiTag}
            title={promotion?.scope === 'order' ? badge : t('offers.noProducts')}
            description={promotion?.scope === 'order' ? text(promotion.summary) : t('offers.checkBack')}
            actionLabel={t('offers.browseShop')}
            actionTo="/shop"
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
            {matchedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
