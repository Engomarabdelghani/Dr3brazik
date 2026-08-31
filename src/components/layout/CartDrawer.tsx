import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiX, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { cld } from '../../utils/cloudinary';
import QuantityStepper from '../ui/QuantityStepper';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal, discount, appliedCoupon, couponResult } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60]" onClick={closeCart}
          />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[60] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-lg font-bold flex items-center gap-2"><FiShoppingBag /> Your Bag ({items.length})</h2>
              <button aria-label="Close cart" onClick={closeCart}><FiX size={22} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <EmptyState
                  icon={FiShoppingBag}
                  title="Your bag is empty"
                  description="Discover our curated collection of luxury cosmetics."
                  actionLabel="Start Shopping"
                  actionTo="/shop"
                />
              ) : (
                <div className="space-y-5">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex gap-4">
                      <img src={cld(product.images[0], 200)} alt={product.name} loading="lazy" decoding="async" className="w-20 h-24 object-cover rounded-xl" />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{product.isDeal ? 'Special Offer' : product.brand}</p>
                          <p className="font-semibold text-sm">{product.name}</p>
                          <p className="text-sm font-medium mt-1">
                            {(() => {
                              const unit = product.effectivePrice ?? product.price;
                              if (!couponResult?.ok || !appliedCoupon) return `${unit.toLocaleString()} ${product.currency}`;
                              const isEligible = appliedCoupon.targetType === 'all' || (appliedCoupon.productIds ?? []).includes(product.id);
                              if (!isEligible) return `${unit.toLocaleString()} ${product.currency}`;

                              if (appliedCoupon.discountType === 'percent') {
                                const discountedUnit = Math.round(unit * (1 - appliedCoupon.discountValue / 100));
                                return (
                                  <>
                                    <span className="line-through mr-2" style={{ color: 'var(--color-muted)' }}>{unit.toLocaleString()}</span>
                                    <strong>{discountedUnit.toLocaleString()} {product.currency}</strong>
                                  </>
                                );
                              }

                              // fixed discount: prorate across eligible items to compute approximate unit price
                              const eligibleSubtotal = items.reduce((sum, i) => {
                                const p = i.product.effectivePrice ?? i.product.price;
                                return sum + (appliedCoupon.targetType === 'all' || (appliedCoupon.productIds ?? []).includes(i.product.id) ? p * i.quantity : 0);
                              }, 0);
                              if (eligibleSubtotal <= 0) return `${unit.toLocaleString()} ${product.currency}`;
                              const totalDiscount = couponResult.discount ?? 0;
                              const lineTotal = unit * quantity;
                              const lineDiscount = Math.round((lineTotal / eligibleSubtotal) * totalDiscount);
                              const finalLine = Math.max(0, Math.round(lineTotal - lineDiscount));
                              const perUnit = Math.max(0, Math.round(finalLine / quantity));
                              return (
                                <>
                                  <span className="line-through mr-2" style={{ color: 'var(--color-muted)' }}>{unit.toLocaleString()}</span>
                                  <strong>{perUnit.toLocaleString()} {product.currency}</strong>
                                </>
                              );
                            })()}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <QuantityStepper value={quantity} onChange={(q) => updateQuantity(product.id, q)} max={product.maxOrderQuantity ?? 99} />
                          <button aria-label="Remove item" onClick={() => removeItem(product.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="px-6 py-5 border-t space-y-3" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-muted)' }}>Subtotal</span>
                  <span className="font-semibold">{subtotal.toLocaleString()} EGP</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-muted)' }}>Discount</span>
                    <span className="font-semibold" style={{ color: 'var(--color-gold)' }}>-{discount.toLocaleString()} EGP</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-1">
                  <span>Total</span>
                  <span>{(subtotal - discount).toLocaleString()} EGP</span>
                </div>
                <Link to="/checkout" onClick={closeCart}>
                  <Button variant="primary" fullWidth className="mt-2">Proceed to Checkout</Button>
                </Link>
                <Link to="/cart" onClick={closeCart} className="block text-center text-sm font-medium mt-1 hover:text-[var(--color-gold)] transition-colors">
                  View Bag Details
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
