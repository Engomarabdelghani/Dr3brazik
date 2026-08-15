import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingBag, FiTruck, FiShield, FiRotateCcw } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useProduct, useProducts, getRelated, useOffers } from '../hooks/useCatalog';
import { useCategories } from '../hooks/useCatalog';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import type { Subcategory } from '../data/taxonomy';
import { WHATSAPP_NUMBER, buildWhatsAppProductInquiryMessage } from '../data/constants';
import { getBogoLabel } from '../lib/api/offers';
import { findActiveBogoOfferFor } from '../utils/bogo';
import Gallery from '../components/product/Gallery';
import RatingStars from '../components/ui/RatingStars';
import PriceTag from '../components/ui/PriceTag';
import Badge from '../components/ui/Badge';
import QuantityStepper from '../components/ui/QuantityStepper';
import Button from '../components/ui/Button';
import ProductTabs from '../components/product/ProductTabs';
import ProductCard from '../components/product/ProductCard';
import SectionHeading from '../components/common/SectionHeading';

export default function ProductDetails() {
  const { slug } = useParams();
  const { data: product, isLoading, isFetched } = useProduct(slug);
  const { data: allProducts = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { addItem } = useCart();
  const { toggle, isInWishlist } = useWishlist();
  const { items: recentlyViewed, addView } = useRecentlyViewed();
  const { data: offers = [] } = useOffers();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) addView(product);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (isFetched && !product) return <Navigate to="/404" replace />;
  if (isLoading || !product) {
    return <div className="container-luxe py-24 text-center" style={{ color: 'var(--color-muted)' }}>Loading…</div>;
  }

  const wished = isInWishlist(product.id);
  const related = getRelated(product, allProducts);
  const otherRecentlyViewed = recentlyViewed.filter((p) => p.id !== product.id);
  const productCategory = categories.find((c) => c.id === product.category);
  const productSubcategory = productCategory?.subcategories.find((s: Subcategory) => s.id === product.subcategory);
  const bogoOffer = findActiveBogoOfferFor({ id: product.id, categoryId: product.categoryId }, offers);

  const whatsappMessage = buildWhatsAppProductInquiryMessage({ name: product.name, quantity, price: product.price });

  return (
    <div className="container-luxe py-12">
      <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
        <Link to="/">Home</Link> / <Link to="/shop">Shop</Link>
        {productCategory && (
          <> / <Link to={`/shop?category=${productCategory.id}`}>{productCategory.name}</Link></>
        )}
        {productSubcategory && <> / <span>{productSubcategory.name}</span></>}
        {' '}/ <span style={{ color: 'var(--color-ink)' }}>{product.name}</span>
      </p>

      <div className="grid lg:grid-cols-2 gap-14">
        <Gallery images={product.images} name={product.name} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="lg:sticky lg:top-28 self-start">
          <p className="text-sm font-medium" style={{ color: 'var(--color-gold)' }}>{product.brand}</p>
          <h1 className="text-3xl font-extrabold mt-2">{product.name}</h1>

          <div className="flex items-center gap-3 mt-3">
            <RatingStars rating={product.rating} showValue reviewCount={product.reviewCount} />
            {product.isNew && <Badge tone="ink">New</Badge>}
          </div>

          <div className="mt-5">
            <PriceTag price={product.effectivePrice ?? product.price} oldPrice={product.oldPrice ?? (product.effectivePrice && product.effectivePrice < product.price ? product.price : undefined)} currency={product.currency} size="lg" />
          </div>

          <p className="mt-5 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{product.shortDescription}</p>

          <div className="mt-4 flex items-center gap-2">
            {product.inStock ? <Badge tone="success">In Stock</Badge> : <Badge tone="muted">Out of Stock</Badge>}
            {bogoOffer && <Badge tone="success">{getBogoLabel(bogoOffer)}</Badge>}
          </div>

          <div className="flex items-center gap-4 mt-8">
            <QuantityStepper value={quantity} onChange={setQuantity} />
            <Button variant="primary" className="flex-1" disabled={!product.inStock} onClick={() => addItem(product, quantity)}>
              <FiShoppingBag /> Add to Cart
            </Button>
            <button
              aria-label="Toggle wishlist"
              onClick={() => toggle(product)}
              className="w-12 h-12 rounded-full border flex items-center justify-center shrink-0"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <FiHeart fill={wished ? 'var(--color-gold)' : 'none'} color={wished ? 'var(--color-gold)' : 'var(--color-ink)'} />
            </button>
          </div>

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 w-full rounded-full py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: '#25D366' }}
          >
            <FaWhatsapp size={18} /> Order via WhatsApp
          </a>

          <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <div className="text-center">
              <FiTruck className="mx-auto mb-2" style={{ color: 'var(--color-gold)' }} />
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Fast Delivery</p>
            </div>
            <div className="text-center">
              <FiShield className="mx-auto mb-2" style={{ color: 'var(--color-gold)' }} />
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Authentic Products</p>
            </div>
            <div className="text-center">
              <FiRotateCcw className="mx-auto mb-2" style={{ color: 'var(--color-gold)' }} />
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>14-Day Returns</p>
            </div>
          </div>
        </motion.div>
      </div>

      <ProductTabs product={product} allProducts={allProducts} />

      {related.length > 0 && (
        <section className="mt-20">
          <SectionHeading eyebrow="You May Also Like" title="Related Products" />
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-7">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {otherRecentlyViewed.length > 0 && (
        <section className="mt-20">
          <SectionHeading eyebrow="Your History" title="Recently Viewed" />
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-7">
            {otherRecentlyViewed.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
