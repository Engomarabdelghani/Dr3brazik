import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FaWhatsapp } from 'react-icons/fa';
import { FiCreditCard, FiTruck } from 'react-icons/fi';
import emailjs from '@emailjs/browser';
import { useCart } from '../context/CartContext';
import {
  WHATSAPP_NUMBER,
  buildWhatsAppOrderMessage,
} from '../data/constants';
import { fetchShippingZones } from '../lib/api/shippingZones';
import { cld } from '../utils/cloudinary';
import Button from '../components/ui/Button';

type PaymentMethod = 'cod' | 'card';

export default function Checkout() {
  const { items, subtotal, discount, bogoLabel, clearCart } = useCart();
  const navigate = useNavigate();

  const { data: shippingZones = [] } = useQuery({
    queryKey: ['shipping-zones'],
    queryFn: fetchShippingZones,
  });

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    governorateId: '',
    notes: '',
  });

  const [payment, setPayment] = useState<PaymentMethod>('cod');
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return null;
  }

  const enabledZones = shippingZones.filter((z) => z.isEnabled);

  const selectedZone = enabledZones.find(
    (z) => z.id === form.governorateId
  );

  const total = subtotal - discount;
  const shipping = selectedZone?.price ?? 0;
  const grandTotal = total + shipping;

  const onChange =
    (field: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      setForm((current) => ({
        ...current,
        [field]: e.target.value,
      }));
    };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedZone) {
      setError('Please choose your governorate to calculate delivery.');
      return;
    }

    if (!form.name || !form.phone || !form.address) {
      setError('Please complete all required customer information.');
      return;
    }

    setError(null);

    // 1. تجهيز ملخص المنتجات في نص واحد للإيميل
    const itemsSummaryText = items
      .map(({ product, quantity }) => `• ${product.name} x${quantity} — ${product.price * quantity} EGP`)
      .join('\n');

    // 2. إرسال تفاصيل الأوردر على الإيميل فوراً عبر EmailJS
    const templateParams = {
      customer_name: form.name,
      customer_phone: form.phone,
      customer_address: form.address,
      governorate: selectedZone.name,
      payment_method: payment === 'cod' ? 'Cash on Delivery' : 'Instapay / Vodafone Cash',
      order_items: itemsSummaryText,
      subtotal: `${subtotal} EGP`,
      discount: discount > 0 ? `-${discount} EGP` : '0 EGP',
      shipping_price: `${shipping} EGP`,
      total_price: `${grandTotal} EGP`,
      notes: form.notes || 'No notes',
    };

    emailjs.send(
      'service_m45cstt',
      'template_d58fazt', // استبدلها بـ Template ID
      templateParams,
      'JoP02i58JPAUycgB9'   // استبدلها بـ Public Key
    ).catch((err) => {
      console.error('Failed to send email notification:', err);
    });

    // 3. تجهيز رسالة الواتساب وفتحها
    const message = buildWhatsAppOrderMessage({
      items: items.map(({ product, quantity }) => ({
        name: product.name,
        quantity,
        price: product.price,
      })),
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

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`,
      '_blank'
    );

    clearCart();
    navigate('/');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p
          className="text-xs tracking-[0.2em] uppercase mb-2"
          style={{ color: 'var(--color-gold)' }}
        >
          Almost There
        </p>

        <h1 className="text-3xl md:text-4xl font-bold">
          Checkout
        </h1>
      </div>

      <form
        onSubmit={onSubmit}
        className="grid lg:grid-cols-3 gap-10"
      >
        <div className="lg:col-span-2 space-y-8">
          <div className="card-luxe p-6 md:p-8">
            <h2 className="font-bold mb-5">
              Customer Information
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                required
                value={form.name}
                onChange={onChange('name')}
                placeholder="Full Name"
                className="input-luxe"
              />

              <input
                required
                type="tel"
                value={form.phone}
                onChange={onChange('phone')}
                placeholder="Phone Number"
                className="input-luxe"
              />

              <select
                required
                value={form.governorateId}
                onChange={onChange('governorateId')}
                className="input-luxe"
              >
                <option value="">
                  Select Governorate
                </option>

                {enabledZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} — {zone.price.toLocaleString()} EGP
                  </option>
                ))}
              </select>

              <input
                required
                value={form.address}
                onChange={onChange('address')}
                placeholder="Detailed Address (street, building, floor…)"
                className="input-luxe"
              />
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
            <h2 className="font-bold mb-5 flex items-center gap-2">
              <FiTruck />
              Delivery
            </h2>

            <p
              className="text-sm"
              style={{ color: 'var(--color-muted)' }}
            >
              {selectedZone
                ? `Delivery to ${selectedZone.name}: ${selectedZone.price.toLocaleString()} EGP`
                : 'Choose your governorate above to see the delivery price.'}
            </p>
          </div>

          <div className="card-luxe p-6 md:p-8">
            <h2 className="font-bold mb-5 flex items-center gap-2">
              <FiCreditCard />
              Payment Method
            </h2>

            <div className="space-y-3">
              <label
                className="flex items-center gap-3 p-4 rounded-2xl border cursor-pointer"
                style={{
                  borderColor:
                    payment === 'cod'
                      ? 'var(--color-gold)'
                      : 'var(--color-border)',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={payment === 'cod'}
                  onChange={() => setPayment('cod')}
                  className="accent-[var(--color-gold)]"
                />

                <div>
                  <p className="font-semibold text-sm">
                    Cash on Delivery
                  </p>

                  <p
                    className="text-xs"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    Pay when your order arrives
                  </p>
                </div>
              </label>

              <label
                className="flex items-center gap-3 p-4 rounded-2xl border cursor-pointer"
                style={{
                  borderColor:
                    payment === 'card'
                      ? 'var(--color-gold)'
                      : 'var(--color-border)',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={payment === 'card'}
                  onChange={() => setPayment('card')}
                  className="accent-[var(--color-gold)]"
                />

                <div>
                  <p className="font-semibold text-sm">
                    Instapay / Vodafone Cash
                  </p>

                  <p
                    className="text-xs"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    Secure payment via Visa or Mastercard
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="card-luxe p-6 h-fit space-y-4">
          <h2 className="font-bold text-lg mb-2">
            Order Summary
          </h2>

          {items.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="flex items-center gap-3 text-sm"
            >
              <img
                src={cld(product.images[0], 120)}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className="w-12 h-14 object-cover rounded-lg"
              />

              <div className="flex-1">
                <p className="font-medium line-clamp-1">
                  {product.name}
                </p>

                <p style={{ color: 'var(--color-muted)' }}>
                  Qty {quantity}
                </p>
              </div>

              <p className="font-semibold">
                {(product.price * quantity).toLocaleString()}
              </p>
            </div>
          ))}

          <div
            className="h-px"
            style={{ backgroundColor: 'var(--color-border)' }}
          />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-muted)' }}>
                Subtotal
              </span>

              <span>
                {subtotal.toLocaleString()} EGP
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-muted)' }}>
                  {bogoLabel
                    ? `Discount (${bogoLabel})`
                    : 'Discount'}
                </span>

                <span>
                  -{discount.toLocaleString()} EGP
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span style={{ color: 'var(--color-muted)' }}>
                Shipping
              </span>

              <span>
                {selectedZone
                  ? `${shipping.toLocaleString()} EGP`
                  : 'Select governorate'}
              </span>
            </div>
          </div>

          <div
            className="h-px"
            style={{ backgroundColor: 'var(--color-border)' }}
          />

          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>

            <span>
              {grandTotal.toLocaleString()} EGP
            </span>
          </div>

          {error && (
            <p
              className="text-xs"
              style={{ color: '#dc2626' }}
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
          >
            Place Order
          </Button>

          <p
            className="text-xs text-center"
            style={{ color: 'var(--color-muted)' }}
          >
            You'll confirm your order details via WhatsApp
          </p>

          <div
            className="flex items-center justify-center gap-2 text-xs font-semibold"
            style={{ color: '#25D366' }}
          >
            <FaWhatsapp />
            Order confirmation sent via WhatsApp
          </div>
        </div>
      </form>
    </div>
  );
}