import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FaWhatsapp } from 'react-icons/fa';
import { FiCreditCard, FiTruck } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { WHATSAPP_NUMBER, buildWhatsAppOrderMessage } from '../data/constants';
import { fetchShippingZones } from '../lib/api/shippingZones';
import { cld } from '../utils/cloudinary';
import Button from '../components/ui/Button';
import { useSeo } from '../hooks/useSeo';

type PaymentMethod = 'cod' | 'card';

export default function Checkout() {
  useSeo({ title: 'Checkout', path: '/checkout', noindex: true });
  const { items, subtotal, discount, coupon, bogoLabel, clearCart, applyCoupon, removeCoupon, appliedCoupon, couponResult } = useCart();
  const [code, setCode] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { data: shippingZones = [] } = useQuery({ queryKey: ['shipping-zones'], queryFn: fetchShippingZones });
  const [form, setForm] = useState({ name: '', phone: '', address: '', governorateId: '', notes: '' });
  const [payment, setPayment] = useState<PaymentMethod>('cod');
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) return <Navigate to="/cart" replace />;

  const enabledZones = shippingZones.filter((z) => z.isEnabled);
  const selectedZone = enabledZones.find((z) => z.id === form.governorateId);

  const total = subtotal - discount;
  const shipping = selectedZone?.price ?? 0;
  const grandTotal = total + shipping;

  const onChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) {
      setError('Please choose your governorate to calculate delivery.');
      return;
    }
    setError(null);

    const message = buildWhatsAppOrderMessage({
      items: items.map((i) => ({ name: i.product.name, quantity: i.quantity, price: i.product.effectivePrice ?? i.product.price })),
      subtotal,
      discount,
      shippingPrice: shipping,
      total: grandTotal,
      customerName: form.name,
      customerPhone: form.phone,
      address: form.address,
      governorate: selectedZone.name,
      notes: form.notes || undefined,
    });
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    clearCart();
    navigate('/');
  };

  return (
    <div className="container-luxe py-12">
      <span className="eyebrow">Almost There</span>
      <h1 className="section-title mt-3 mb-10">Checkout</h1>

      <form onSubmit={onSubmit} className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="card-luxe p-6 md:p-8">
            <h2 className="font-bold mb-5">Customer Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input required value={form.name} onChange={onChange('name')} placeholder="Full Name" className="input-luxe" />
              <input required type="tel" value={form.phone} onChange={onChange('phone')} placeholder="Phone Number" className="input-luxe" />
              <select required value={form.governorateId} onChange={onChange('governorateId')} className="input-luxe">
                <option value="">Select Governorate</option>
                {enabledZones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name} — {z.price.toLocaleString()} EGP</option>
                ))}
              </select>
              <input required value={form.address} onChange={onChange('address')} placeholder="Detailed Address (street, building, floor…)" className="input-luxe" />
            </div>
            <textarea
              value={form.notes}
              onChange={onChange('notes')}
              placeholder="Order notes (optional)"
              rows={3}
              className="input-luxe mt-4"
            />
          </div>

          <div className="card-luxe p-6 md:p-8">
            <h2 className="font-bold mb-5 flex items-center gap-2"><FiTruck /> Delivery</h2>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              {selectedZone
                ? `Delivery to ${selectedZone.name}: ${selectedZone.price.toLocaleString()} EGP`
                : 'Choose your governorate above to see the delivery price.'}
            </p>
          </div>

          <div className="card-luxe p-6 md:p-8">
            <h2 className="font-bold mb-5 flex items-center gap-2"><FiCreditCard /> Payment Method</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 rounded-2xl border cursor-pointer" style={{ borderColor: payment === 'cod' ? 'var(--color-gold)' : 'var(--color-border)' }}>
                <input type="radio" name="payment" checked={payment === 'cod'} onChange={() => setPayment('cod')} className="accent-[var(--color-gold)]" />
                <div>
                  <p className="font-semibold text-sm">Cash on Delivery</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Pay when your order arrives</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 rounded-2xl border cursor-pointer" style={{ borderColor: payment === 'card' ? 'var(--color-gold)' : 'var(--color-border)' }}>
                <input type="radio" name="payment" checked={payment === 'card'} onChange={() => setPayment('card')} className="accent-[var(--color-gold)]" />
                <div>
                  <p className="font-semibold text-sm">instapay / vodafone cash</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Secure payment via Visa or Mastercard</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="card-luxe p-6 h-fit space-y-4">
          <h2 className="font-bold text-lg mb-2">Order Summary</h2>
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex items-center gap-3 text-sm">
              <img src={cld(product.images[0], 120)} alt={product.name} loading="lazy" decoding="async" className="w-12 h-14 object-cover rounded-lg" />
              <div className="flex-1">
                <p className="font-medium line-clamp-1">{product.name}</p>
                <p style={{ color: 'var(--color-muted)' }}>Qty {quantity}</p>
              </div>
              <p className="font-semibold">
                {(() => {
                  const unit = product.effectivePrice ?? product.price;
                  if (!coupon || !couponResult?.ok || !appliedCoupon) return (unit * quantity).toLocaleString();
                  const isEligible = appliedCoupon.targetType === 'all' || (appliedCoupon.productIds ?? []).includes(product.id);
                  if (!isEligible) return (unit * quantity).toLocaleString();
                  if (appliedCoupon.discountType === 'percent') {
                    const discountedUnit = Math.round(unit * (1 - appliedCoupon.discountValue / 100));
                    return (discountedUnit * quantity).toLocaleString();
                  }
                  const eligibleSubtotal = items.reduce((sum, i) => {
                    const p = i.product.effectivePrice ?? i.product.price;
                    return sum + (appliedCoupon.targetType === 'all' || (appliedCoupon.productIds ?? []).includes(i.product.id) ? p * i.quantity : 0);
                  }, 0);
                  if (eligibleSubtotal <= 0) return (unit * quantity).toLocaleString();
                  const totalDiscount = couponResult.discount ?? 0;
                  const lineTotal = unit * quantity;
                  const lineDiscount = Math.round((lineTotal / eligibleSubtotal) * totalDiscount);
                  const finalLine = Math.max(0, Math.round(lineTotal - lineDiscount));
                  return finalLine.toLocaleString();
                })()}
              </p>
            </div>
          ))}
          <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />

          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value); setApplyError(null); }}
                placeholder="Coupon code"
                className="input-luxe py-2.5 text-sm"
                disabled={!!coupon}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const res = applyCoupon(code);
                if (!res.ok) setApplyError(res.message ?? 'Invalid coupon code');
                else { setApplyError(null); setCode(''); }
              }}
              disabled={!!coupon}
              className="btn-secondary px-4 text-xs"
            >Apply</button>
          </div>
          {applyError && <p className="text-xs text-red-500 -mt-2 mb-2">{applyError}</p>}
          {coupon && (
            <div className="flex items-center justify-between text-xs mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(201,162,39,0.1)' }}>
              <span>Coupon <strong>{coupon}</strong> applied</span>
              <button onClick={() => removeCoupon()} className="font-semibold">Remove</button>
            </div>
          )}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Subtotal</span><span>{subtotal.toLocaleString()} EGP</span></div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-muted)' }}>
                  {[bogoLabel, coupon ? `Coupon ${coupon}` : null].filter(Boolean).join(' + ') || 'Discount'}
                </span>
                <span>-{discount.toLocaleString()} EGP</span>
              </div>
            )}
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-muted)' }}>Shipping</span>
              <span>{selectedZone ? `${shipping.toLocaleString()} EGP` : 'Select governorate'}</span>
            </div>
          </div>
          <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{grandTotal.toLocaleString()} EGP</span></div>

          {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}

          <Button type="submit" variant="primary" fullWidth>Place Order</Button>
          <p className="text-xs text-center" style={{ color: 'var(--color-muted)' }}>
            You'll confirm your order details via WhatsApp
          </p>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold" style={{ color: '#25D366' }}>
            <FaWhatsapp /> Order confirmation sent via WhatsApp
          </div>
        </div>
      </form>
    </div>
  );
}
