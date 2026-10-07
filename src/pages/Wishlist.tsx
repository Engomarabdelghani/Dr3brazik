import { FiHeart } from 'react-icons/fi';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/product/ProductCard';
import EmptyState from '../components/ui/EmptyState';
import { useTranslation } from 'react-i18next';

export default function Wishlist() {
  const { t } = useTranslation();
  const { items } = useWishlist();

  return (
    <div className="container-luxe py-12">
      <span className="eyebrow">{t('wishlist.savedForLater')}</span>
      <h1 className="section-title mt-3 mb-10">{t('wishlist.title')}</h1>

      {items.length === 0 ? (
        <EmptyState
          icon={FiHeart}
          title={t('wishlist.empty')}
          description={t('wishlist.emptyDescription')}
          actionLabel={t('wishlist.explore')}
          actionTo="/shop"
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
          {items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
