import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { FiCopy, FiCheck, FiPhoneCall, FiTruck, FiClipboard, FiArrowRight, FiShoppingBag } from 'react-icons/fi';
import { cld } from '../utils/cloudinary';
import { readLastOrder, type ConfirmedOrder } from '../utils/lastOrder';
import { useSeo } from '../hooks/useSeo';

const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.55 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const money = (n: number) => `${n.toLocaleString('en-US')} EGP`;

/** Gold check mark that draws itself, with a soft ring pulse and a burst of sparkles. */
function SuccessBadge() {
  const reduce = useReducedMotion();
  const sparkles = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * Math.PI * 2;
    return { x: Math.cos(angle) * 78, y: Math.sin(angle) * 78, delay: 0.45 + (i % 3) * 0.06, size: i % 2 ? 6 : 9 };
  });

  return (
    <div className="relative w-28 h-28 mx-auto">
      {!reduce && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ border: '2px solid var(--color-gold-light)' }}
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: 1.7, opacity: 0 }}
          transition={{ duration: 1.6, delay: 0.5, repeat: 2, ease: 'easeOut' }}
        />
      )}
      {!reduce &&
        sparkles.map((s, i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{ width: s.size, height: s.size, marginLeft: -s.size / 2, marginTop: -s.size / 2, backgroundColor: i % 3 ? 'var(--color-gold)' : 'var(--color-gold-light)' }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{ x: s.x, y: s.y, scale: [0, 1.2, 0.6], opacity: [1, 1, 0] }}
            transition={{ duration: 1.1, delay: s.delay, ease: EASE }}
          />
        ))}
      <motion.div
        className="absolute inset-0 rounded-full flex items-center justify-center shadow-lg"
        style={{ background: 'linear-gradient(145deg, var(--color-gold-light), var(--color-gold))' }}
        initial={reduce ? false : { scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
      >
        <svg viewBox="0 0 52 52" className="w-14 h-14" aria-hidden="true">
          <motion.path
            d="M14 27 L23 36 L39 18"
            fill="none"
            stroke="#fff"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
          />
        </svg>
      </motion.div>
    </div>
  );
}

function OrderNumber({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the number is on screen anyway */
    }
  };
  return (
    <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white shadow-sm" style={{ border: '1px solid var(--color-border)' }}>
      <span className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--color-muted)' }}>Order</span>
      <span className="text-2xl md:text-3xl font-extrabold tabular-nums tracking-wide" style={{ color: 'var(--color-coffee)' }} dir="ltr">{value}</span>
      <motion.button
        type="button"
        onClick={copy}
        whileTap={{ scale: 0.9 }}
        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
        style={{ backgroundColor: copied ? 'rgba(34,197,94,0.12)' : 'var(--color-cream)', color: copied ? '#16a34a' : 'var(--color-coffee)' }}
        aria-label={copied ? 'Copied' : 'Copy order number'}
        title={copied ? 'Copied' : 'Copy order number'}
      >
        {copied ? <FiCheck size={16} /> : <FiCopy size={15} />}
      </motion.button>
    </div>
  );
}

export default function OrderConfirmation() {
  useSeo({ title: 'Order Confirmed', path: '/order-confirmed', noindex: true });
  const location = useLocation();
  const order = (location.state as ConfirmedOrder | null) ?? readLastOrder();

  if (!order) return <Navigate to="/" replace />;

  const firstName = order.customerName.trim().split(/\s+/)[0] || 'there';
  // Confirmations saved by an older version of this page only have the number.
  const orderCode = order.orderCode ?? `#${order.orderNumber}`;
  const steps = [
    { icon: FiClipboard, title: 'Order received', text: `Your order ${orderCode} is saved and our team is preparing it.` },
    { icon: FiPhoneCall, title: 'We call to confirm', text: `Our team will contact you on ${order.phone} to confirm the delivery time.` },
    {
      icon: FiTruck,
      title: 'Delivered to your door',
      text: `${order.delivery}. ${order.paymentMethod === 'cod' ? 'Pay in cash when it arrives.' : 'Pay by Instapay / Vodafone Cash.'}`,
    },
  ];

  return (
    <div className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, var(--color-cream) 0%, var(--color-bg) 55%)' }}>
      <div className="container-luxe py-14 md:py-20 max-w-3xl">
        <SuccessBadge />

        <motion.div variants={container} initial="hidden" animate="show" className="text-center mt-8">
          <motion.span variants={rise} className="eyebrow block">Order Confirmed</motion.span>
          <motion.h1 variants={rise} className="section-title mt-3">Thank you, {firstName}!</motion.h1>
          <motion.p variants={rise} className="mt-3 text-sm md:text-base max-w-md mx-auto" style={{ color: 'var(--color-muted)' }}>
            Your order has been received and saved. Keep your order number. You'll need it if you contact us.
          </motion.p>
          <motion.div variants={rise} className="mt-7">
            <OrderNumber value={orderCode} />
            <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
              Placed {new Date(order.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </motion.div>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="mt-12 grid md:grid-cols-5 gap-6">
          {/* What happens next */}
          <motion.div variants={rise} className="md:col-span-3 rounded-3xl bg-white p-6 md:p-7 shadow-sm" style={{ border: '1px solid var(--color-border)' }}>
            <h2 className="font-bold mb-5">What happens next</h2>
            <ol className="space-y-5">
              {steps.map((step, i) => (
                <motion.li key={step.title} variants={rise} className="flex gap-4">
                  <div className="relative flex flex-col items-center">
                    <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-cream)', color: 'var(--color-gold)' }}>
                      <step.icon size={17} />
                    </span>
                    {i < steps.length - 1 && <span className="flex-1 w-px mt-2" style={{ backgroundColor: 'var(--color-border)' }} />}
                  </div>
                  <div className="pb-1">
                    <p className="font-semibold text-sm">{step.title}</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>{step.text}</p>
                  </div>
                </motion.li>
              ))}
            </ol>

            <div className="flex flex-wrap gap-3 mt-7">
              {/* WhatsApp hand-off is switched off for now; this button comes back with it:
              <motion.a href={order.whatsappUrl} target="_blank" rel="noopener noreferrer" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold text-white shadow-sm" style={{ backgroundColor: '#25D366' }}>
                <FaWhatsapp size={17} /> Open WhatsApp again
              </motion.a> */}
              <Link to="/shop" className="btn-primary">
                <FiShoppingBag /> Continue Shopping
              </Link>
            </div>
          </motion.div>

          {/* Summary */}
          <motion.div variants={rise} className="md:col-span-2 rounded-3xl bg-white p-6 shadow-sm h-fit" style={{ border: '1px solid var(--color-border)' }}>
            <h2 className="font-bold mb-4">Order Summary</h2>
            <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {order.items.map((item, i) => (
                <motion.li key={`${item.name}-${i}`} variants={rise} className="flex items-center gap-3 text-sm">
                  {item.image ? (
                    <img src={cld(item.image, 120)} alt="" loading="lazy" className="w-12 h-14 rounded-lg object-cover shrink-0" />
                  ) : (
                    <span className="w-12 h-14 rounded-lg shrink-0" style={{ backgroundColor: 'var(--color-cream)' }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-2">{item.name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Qty {item.quantity} × {money(item.price)}</p>
                  </div>
                  <p className="font-semibold whitespace-nowrap">{money(item.lineTotal)}</p>
                </motion.li>
              ))}
            </ul>
            <div className="h-px my-4" style={{ backgroundColor: 'var(--color-border)' }} />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Subtotal</span><span>{money(order.subtotal)}</span></div>
              {order.discount > 0 && (
                <div className="flex justify-between" style={{ color: '#16a34a' }}><span>Discount</span><span>-{money(order.discount)}</span></div>
              )}
              <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Shipping</span><span>{money(order.shippingPrice)}</span></div>
            </div>
            <div className="h-px my-4" style={{ backgroundColor: 'var(--color-border)' }} />
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{money(order.total)}</span></div>
            <Link to="/" className="mt-5 text-xs font-semibold inline-flex items-center gap-1" style={{ color: 'var(--color-gold)' }}>
              Back to home <FiArrowRight size={12} />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
