import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';
import { FiCreditCard, FiTruck } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { WHATSAPP_NUMBER, buildWhatsAppOrderMessage } from '../data/constants';
import { cld } from '../utils/cloudinary';
import Button from '../components/ui/Button';

type PaymentMethod = 'cod' | 'card';

export default function Checkout() {
  const { items, subtotal, discount, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', notes: '' });
  const [payment, setPayment] = useState<PaymentMethod>('cod');

  if (items.length === 0) return <Navigate to="/cart" replace />;

  const total = subtotal - discount;
  const shipping = total >= 2000 ? 0 : 75;
  const grandTotal = total + shipping;

  const onChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = buildWhatsAppOrderMessage({
      items: items.map((i) => ({ name: i.product.name, quantity: i.quantity, price: i.product.price })),
      total: grandTotal,
      customerName: form.name,
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
              <input required value={form.phone} onChange={onChange('phone')} placeholder="Phone Number" className="input-luxe" />
              <input required value={form.city} onChange={onChange('city')} placeholder="City" className="input-luxe" />
              <input required value={form.address} onChange={onChange('address')} placeholder="Delivery Address" className="input-luxe" />
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
              {/* Standard delivery in 2–5 business days. Free shipping on orders over 2,000 EGP. */}
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
              <p className="font-semibold">{(product.price * quantity).toLocaleString()}</p>
            </div>
          ))}
          <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Subtotal</span><span>{subtotal.toLocaleString()} EGP</span></div>
            {discount > 0 && <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Discount</span><span>-{discount.toLocaleString()} EGP</span></div>}
            <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Shipping</span><span>{shipping === 0 ? 'Free' : `${shipping} EGP`}</span></div>
          </div>
          <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{grandTotal.toLocaleString()} EGP</span></div>

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
