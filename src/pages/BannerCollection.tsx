import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiPackage } from 'react-icons/fi';
import { usePromoBanners, useProducts } from '../hooks/useCatalog';
import { isPromoBannerActive } from '../lib/api/promoBanners';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useSeo } from '../hooks/useSeo';

/**
 * A dedicated page for a "bundle" promo banner — the products the admin
 * picked, shown for the customer to browse and add themselves (not added
 * automatically). Each product keeps its own real price/discount.
 */
export default function BannerCollection() {
  const { id } = useParams();
  const { data: banners = [], isLoading: bannersLoading } = usePromoBanners();
  const { data: products = [], isLoading: productsLoading } = useProducts();

  const banner = banners.find((b) => b.id === id && isPromoBannerActive(b));

  useSeo({ title: banner?.title, description: banner ? `${banner.title} — shop the collection.` : undefined, path: `/collection/${id ?? ''}` });

  const matchedProducts = useMemo(() => {
    if (!banner?.productIds) return [];
    return products.filter((p) => banner.productIds!.includes(p.id));
  }, [banner, products]);

  const isLoading = bannersLoading || productsLoading;

  if (!isLoading && !banner) {
    return (
      <div className="container-luxe py-20">
        <EmptyState icon={FiPackage} title="Collection not found" description="This collection may have been removed." actionLabel="Browse Shop" actionTo="/shop" />
      </div>
    );
  }

  return (
    <div>
      <div
        className="relative overflow-hidden py-14 md:py-20"
        style={{ background: banner?.image ? undefined : 'linear-gradient(135deg, var(--color-coffee), #2a1c1e)' }}
      >
        {banner?.image && (
          <>
            <img src={banner.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/55" />
          </>
        )}
        <div className="relative container-luxe text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium mb-6 text-white/70 hover:text-white transition-colors">
            <FiArrowLeft /> Back to Home
          </Link>
          {isLoading ? (
            <div className="skeleton h-10 w-64 mx-auto rounded-lg" />
          ) : (
            <h1 className="text-2xl md:text-4xl font-extrabold" style={{ color: 'var(--color-gold-light)' }}>{banner!.title}</h1>
          )}
        </div>
      </div>

      <div className="container-luxe py-14 md:py-16">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : matchedProducts.length === 0 ? (
          <EmptyState icon={FiPackage} title="No products in this collection" description="Check back soon." actionLabel="Browse Shop" actionTo="/shop" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
            {matchedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
