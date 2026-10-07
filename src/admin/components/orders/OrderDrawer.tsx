import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { FaWhatsapp } from 'react-icons/fa';
import { FiX, FiPhone, FiCopy, FiCheck, FiAlertTriangle, FiMapPin, FiCreditCard, FiRotateCcw, FiArrowRight, FiClock } from 'react-icons/fi';
import { fetchAdminOrder } from '../../../lib/api/orders';
import type { OrderStatus } from '../../../types';
import { FLOW, STATUS_META, orderLabel, fullDate, money, nextStep, paymentLabel, timeAgo, whatsappLink } from './orderUi';
import StatusBadge from './StatusBadge';

const EASE = [0.22, 1, 0.36, 1] as const;

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard blocked */
        }
      }}
      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
      style={{ color: done ? '#16a34a' : 'var(--color-muted)' }}
      aria-label={done ? 'Copied' : label}
      title={done ? 'Copied' : label}
    >
      {done ? <FiCheck size={14} /> : <FiCopy size={14} />}
    </button>
  );
}

/** Progress along new → confirmed → shipped → delivered, with an animated fill. */
function StatusStepper({ status }: { status: OrderStatus }) {
  const reached = FLOW.indexOf(status);
  const progress = status === 'cancelled' ? 0 : reached / (FLOW.length - 1);
  return (
    <div className="relative px-1">
      <div className="absolute left-5 right-5 top-5 h-1 rounded-full" style={{ backgroundColor: 'var(--color-border)' }} />
      <motion.div
        className="absolute left-5 right-5 top-5 h-1 rounded-full origin-left"
        style={{ backgroundColor: 'var(--color-gold)' }}
        initial={false}
        animate={{ scaleX: progress }}
        transition={{ duration: 0.6, ease: EASE }}
      />
      <div className="relative flex justify-between">
        {FLOW.map((step, i) => {
          const meta = STATUS_META[step];
          const done = status !== 'cancelled' && i <= reached;
          const current = step === status;
          return (
            <div key={step} className="flex flex-col items-center gap-2 w-16">
              <motion.span
                initial={false}
                animate={{ scale: current ? 1.12 : 1, backgroundColor: done ? 'var(--color-gold)' : '#ffffff', color: done ? '#ffffff' : 'var(--color-muted)' }}
                transition={{ duration: 0.35 }}
                className="w-10 h-10 rounded-full flex items-center justify-center border-2"
                style={{ borderColor: done ? 'var(--color-gold)' : 'var(--color-border)' }}
              >
                <meta.icon size={16} />
              </motion.span>
              <span className="text-[11px] font-semibold text-center" style={{ color: done ? 'var(--color-coffee)' : 'var(--color-muted)' }}>
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderDrawer({
  orderId,
  onClose,
  onChangeStatus,
  busy,
}: {
  orderId: string | null;
  onClose: () => void;
  onChangeStatus: (id: string, orderCode: string, status: OrderStatus) => Promise<void>;
  busy: boolean;
}) {
  const open = orderId !== null;
  const { data: order, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'order', orderId],
    queryFn: () => fetchAdminOrder(orderId!),
    enabled: open,
  });
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (!open) return;
    setConfirmCancel(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, orderId, onClose]);

  const next = order ? nextStep(order.status) : null;
  const wa = order ? whatsappLink(order.customer.phone, order.customer.name, orderLabel(order)) : null;
  const shortfall = order?.lines.reduce((n, l) => n + l.stockShortfall, 0) ?? 0;

  const change = async (status: OrderStatus) => {
    if (!order) return;
    await onChangeStatus(order.id, orderLabel(order), status);
    setConfirmCancel(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label={order ? `Order ${orderLabel(order)}` : 'Order details'}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-xl flex flex-col shadow-2xl"
            style={{ backgroundColor: 'var(--color-bg)' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.38, ease: EASE }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b bg-white" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-extrabold">{order ? `Order ${orderLabel(order)}` : 'Order'}</h3>
                  {order && <StatusBadge status={order.status} size="md" />}
                </div>
                {order && (
                  <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: 'var(--color-muted)' }}>
                    <FiClock size={12} /> {fullDate(order.createdAt)} · {timeAgo(order.createdAt)}
                  </p>
                )}
              </div>
              <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors">
                <FiX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {isLoading && (
                <div className="space-y-4 animate-pulse">
                  {[80, 160, 120, 200].map((h) => <div key={h} className="rounded-2xl bg-black/5" style={{ height: h }} />)}
                </div>
              )}
              {isError && (
                <div className="text-sm p-4 rounded-2xl" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#dc2626' }}>
                  Could not load this order. <button onClick={() => refetch()} className="underline font-semibold">Try again</button>
                </div>
              )}

              {order && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="space-y-6">
                  {/* Progress + actions */}
                  <section className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: '1px solid var(--color-border)' }}>
                    {order.status === 'cancelled' ? (
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold flex items-center gap-2" style={{ color: '#dc2626' }}>
                            <STATUS_META.cancelled.icon /> This order was cancelled.
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                            {order.stockReturned
                              ? 'Its items were returned to stock. Reopening takes them from stock again.'
                              : 'Its items were not returned to stock (cancelled before stock returns were added).'}
                          </p>
                        </div>
                        <button disabled={busy} onClick={() => change('new')} className="btn-secondary text-xs px-4 py-2 shrink-0">
                          <FiRotateCcw size={13} /> Reopen
                        </button>
                      </div>
                    ) : (
                      <StatusStepper status={order.status} />
                    )}

                    <AnimatePresence mode="wait" initial={false}>
                      {confirmCancel ? (
                        <motion.div
                          key="confirm"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-5 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3" style={{ backgroundColor: 'rgba(239,68,68,0.06)' }}>
                            <p className="text-sm">Cancel order {orderLabel(order)}? Its items go back to stock.</p>
                            <div className="flex gap-2">
                              <button onClick={() => setConfirmCancel(false)} className="text-xs font-semibold px-4 py-2 rounded-full hover:bg-black/5">Keep order</button>
                              <button disabled={busy} onClick={() => change('cancelled')} className="text-xs font-semibold px-4 py-2 rounded-full text-white disabled:opacity-50" style={{ backgroundColor: '#dc2626' }}>
                                Yes, cancel it
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        order.status !== 'cancelled' && (
                          <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 flex flex-wrap items-center gap-2">
                            {next && (
                              <motion.button whileTap={{ scale: 0.97 }} disabled={busy} onClick={() => change(next.to)} className="btn-primary text-sm">
                                {next.label} <FiArrowRight size={14} />
                              </motion.button>
                            )}
                            <select
                              value={order.status}
                              disabled={busy}
                              onChange={(e) => change(e.target.value as OrderStatus)}
                              className="input-luxe w-auto py-2 text-xs"
                              aria-label="Set status"
                            >
                              {FLOW.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                            </select>
                            {order.status !== 'delivered' && (
                              <button onClick={() => setConfirmCancel(true)} className="ml-auto text-xs font-semibold px-4 py-2 rounded-full transition-colors hover:bg-red-50" style={{ color: '#dc2626' }}>
                                Cancel order
                              </button>
                            )}
                          </motion.div>
                        )
                      )}
                    </AnimatePresence>
                  </section>

                  {shortfall > 0 && (
                    <div className="flex items-start gap-2.5 text-sm p-4 rounded-2xl" style={{ backgroundColor: 'rgba(239,68,68,0.07)', color: '#b91c1c' }}>
                      <FiAlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <span>{shortfall} unit{shortfall > 1 ? 's were' : ' was'} ordered beyond the stock available at the time. Check you can fulfil them before confirming.</span>
                    </div>
                  )}

                  {/* Customer */}
                  <section className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: '1px solid var(--color-border)' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-3" style={{ color: 'var(--color-muted)' }}>Customer</p>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-base">{order.customer.name}</p>
                        <p className="text-sm tabular-nums flex items-center gap-1" style={{ color: 'var(--color-muted)' }}>
                          {order.customer.phone} <CopyButton value={order.customer.phone} label="Copy phone" />
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <a href={`tel:${order.customer.phone}`} className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:-translate-y-0.5" style={{ backgroundColor: 'var(--color-cream)', color: 'var(--color-coffee)' }} aria-label="Call" title="Call">
                          <FiPhone size={16} />
                        </a>
                        {wa && (
                          <a href={wa} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform hover:-translate-y-0.5" style={{ backgroundColor: '#25D366' }} aria-label="WhatsApp" title="Message on WhatsApp">
                            <FaWhatsapp size={17} />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="h-px my-4" style={{ backgroundColor: 'var(--color-border)' }} />
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex gap-2.5">
                        <FiMapPin size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--color-gold)' }} />
                        <div className="min-w-0">
                          <p className="font-semibold">{order.city ? `${order.governorate} — ${order.city}` : order.governorate}</p>
                          <p className="flex items-start gap-1" style={{ color: 'var(--color-muted)' }}>
                            <span className="break-words">{order.customer.address}</span>
                            <CopyButton value={`${order.customer.address}, ${order.city ?? ''} ${order.governorate}`.trim()} label="Copy address" />
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2.5">
                        <FiCreditCard size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--color-gold)' }} />
                        <p className="font-semibold">{paymentLabel(order.paymentMethod)}</p>
                      </div>
                    </div>
                    {order.customer.notes && (
                      <p className="mt-4 text-sm p-3 rounded-xl italic" style={{ backgroundColor: 'var(--color-cream)' }}>“{order.customer.notes}”</p>
                    )}
                  </section>

                  {/* Items */}
                  <section className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: '1px solid var(--color-border)' }}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-3" style={{ color: 'var(--color-muted)' }}>
                      Items · {order.lines.reduce((n, l) => n + l.quantity, 0)}
                    </p>
                    <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                      {order.lines.map((l, i) => (
                        <motion.li
                          key={l.id}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * i, duration: 0.3 }}
                          className="py-3 flex items-start justify-between gap-3 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="font-medium">{l.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                              {l.quantity} × {money(l.unitPrice)}
                              {l.unitPrice < l.unitBasePrice && <span className="line-through ml-1.5">{money(l.unitBasePrice)}</span>}
                              {l.itemType === 'deal' && ' · Banner deal'}
                              {l.sku && ` · SKU ${l.sku}`}
                            </p>
                            {l.stockShortfall > 0 && (
                              <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>
                                <FiAlertTriangle size={10} /> {l.stockShortfall} beyond stock
                              </span>
                            )}
                          </div>
                          <p className="font-semibold whitespace-nowrap">{money(l.lineTotal)}</p>
                        </motion.li>
                      ))}
                    </ul>
                    <div className="h-px my-3" style={{ backgroundColor: 'var(--color-border)' }} />
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Subtotal</span><span>{money(order.subtotal)}</span></div>
                      {order.bogoDiscount > 0 && <div className="flex justify-between" style={{ color: '#16a34a' }}><span>Buy X Get Y</span><span>-{money(order.bogoDiscount)}</span></div>}
                      {order.couponDiscount > 0 && <div className="flex justify-between" style={{ color: '#16a34a' }}><span>Coupon {order.couponCode}</span><span>-{money(order.couponDiscount)}</span></div>}
                      <div className="flex justify-between"><span style={{ color: 'var(--color-muted)' }}>Shipping</span><span>{money(order.shippingPrice)}</span></div>
                      <div className="flex justify-between font-extrabold text-base pt-2"><span>Total</span><span>{money(order.total)}</span></div>
                    </div>
                  </section>

                  <p className="text-[11px] text-center pb-2" style={{ color: 'var(--color-muted)' }}>
                    Last updated {fullDate(order.updatedAt)}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
