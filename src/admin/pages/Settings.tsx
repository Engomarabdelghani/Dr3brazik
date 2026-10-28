import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FiCheck } from 'react-icons/fi';
import { isApiError } from '../../api/client';
import { PAYMENT_SETTINGS_KEY, fetchAdminPaymentSettings, updatePaymentSettings, type PaymentSettings } from '../../lib/api/settings';

/** Where customers send InstaPay and Vodafone Cash transfers; checkout shows these. */
function PaymentSettingsForm() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['admin', 'settings', 'payment'], queryFn: fetchAdminPaymentSettings });
  const [form, setForm] = useState<PaymentSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const set = (key: keyof PaymentSettings) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm((f) => (f ? { ...f, [key]: e.target.value } : f));
    setSaved(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      await updatePaymentSettings(form);
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'payment'] });
      queryClient.invalidateQueries({ queryKey: PAYMENT_SETTINGS_KEY });
      setSaved(true);
    } catch (err) {
      setError(isApiError(err) && err.errors.length ? err.errors.map((x) => x.message).join(' · ') : err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-luxe p-5 mb-6">
      <p className="font-semibold">Payment details</p>
      <p className="text-sm mt-0.5 mb-4" style={{ color: 'var(--color-muted)' }}>Where customers send InstaPay and Vodafone Cash transfers. Checkout shows these right away.</p>
      {isLoading && <div className="space-y-3 animate-pulse">{[1, 2, 3].map((k) => <div key={k} className="h-11 rounded-xl bg-black/5" />)}</div>}
      {isError && (
        <p className="text-sm p-3 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#dc2626' }}>
          Could not load the payment details. <button onClick={() => refetch()} className="underline font-semibold">Try again</button>
        </p>
      )}
      {form && (
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">InstaPay name (address)</span>
            <input className="input-luxe mt-1" dir="ltr" required maxLength={255} value={form.instapayAddress} onChange={set('instapayAddress')} placeholder="name@instapay" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">InstaPay link</span>
            <input className="input-luxe mt-1" dir="ltr" type="url" required maxLength={1024} value={form.instapayLink} onChange={set('instapayLink')} placeholder="https://ipn.eg/S/…" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Vodafone Cash number</span>
            <input className="input-luxe mt-1 tabular-nums" dir="ltr" type="tel" inputMode="numeric" required pattern="01[0125][0-9]{8}" title="11 digits, e.g. 01012345678" value={form.vodafoneCashNumber} onChange={set('vodafoneCashNumber')} placeholder="01XXXXXXXXX" />
          </label>
          {error && <p className="text-sm p-3 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#dc2626' }}>{error}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
            {saved && <span className="text-sm inline-flex items-center gap-1" style={{ color: '#16a34a' }}><FiCheck /> Saved</span>}
          </div>
        </form>
      )}
    </div>
  );
}

/**
 * The images switch is display only: it is not saved anywhere and changes nothing; it is back on
 * every time the page opens. Order item images always show.
 */
export default function Settings() {
  const [showOrderImages, setShowOrderImages] = useState(true);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>How the admin dashboard looks and behaves.</p>
      </div>

      <PaymentSettingsForm />

      <div className="card-luxe divide-y" style={{ borderColor: 'var(--color-border)' }}>
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold">Show images on the Orders page</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>Show each item's product image in the order details.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showOrderImages}
            aria-label="Show images on the Orders page"
            onClick={() => setShowOrderImages((v) => !v)}
            className="relative w-12 h-7 shrink-0 rounded-full transition-colors"
            style={{ backgroundColor: showOrderImages ? 'var(--color-gold)' : 'var(--color-border)' }}
          >
            <motion.span
              className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow"
              initial={false}
              animate={{ x: showOrderImages ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
