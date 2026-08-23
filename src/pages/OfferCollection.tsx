import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiTag } from 'react-icons/fi';
import { useProducts, useOffers } from '../hooks/useCatalog';
import {  getBogoLabel, offerTargetsProduct } from '../lib/api/offers';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

/**
 * A dedicated page for a single offer — e.g. what a promo banner links to.
 * Shows only the products that offer actually targets (whether that's an
 * entire category, or a hand-picked set of specific products spanning
 * multiple categories), with the discount already applied via effectivePrice.
 */
export default function OfferCollection() {
  const { id } = useParams();
  const { data: offers = [], isLoading: offersLoading } = useOffers();
  const { data: products = [], isLoading: productsLoading } = useProducts();

  const offer = offers.find((o) => o.id === id);

  const matchedProducts = useMemo(() => {
    if (!offer) return [];
    // ProductCard now always prefers a live active offer's effectivePrice over any
    // separate manually-set "old price" on the product, so no override is needed here.
    return products.filter((p) => offerTargetsProduct(offer, { id: p.id, categoryId: p.categoryId }));
  }, [offer, products]);

  const isLoading = offersLoading || productsLoading;

  if (!isLoading && !offer) {
    return (
      <div className="container-luxe py-20">
        <EmptyState icon={FiTag} title="Offer not found" description="This offer may have ended or been removed." actionLabel="Browse Offers" actionTo="/offers" />
      </div>
    );
  }

  const label = offer
    ? offer.discountType === 'bogo'
      ? getBogoLabel(offer)
      : offer.discountType === 'percent'
        ? `${offer.discountValue}% OFF`
        : `${offer.discountValue} EGP OFF`
    : '';

  return (
    <div>
      <div
        className="relative overflow-hidden py-14 md:py-20"
        style={{ background: offer?.bannerImage ? undefined : 'linear-gradient(135deg, var(--color-ink), #2a1c1e)' }}
      >
        {offer?.bannerImage && (
          <>
            <img src={offer.bannerImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/55" />
          </>
        )}
        <div className="relative container-luxe text-center">
          <Link to="/offers" className="inline-flex items-center gap-2 text-sm font-medium mb-6 text-white/70 hover:text-white transition-colors">
            <FiArrowLeft /> Back to Offers
          </Link>
          {isLoading ? (
            <div className="skeleton h-10 w-64 mx-auto rounded-lg" />
          ) : (
            <>
              <p className="text-white/70 text-sm font-medium mb-2">{offer!.title}</p>
              <h1 className="text-3xl md:text-5xl font-extrabold" style={{ color: 'var(--color-gold-light)' }}>{label}</h1>
            </>
          )}
        </div>
      </div>

      <div className="container-luxe py-14 md:py-16">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : matchedProducts.length === 0 ? (
          <EmptyState icon={FiTag} title="No products in this offer" description="Check back soon." actionLabel="Browse Shop" actionTo="/shop" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
            {matchedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
