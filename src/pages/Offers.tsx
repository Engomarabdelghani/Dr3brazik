import { useMemo } from 'react';
import { FiTag } from 'react-icons/fi';
import type { Product } from '../types';
import { useProducts } from '../hooks/useCatalog';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import OfferBanner from '../components/shop/OfferBanner';
// import CouponStrip from '../components/shop/CouponStrip';
import SectionHeading from '../components/common/SectionHeading';

function discountPercentOf(p: Product) {
  if (p.oldPrice) return Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
  return p.discountPercent ?? 0;
}

export default function Offers() {
  const { data: products = [], isLoading } = useProducts();

  const discounted = useMemo(
    () =>
      products
        .filter((p) => p.oldPrice || p.discountPercent || p.isFlashSale)
        .sort((a, b) => discountPercentOf(b) - discountPercentOf(a)),
    [products]
  );

  return (
    <div>
      <OfferBanner />
      {/* <CouponStrip /> */}

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
