import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FiCreditCard, FiTruck, FiTag, FiCheckCircle } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
// WhatsApp hand-off is switched off for now (owner's request, 5 Oct 2026); see onSubmit.
// import { WHATSAPP_NUMBER, buildWhatsAppOrderMessage } from '../data/constants';
import { fetchShippingZones } from '../lib/api/shippingZones';
import { placeOrder, toCartRefs } from '../lib/api/orders';
import { isApiError } from '../api/client';
import { saveLastOrder, type ConfirmedOrder } from '../utils/lastOrder';
import { clearCheckoutDraft, readCheckoutDraft, saveCheckoutDraft } from '../utils/checkoutDraft';
import { cld } from '../utils/cloudinary';
import Button from '../components/ui/Button';
import { AppliedGiftRows, CartGiftChoices, CartGiftLines, CartOfferMessages, DiscountRows } from '../components/cart/CartPromotions';
import InstapayPanel, { isPayerNumber, type InstapayErrors, type PaymentProof } from '../components/checkout/InstapayPanel';
import { useSeo } from '../hooks/useSeo';
import { useTranslation } from 'react-i18next';

/** card: Vodafone Cash (the name the wallet option has always had here). */
type PaymentMethod = 'cod' | 'card' | 'instapay';

export default function Checkout() {
  const { t } = useTranslation();
  useSeo({ title: 'Checkout', path: '/checkout', noindex: true });
  const { items, subtotal, discount, coupon, applyCoupon, removeCoupon, clearCart, quote, giftSelections, isPricing, setCustomerPhone, promotions } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // One key per checkout visit: a double click or a retry after a network error can't create two orders.
  const idempotencyKey = useRef(crypto.randomUUID());
  const { data: shippingZones = [] } = useQuery({ queryKey: ['shipping-zones'], queryFn: fetchShippingZones });
  // What was typed before leaving for the InstaPay app, if the phone reloaded the page on the way back.
  const [draft] = useState(readCheckoutDraft);
  const [form, setForm] = useState(draft?.form ?? { name: '', phone: '', address: '', governorateId: '', cityId: '', notes: '' });
  const [payment, setPayment] = useState<PaymentMethod>(draft?.payment ?? 'cod');
  const [payerNumber, setPayerNumber] = useState(draft?.payerNumber ?? '');
  const [proof, setProof] = useState<PaymentProof | null>(draft?.proof ?? null);
  const [proofUploading, setProofUploading] = useState(false);
  const [instapayErrors, setInstapayErrors] = useState<InstapayErrors>({});
  const instapayOption = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [placing, setPlacing] = useState(false);
  // Set once the order is saved. Clearing the cart re-renders this page before the
  // router has switched to /order-confirmed (navigation runs as a transition), and the
  // empty-cart redirect below would otherwise win and send the customer to /cart.
  const orderPlaced = useRef(false);

  // Offers limited per customer are checked by phone number: once it is typed, the
  // summary is priced for this customer, so the total shown is the total charged.
  useEffect(() => {
    const digits = form.phone.replace(/\D/g, '');
    const timer = setTimeout(() => setCustomerPhone(digits.length >= 10 ? form.phone.trim() : ''), 500);
    return () => clearTimeout(timer);
  }, [form.phone, setCustomerPhone]);
  useEffect(() => () => setCustomerPhone(''), [setCustomerPhone]);

  useEffect(() => {
    if (orderPlaced.current) return;
    saveCheckoutDraft({ form, payment, payerNumber, proof: proof && { key: proof.key, name: proof.name } });
  }, [form, payment, payerNumber, proof]);

  if (items.length === 0 && !orderPlaced.current) return <Navigate to="/cart" replace />;

  const enabledZones = shippingZones.filter((z) => z.isEnabled);
  const selectedZone = enabledZones.find((z) => z.id === form.governorateId);
  const enabledCities = (selectedZone?.cities ?? []).filter((c) => c.isEnabled);
  const selectedCity = enabledCities.find((c) => c.id === form.cityId);

  const total = Math.max(subtotal - discount, 0);
  const cityRequired = enabledCities.length > 0;
  const shipping = cityRequired ? (selectedCity?.price ?? 0) : (selectedZone?.price ?? 0);
  const hasValidShippingSelection = !selectedZone ? false : cityRequired ? !!selectedCity : true;
  // Same formula as the server (floored at 0 after shipping), so the total on screen is the total charged.
  const grandTotal = hasValidShippingSelection ? Math.max(subtotal - discount + shipping, 0) : total;

  const onChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({
      ...f,
      [field]: e.target.value,
      // Changing governorate invalidates whatever city was picked under the old one.
      ...(field === 'governorateId' ? { cityId: '' } : {}),
    }));

  const onApplyCoupon = async () => {
    const result = await applyCoupon(couponCode);
    if (!result.ok) {
      setCouponError(result.message ?? t('checkout.invalidCoupon'));
    } else {
      setCouponError('');
      setCouponCode('');
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (placing) return;
    if (!selectedZone) {
      setError(t('checkout.chooseGovernorateError'));
      return;
    }
    if (enabledCities.length > 0 && !selectedCity) {
      setError(t('checkout.chooseCityError'));
      return;
    }
    if (payment === 'instapay') {
      const missing: InstapayErrors = {
        payerNumber: isPayerNumber(payerNumber) ? undefined : t('checkout.instapayNumberError'),
        proof: proof ? undefined : t('checkout.instapayProofError'),
      };
      setInstapayErrors(missing);
      if (missing.payerNumber || missing.proof) {
        setError(t('checkout.instapayIncomplete'));
        instapayOption.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    setError(null);
    setPlacing(true);

    // WhatsApp hand-off: switched off for now. To bring it back, uncomment this block,
    // the message block below, `waWindow.close()` in the catch, and the constants import.
    // The tab must be opened here, synchronously inside the click, or popup blockers stop it.
    //
    // const waWindow = window.open('', '_blank');
    // if (!waWindow) {
    //   setError('تعذر فتح واتساب تلقائيًا. اضغط "إرسال الطلب" مرة أخرى، أو اسمح للموقع بفتح النوافذ المنبثقة من إعدادات المتصفح.');
    //   setPlacing(false);
    //   return;
    // }

    try {
      // The server re-prices everything, applies the coupon, updates stock and saves the order.
      const order = await placeOrder(
        {
          customer: { name: form.name, phone: form.phone, address: form.address, notes: form.notes || undefined },
          zoneId: selectedZone.id,
          cityId: selectedCity?.id ?? null,
          paymentMethod: payment,
          ...(payment === 'instapay' && proof ? { payerNumber: payerNumber.trim(), paymentProof: proof.key } : {}),
          couponCode: coupon,
          items: toCartRefs(items),
          giftSelections,
          // The server prices the order itself. If its total is not the one on screen
          // (an offer ended, a price changed), it refuses rather than charge a different amount.
          ...(quote && hasValidShippingSelection ? { expectedTotal: grandTotal } : {}),
        },
        idempotencyKey.current
      );

      // WhatsApp hand-off (switched off for now, see above):
      // const message = buildWhatsAppOrderMessage({
      //   orderCode: order.orderCode,
      //   items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      //   subtotal: order.subtotal,
      //   discount: order.discount,
      //   shippingPrice: order.shippingPrice,
      //   total: order.total,
      //   customerName: form.name,
      //   customerPhone: form.phone,
      //   address: form.address,
      //   governorate: selectedCity ? `${selectedZone.name} — ${selectedCity.name}` : selectedZone.name,
      //   notes: form.notes || undefined,
      // });
      // const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
      // waWindow.location.href = whatsappUrl;

      // The server returns the lines in cart order, so the cart supplies the thumbnails.
      const confirmed: ConfirmedOrder = {
        orderNumber: order.orderNumber,
        orderCode: order.orderCode,
        createdAt: order.createdAt,
        customerName: form.name,
        phone: form.phone,
        address: form.address,
        delivery: `Delivery to ${selectedCity ? `${selectedZone.name} — ${selectedCity.name}` : selectedZone.name}`,
        paymentMethod: payment,
        // Free gifts come after the cart's own lines; their pictures are in the quote.
        items: order.items.map((line, i) => ({
          ...line,
          image: line.isGift ? (quote?.promotions.gifts.find((g) => g.name === line.name)?.image ?? undefined) : items[i]?.product.images[0],
        })),
        promotions: order.promotions,
        subtotal: order.subtotal,
        discount: order.discount,
        shippingPrice: order.shippingPrice,
        total: order.total,
        // whatsappUrl,
      };
      saveLastOrder(confirmed);
      orderPlaced.current = true;
      clearCheckoutDraft();
      navigate('/order-confirmed', { replace: true, state: confirmed });
      clearCart();
    } catch (err) {
      // waWindow.close();
      // Prices, stock limits or the coupon changed: refresh the summary so the customer sees why.
      queryClient.invalidateQueries({ queryKey: ['cart-quote'] });
      if (isApiError(err) && err.code.startsWith('COUPON_')) removeCoupon();
      // The uploaded screenshot is gone from the server (rare): ask for it again, in the customer's language.
      if (isApiError(err, 'PAYMENT_PROOF_MISSING')) {
        setProof(null);
        setInstapayErrors({ proof: t('checkout.instapayProofLost') });
        setError(t('checkout.instapayProofLost'));
        setPlacing(false);
        return;
      }
      const details = isApiError(err) && err.errors.length ? ` ${err.errors.map((e) => e.message).join(' · ')}` : '';
      setError(`${err instanceof Error ? err.message : 'Could not place your order. Please try again.'}${details}`);
      setPlacing(false);
    }
  };

  return (
    <div className="container-luxe py-12">
      <span className="eyebrow">{t('checkout.almostThere')}</span>
      <h1 className="section-title mt-3 mb-10">{t('checkout.title')}</h1>

      <form onSubmit={onSubmit} className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="card-luxe p-6 md:p-8">
            <h2 className="font-bold mb-5">{t('checkout.customerInformation')}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input required value={form.name} onChange={onChange('name')} placeholder={t('checkout.fullName')} className="input-luxe" />
              <input required type="tel" value={form.phone} onChange={onChange('phone')} placeholder={t('checkout.phoneNumber')} className="input-luxe" />
              <select required value={form.governorateId} onChange={onChange('governorateId')} className="input-luxe">
                <option value="">{t('checkout.selectGovernorate')}</option>
                {enabledZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}{(z.cities ?? []).filter((c) => c.isEnabled).length === 0 ? ` — ${z.price.toLocaleString('en-US')} EGP` : ''}
                  </option>
                ))}
              </select>
              {enabledCities.length > 0 && (
                <select required value={form.cityId} onChange={onChange('cityId')} className="input-luxe">
                  <option value="">{t('checkout.selectCity')}</option>
                  {enabledCities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.price.toLocaleString('en-US')} EGP</option>
                  ))}
                </select>
              )}
              <input required value={form.address} onChange={onChange('address')} placeholder={t('checkout.detailedAddress')} className="input-luxe" />
            </div>
            <textarea
              value={form.notes}
              onChange={onChange('notes')}
              placeholder={t('checkout.orderNotes')}
              rows={3}
              className="input-luxe mt-4"
            />
          </div>

          <div className="card-luxe p-6 md:p-8">
            <h2 className="font-bold mb-5 flex items-center gap-2"><FiTruck /> {t('checkout.delivery')}</h2>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              {!selectedZone
                ? t('checkout.chooseGovernorate')
                : enabledCities.length > 0 && !selectedCity
                  ? t('checkout.chooseCity')
                  : t('checkout.deliveryTo', { location: selectedCity ? `${selectedZone.name} — ${selectedCity.name}` : selectedZone.name, price: shipping.toLocaleString('en-US') })}
            </p>
          </div>

          <div className="card-luxe p-6 md:p-8">
            <h2 className="font-bold mb-5 flex items-center gap-2"><FiCreditCard /> {t('checkout.paymentMethod')}</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 rounded-2xl border cursor-pointer" style={{ borderColor: payment === 'cod' ? 'var(--color-gold)' : 'var(--color-border)' }}>
                <input type="radio" name="payment" checked={payment === 'cod'} onChange={() => setPayment('cod')} className="accent-[var(--color-gold)]" />
                <div>
                  <p className="font-semibold text-sm">{t('checkout.cashOnDelivery')}</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{t('checkout.payWhenArrives')}</p>
                </div>
              </label>
              {/* The label is only the header row: the steps below it hold their own inputs. */}
              <div ref={instapayOption} className="rounded-2xl border transition-colors" style={{ borderColor: payment === 'instapay' ? 'var(--color-gold)' : 'var(--color-border)' }}>
                <label className="flex items-center gap-3 p-4 cursor-pointer">
                  <input type="radio" name="payment" checked={payment === 'instapay'} onChange={() => setPayment('instapay')} className="accent-[var(--color-gold)]" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{t('checkout.instapay')}</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{t('checkout.instapayDetails')}</p>
                  </div>
                  <img src="/images/instapay.png" alt="" width={40} height={40} className="w-10 h-10 rounded-lg shrink-0" />
                </label>
                <AnimatePresence initial={false}>
                  {payment === 'instapay' && (
                    <motion.div
                      key="instapay"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <InstapayPanel
                        amount={grandTotal}
                        amountReady={hasValidShippingSelection}
                        pricing={isPricing}
                        customerPhone={form.phone}
                        payerNumber={payerNumber}
                        onPayerNumberChange={(value) => {
                          setPayerNumber(value);
                          setInstapayErrors((e) => ({ ...e, payerNumber: undefined }));
                        }}
                        proof={proof}
                        onProofChange={(next) => {
                          setProof(next);
                          if (next) setInstapayErrors((e) => ({ ...e, proof: undefined }));
                        }}
                        onUploadingChange={setProofUploading}
                        errors={instapayErrors}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <label className="flex items-center gap-3 p-4 rounded-2xl border cursor-pointer" style={{ borderColor: payment === 'card' ? 'var(--color-gold)' : 'var(--color-border)' }}>
                <input type="radio" name="payment" checked={payment === 'card'} onChange={() => setPayment('card')} className="accent-[var(--color-gold)]" />
                <div>
                  <p className="font-semibold text-sm">{t('checkout.walletPayment')}</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{t('checkout.cardPaymentDetails')}</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="card-luxe p-6 h-fit space-y-4">
          <h2 className="font-bold text-lg mb-2">{t('checkout.orderSummary')}</h2>
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex items-center gap-3 text-sm">
              <img src={cld(product.images[0], 120)} alt={product.name} loading="lazy" decoding="async" className="w-12 h-14 object-cover rounded-lg" />
              <div className="flex-1">
                <p className="font-medium line-clamp-1">{product.name}</p>
                <p style={{ color: 'var(--color-muted)' }}>{t('checkout.quantity', { count: quantity })}</p>
              </div>
              <p className="font-semibold">{((product.effectivePrice ?? product.price) * quantity).toLocaleString('en-US')}</p>
            </div>
          ))}
          <CartGiftLines variant="compact" />
          <CartGiftChoices />
          <CartOfferMessages dense />
          <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />

          {coupon ? (
            <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(201,162,39,0.1)' }}>
              <span>{t('cart.couponApplied', { code: coupon })}</span>
              <button type="button" onClick={removeCoupon} className="font-semibold">{t('checkout.remove')}</button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FiTag className="absolute start-3.5 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--color-muted)' }} />
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder={t('checkout.couponCode')}
                    className="input-luxe ps-9 py-2.5 text-sm"
                  />
                </div>
                <button type="button" onClick={onApplyCoupon} className="btn-secondary px-4 text-xs">{t('checkout.apply')}</button>
              </div>
              {couponError && <p className="text-xs mt-2" style={{ color: '#dc2626' }}>{couponError}</p>}
            </div>
          )}

          <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>{t('checkout.subtotal')}</span><span>{subtotal.toLocaleString('en-US')} EGP</span></div>
            <DiscountRows />
            <AppliedGiftRows />
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-muted)' }}>{t('checkout.shipping')}</span>
              <span>
                {!selectedZone
                  ? t('checkout.selectGovernorateShort')
                  : cityRequired && !selectedCity
                    ? t('checkout.selectCityShort')
                    : `${shipping.toLocaleString('en-US')} EGP`}
              </span>
            </div>
          </div>
          <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />
          <div className="flex justify-between font-bold text-lg" aria-live="polite" aria-busy={isPricing}>
            <span>{t('checkout.total')}</span>
            <span style={{ opacity: isPricing ? 0.5 : 1 }}>{grandTotal.toLocaleString('en-US')} EGP</span>
          </div>

          {error && <p role="alert" className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}
          {/* A reminder, not a block: a customer may not want the gift. */}
          {promotions.giftChoices.some((choice) => choice.remaining > 0) && <p className="offer-note offer-note-hint text-xs">{t('promotions.giftNotChosen')}</p>}

          {/* Not while the total is being re-priced: the customer must see the amount they agree to. */}
          <Button type="submit" variant="primary" fullWidth disabled={placing || isPricing || proofUploading}>
            {placing ? t('checkout.placingOrder') : proofUploading ? t('checkout.instapayUploading') : isPricing ? t('promotions.updating') : t('checkout.placeOrder')}
          </Button>
          <div className="flex items-center justify-center gap-2 text-xs text-center" style={{ color: 'var(--color-muted)' }}>
            <FiCheckCircle className="shrink-0" style={{ color: 'var(--color-gold)' }} /> {t('checkout.orderNumberSoon')}
          </div>
        </div>
      </form>
    </div>
  );
}