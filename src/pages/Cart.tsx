import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTrash2, FiShoppingBag, FiTag, FiArrowRight } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { cld } from '../utils/cloudinary';
import QuantityStepper from '../components/ui/QuantityStepper';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { useSeo } from '../hooks/useSeo';

export default function Cart() {
  useSeo({ title: 'Shopping Cart', path: '/cart', noindex: true });
  const { items, updateQuantity, removeItem, subtotal, coupon, discount, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const onApply = (e: React.FormEvent) => {
    e.preventDefault();
    const result = applyCoupon(code);
    if (!result.ok) {
      setError(result.message ?? 'Invalid coupon code');
    } else {
      setError('');
      setCode('');
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-luxe py-20">
        <EmptyState
          icon={FiShoppingBag}
          title="Your bag is empty"
          description="Looks like you haven't added anything to your bag yet. Discover our luxury collection."
          actionLabel="Start Shopping"
          actionTo="/shop"
        />
      </div>
    );
  }

  return (
    <div className="container-luxe py-12">
      <span className="eyebrow">Your Bag</span>
      <h1 className="section-title mt-3 mb-10">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="card-luxe p-4 md:p-5 flex gap-4 md:gap-6">
              <img src={cld(product.images[0], 260)} alt={product.name} loading="lazy" decoding="async" className="w-24 h-28 md:w-28 md:h-32 object-cover rounded-2xl shrink-0" />
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{product.isDeal ? 'Special Offer' : product.brand}</p>
                    {product.isDeal ? (
                      <p className="font-semibold">{product.name}</p>
                    ) : (
                      <Link to={`/product/${product.slug}`} className="font-semibold hover:text-[var(--color-gold)] transition-colors">
                        {product.name}
                      </Link>
                    )}
                    {product.effectivePrice != null && product.effectivePrice < product.price ? (
                      <p className="text-sm font-medium mt-1">
                        <span className="line-through mr-1.5" style={{ color: 'var(--color-muted)' }}>{product.price.toLocaleString()}</span>
                        {product.effectivePrice.toLocaleString()} {product.currency}
                      </p>
                    ) : (
                      <p className="text-sm font-medium mt-1">{product.price.toLocaleString()} {product.currency}</p>
                    )}
                  </div>
                  <button aria-label="Remove item" onClick={() => removeItem(product.id)} className="text-gray-400 hover:text-red-500 transition-colors h-fit">
                    <FiTrash2 size={18} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <QuantityStepper value={quantity} onChange={(q) => updateQuantity(product.id, q)} max={product.maxOrderQuantity ?? 99} />
                  <p className="font-bold">{((product.effectivePrice ?? product.price) * quantity).toLocaleString()} {product.currency}</p>
                </div>
              </div>
            </div>
          ))}
          <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-semibold mt-2 hover:text-[var(--color-gold)] transition-colors">
            Continue Shopping <FiArrowRight />
          </Link>
        </div>

        <div className="card-luxe p-6 h-fit">
          <h2 className="font-bold text-lg mb-5">Order Summary</h2>

          <form onSubmit={onApply} className="flex gap-2 mb-5">
            <div className="relative flex-1">
              <FiTag className="absolute left-3.5 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--color-muted)' }} />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Coupon code"
                className="input-luxe pl-9 py-2.5 text-sm"
              />
            </div>
            <button type="submit" className="btn-secondary px-4 text-xs">Apply</button>
          </form>
          {error && <p className="text-xs text-red-500 -mt-3 mb-4">{error}</p>}
          {coupon && (
            <div className="flex items-center justify-between text-xs mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(201,162,39,0.1)' }}>
              <span>Coupon <strong>{coupon}</strong> applied</span>
              <button onClick={removeCoupon} className="font-semibold">Remove</button>
            </div>
          )}

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-muted)' }}>Subtotal</span>
              <span className="font-semibold">{subtotal.toLocaleString()} EGP</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-muted)' }}>Discount</span>
                <span className="font-semibold" style={{ color: 'var(--color-gold)' }}>-{discount.toLocaleString()} EGP</span>
              </div>
            )}
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-muted)' }}>Shipping</span>
              <span className="font-semibold">Calculated at checkout</span>
            </div>
          </div>

          <div className="h-px my-5" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="flex justify-between font-bold text-lg mb-6">
            <span>Total</span>
            <span>{(subtotal - discount).toLocaleString()} EGP</span>
          </div>

          <Link to="/checkout">
            <Button variant="primary" fullWidth>Proceed to Checkout</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
