import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTrash2, FiShoppingBag, FiTag, FiArrowRight } from 'react-icons/fi';
import { useCart, orderCapFor } from '../context/CartContext';
import { cld } from '../utils/cloudinary';
import QuantityStepper from '../components/ui/QuantityStepper';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import PromoBadge from '../components/product/PromoBadge';
import { AppliedGiftRows, CartGiftChoices, CartGiftLines, CartOfferMessages, DiscountRows } from '../components/cart/CartPromotions';
import { useSeo } from '../hooks/useSeo';
import { useTranslation } from 'react-i18next';

export default function Cart() {
  const { t } = useTranslation();
  useSeo({ title: 'Shopping Cart', path: '/cart', noindex: true });
  const { items, updateQuantity, removeItem, subtotal, coupon, discount, applyCoupon, removeCoupon, quote, promotions, freeShipping, isPricing } = useCart();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);

  const onApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (applying) return;
    setApplying(true);
    const result = await applyCoupon(code);
    setApplying(false);
    if (!result.ok) {
      setError(result.message ?? t('cart.invalidCoupon'));
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
          title={t('cart.bagEmpty')}
          description={t('cart.emptyDescription')}
          actionLabel={t('cart.startShopping')}
          actionTo="/shop"
        />
      </div>
    );
  }

  return (
    <div className="container-luxe py-12">
      <span className="eyebrow">{t('cart.yourBag')}</span>
      <h1 className="section-title mt-3 mb-10">{t('cart.shoppingCart')}</h1>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => {
            // What the server's promotions did to this line: which offers it is part of, and what they took off.
            const priced = quote?.lines.find((l) => l.key === product.id);
            const lineOffers = (priced?.promotions ?? []).flatMap((p) => {
              const applied = promotions.applied.find((a) => a.id === p.id);
              return applied ? [applied] : [];
            });
            const lineTotal = (product.effectivePrice ?? product.price) * quantity;
            const finalTotal = priced && priced.promotionDiscount > 0 ? priced.finalTotal : null;
            return (
            <div key={product.id} className="card-luxe p-4 md:p-5 flex gap-4 md:gap-6">
              <img src={cld(product.images[0], 260)} alt={product.name} loading="lazy" decoding="async" className="w-24 h-28 md:w-28 md:h-32 object-cover rounded-2xl shrink-0" />
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{product.isDeal ? t('cart.specialOffer') : product.brand}</p>
                    {product.isDeal ? (
                      <p className="font-semibold">{product.name}</p>
                    ) : (
                      <Link to={`/product/${product.slug}`} className="font-semibold hover:text-[var(--color-gold)] transition-colors">
                        {product.name}
                      </Link>
                    )}
                    {product.effectivePrice != null && product.effectivePrice < product.price ? (
                      <p className="text-sm font-medium mt-1">
                        <span className="line-through mr-1.5" style={{ color: 'var(--color-muted)' }}>{product.price.toLocaleString('en-US')}</span>
                        {product.effectivePrice.toLocaleString('en-US')} {product.currency}
                      </p>
                    ) : (
                      <p className="text-sm font-medium mt-1">{product.price.toLocaleString('en-US')} {product.currency}</p>
                    )}
                    {lineOffers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {lineOffers.slice(0, 2).map((offer) => (
                          <PromoBadge key={offer.id} kind={offer.kind} label={offer.badge} size="sm" />
                        ))}
                      </div>
                    )}
                  </div>
                  <button aria-label={t('cart.removeItem')} onClick={() => removeItem(product.id)} className="text-gray-400 hover:text-red-500 transition-colors h-fit">
                    <FiTrash2 size={18} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <QuantityStepper value={quantity} onChange={(q) => updateQuantity(product.id, q)} max={orderCapFor(product) ?? 99} />
                  {finalTotal !== null ? (
                    <p className="font-bold text-end whitespace-nowrap">
                      {/* <bdi>: each amount keeps its own direction, so the two never run together in Arabic. */}
                      <bdi className="line-through font-normal text-xs me-2" style={{ color: 'var(--color-muted)' }}>{lineTotal.toLocaleString('en-US')}</bdi>
                      <bdi>{finalTotal === 0 ? t('promotions.free') : `${finalTotal.toLocaleString('en-US')} ${product.currency}`}</bdi>
                    </p>
                  ) : (
                    <p className="font-bold">{lineTotal.toLocaleString('en-US')} {product.currency}</p>
                  )}
                </div>
              </div>
            </div>
            );
          })}
          <CartGiftLines />
          <CartGiftChoices />
          <CartOfferMessages />
          <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-semibold mt-2 hover:text-[var(--color-gold)] transition-colors">
            {t('cart.continueShopping')} <FiArrowRight className="rtl-flip" />
          </Link>
        </div>

        <div className="card-luxe p-6 h-fit">
          <h2 className="font-bold text-lg mb-5">{t('cart.orderSummary')}</h2>

          <form onSubmit={onApply} className="flex gap-2 mb-5">
            <div className="relative flex-1">
              <FiTag className="absolute start-3.5 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--color-muted)' }} />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('cart.couponCode')}
                className="input-luxe ps-9 py-2.5 text-sm"
              />
            </div>
            <button type="submit" disabled={applying} className="btn-secondary px-4 text-xs">{applying ? '…' : t('cart.apply')}</button>
          </form>
          {error && <p className="text-xs text-red-500 -mt-3 mb-4">{error}</p>}
          {coupon && (
            <div className="flex items-center justify-between text-xs mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(201,162,39,0.1)' }}>
              <span>{t('cart.couponApplied', { code: coupon })}</span>
              <button onClick={removeCoupon} className="font-semibold">{t('cart.remove')}</button>
            </div>
          )}

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-muted)' }}>{t('cart.subtotal')}</span>
              <span className="font-semibold">{subtotal.toLocaleString('en-US')} EGP</span>
            </div>
            <DiscountRows />
            <AppliedGiftRows />
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-muted)' }}>{t('cart.shipping')}</span>
              {freeShipping ? (
                <span className="font-semibold" style={{ color: '#15803d' }}>{t('promotions.freeShipping')}</span>
              ) : (
                <span className="font-semibold">{t('cart.calculatedCheckout')}</span>
              )}
            </div>
          </div>

          <div className="h-px my-5" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="flex justify-between font-bold text-lg mb-6" aria-live="polite" aria-busy={isPricing}>
            <span>{t('cart.total')}</span>
            <span style={{ opacity: isPricing ? 0.5 : 1 }}>{Math.max(subtotal - discount, 0).toLocaleString('en-US')} EGP</span>
          </div>

          <Link to="/checkout">
            <Button variant="primary" fullWidth>{t('cart.proceedCheckout')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
