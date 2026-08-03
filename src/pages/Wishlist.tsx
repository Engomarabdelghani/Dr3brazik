import { FiHeart } from 'react-icons/fi';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/product/ProductCard';
import EmptyState from '../components/ui/EmptyState';

export default function Wishlist() {
  const { items } = useWishlist();

  return (
    <div className="container-luxe py-12">
      <span className="eyebrow">Saved for Later</span>
      <h1 className="section-title mt-3 mb-10">Your Wishlist</h1>

      {items.length === 0 ? (
        <EmptyState
          icon={FiHeart}
          title="Your wishlist is empty"
          description="Save the products you love and come back to them anytime."
          actionLabel="Explore Products"
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
