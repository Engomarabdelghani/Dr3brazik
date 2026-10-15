/**
 * The simulator: a sample cart, priced by the server through the same code the
 * real cart and checkout use, with every decision explained. Nothing is saved,
 * no stock moves and no usage is counted.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiGift, FiPlay, FiX } from 'react-icons/fi';
import { isApiError } from '../../../api/client';
import type { PreviewConditionGroup, PreviewResult, PromotionInput } from '../../../api/promotionTypes';
import { previewPromotions } from '../../../lib/api/promotions';
import { fromLocalInput, money } from './builderModel';
import { Field, Note, Section, Toggle } from './builderUi';
import ProductPicker, { type PickedProduct } from './ProductPicker';

interface Props {
  /** The promotion being edited, tested as if it were active. Omit to test the live promotions only. */
  draft?: PromotionInput;
  draftId?: string;
  known: Record<string, PickedProduct>;
  remember: (product: PickedProduct) => void;
}

function Conditions({ groups }: { groups: PreviewConditionGroup[] }) {
  const { t } = useTranslation();
  const all = groups.flatMap((g) => g.conditions);
  if (all.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1">
      {all.map((c, i) => (
        <li key={i} className="flex items-start gap-2 text-xs">
          <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: c.passed ? 'rgba(34,197,94,0.16)' : 'rgba(239,68,68,0.12)', color: c.passed ? '#15803d' : '#b91c1c' }}>
            {c.passed ? <FiCheck size={10} aria-hidden="true" /> : <FiX size={10} aria-hidden="true" />}
          </span>
          <span>
            <span className="sr-only">{c.passed ? t('adminPromotionBuilder.simulator.passed') : t('adminPromotionBuilder.simulator.failed')}</span>
            {c.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

const DraftTag = () => {
  const { t } = useTranslation();
  return (
  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-coffee)', color: '#fff' }}>{t('adminPromotionBuilder.simulator.thisPromotion')}</span>
  );
};

function Results({ result }: { result: PreviewResult }) {
  const { t, i18n } = useTranslation();
  const totals = result.totals;
  const formatMoney = (amount: number) => money(amount, i18n.language);
  const shown = [...result.applied, ...result.rejected].find((p) => p.isDraft);
  const draftApplied = result.applied.find((p) => p.isDraft);

  return (
    <div className="space-y-5" aria-live="polite">
      {shown && (
        <Note tone={draftApplied ? 'success' : 'warn'}>
          {draftApplied ? (
            <>
              {t('adminPromotionBuilder.simulator.promotionApplies')}
              {draftApplied.discount > 0 ? <> {t('adminPromotionBuilder.simulator.saves')} <strong>{formatMoney(draftApplied.discount)}</strong></> : null}
              {draftApplied.gifts.length > 0 ? <> {t('adminPromotionBuilder.simulator.addsFreeGifts', { count: draftApplied.gifts.reduce((n, g) => n + g.quantity, 0) })}</> : null}.
            </>
          ) : (
            <>{t('adminPromotionBuilder.simulator.promotionDoesNotApply')} {result.rejected.find((p) => p.isDraft)?.reason}</>
          )}
        </Note>
      )}

      {draftApplied && (
        <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>{t('adminPromotionBuilder.simulator.customerPreview')}</p>
          <span className="promo-badge promo-badge-quantity">{draftApplied.badge}</span>
          <p className="text-sm mt-2">{draftApplied.summary}</p>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full text-sm min-w-[520px]">
          <caption className="sr-only">{t('adminPromotionBuilder.simulator.discountAllocation')}</caption>
          <thead>
            <tr className="text-start border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
              <th className="p-3 font-semibold text-start">{t('adminPromotionBuilder.simulator.item')}</th>
              <th className="p-3 font-semibold text-end">{t('adminPromotionBuilder.quantity')}</th>
              <th className="p-3 font-semibold text-end">{t('adminPromotionBuilder.simulator.lineTotal')}</th>
              <th className="p-3 font-semibold text-end">{t('adminPromotionBuilder.rewards.discount')}</th>
              <th className="p-3 font-semibold text-end">{t('adminPromotionBuilder.simulator.pays')}</th>
            </tr>
          </thead>
          <tbody>
            {result.lines.map((l) => (
              <tr key={l.key} className="border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <td className="p-3">
                  {l.name}
                  {!l.available && <span className="block text-[11px]" style={{ color: '#b91c1c' }}>{t('adminPromotionBuilder.simulator.notAvailable', { problem: l.problem })}</span>}
                </td>
                <td className="p-3 text-end">{l.quantity}</td>
                <td className="p-3 text-end whitespace-nowrap">{formatMoney(l.lineTotal)}</td>
                <td className="p-3 text-end whitespace-nowrap" style={{ color: l.promotionDiscount > 0 ? '#15803d' : 'var(--color-muted)' }}>{l.promotionDiscount > 0 ? `-${formatMoney(l.promotionDiscount)}` : '—'}</td>
                <td className="p-3 text-end font-semibold whitespace-nowrap">{formatMoney(l.finalTotal)}</td>
              </tr>
            ))}
            {result.gifts.map((g) => (
              <tr key={g.key} className="border-b last:border-0" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                <td className="p-3"><FiGift className="inline me-1.5" style={{ color: 'var(--color-gold)' }} aria-hidden="true" />{g.name} <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>({t('adminPromotionBuilder.simulator.freeGiftWorth', { value: formatMoney(g.value) })})</span></td>
                <td className="p-3 text-end">{g.quantity}</td>
                <td className="p-3 text-end">—</td>
                <td className="p-3 text-end">—</td>
                <td className="p-3 text-end font-semibold">{t('adminPromotionBuilder.rewards.free')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="rounded-2xl p-4 space-y-1.5 text-sm" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="flex justify-between"><dt style={{ color: 'var(--color-muted)' }}>{t('adminPromotionBuilder.simulator.originalSubtotal')}</dt><dd>{formatMoney(totals.subtotal)}</dd></div>
        {totals.promotionDiscount > 0 && <div className="flex justify-between" style={{ color: '#15803d' }}><dt>{t('adminPromotionBuilder.simulator.promotions')}</dt><dd>-{formatMoney(totals.promotionDiscount)}</dd></div>}
        {totals.couponDiscount > 0 && totals.coupon && <div className="flex justify-between" style={{ color: '#15803d' }}><dt>{t('adminPromotionBuilder.simulator.coupon', { code: totals.coupon.code })}</dt><dd>-{formatMoney(totals.couponDiscount)}</dd></div>}
        {totals.coupon && !totals.coupon.ok && <div className="text-xs" style={{ color: '#b91c1c' }}>{t('adminPromotionBuilder.simulator.invalidCoupon', { code: totals.coupon.code, message: totals.coupon.message })}</div>}
        <div className="flex justify-between"><dt style={{ color: 'var(--color-muted)' }}>{t('adminPromotionBuilder.simulator.totalDiscount')}</dt><dd>{totals.discount > 0 ? `-${formatMoney(totals.discount)}` : formatMoney(0)}</dd></div>
        <div className="flex justify-between font-extrabold text-base pt-1.5 border-t" style={{ borderColor: 'var(--color-border)' }}><dt>{t('adminPromotionBuilder.simulator.finalTotal')}</dt><dd>{formatMoney(totals.total)}</dd></div>
      </dl>

      <div>
        <h3 className="text-sm font-bold mb-2">{t('adminPromotionBuilder.simulator.applied', { count: result.applied.length })}</h3>
        {result.applied.length === 0 && <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{t('adminPromotionBuilder.simulator.noApplied')}</p>}
        <ul className="space-y-2.5">
          {result.applied.map((a) => (
            <li key={a.id} className="rounded-2xl border p-4" style={{ borderColor: 'rgba(34,197,94,0.35)' }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-sm flex flex-wrap items-center gap-2">{a.name} {a.isDraft && <DraftTag />}</p>
                <p className="text-sm font-bold" style={{ color: '#15803d' }}>
                  {a.discount > 0 ? `-${formatMoney(a.discount)}` : t('adminPromotionBuilder.simulator.giftWorth', { value: formatMoney(a.giftValue) })}
                  {a.applications > 1 && <span className="font-normal" style={{ color: 'var(--color-muted)' }}> · {t('adminPromotionBuilder.simulator.appliedTimes', { count: a.applications })}</span>}
                </p>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{a.summary}</p>
              <Conditions groups={a.conditions} />
              <ol className="mt-3 space-y-1.5 text-xs">
                {a.steps.map((s) => (
                  <li key={s.index} className="flex gap-2">
                    <span className="font-bold shrink-0">{a.steps.length > 1 ? `#${s.index}` : '→'}</span>
                    <span>
                      {s.qualifying.length > 0 && <>{t('adminPromotionBuilder.simulator.qualifying')}: {s.qualifying.map((q) => `${q.units} × ${q.name}`).join('، ')}. </>}
                      {s.rewarded.length > 0 && <>{t('adminPromotionBuilder.simulator.rewarded')}: {s.rewarded.map((r) => `${r.units} × ${r.name} (-${formatMoney(r.discount)})`).join('، ')}. </>}
                      {s.gifts.length > 0 && <>{t('adminPromotionBuilder.simulator.gift')}: {s.gifts.map((g) => `${g.quantity} × ${g.name}`).join('، ')}.</>}
                    </span>
                  </li>
                ))}
                {a.orderDiscount > 0 && <li>{t('adminPromotionBuilder.simulator.cartDiscountSpread', { amount: formatMoney(a.orderDiscount) })}</li>}
                {a.gifts.filter((g) => g.chosen).map((g) => <li key={g.name}>{t('adminPromotionBuilder.simulator.chosenGift', { quantity: g.quantity, name: g.name })}</li>)}
                {a.missingGifts.length > 0 && <li style={{ color: '#b91c1c' }}>{t('adminPromotionBuilder.simulator.missingGifts', { gifts: a.missingGifts.join('، ') })}</li>}
              </ol>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-bold mb-2">{t('adminPromotionBuilder.simulator.notApplied', { count: result.rejected.length })}</h3>
        {result.rejected.length === 0 && <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{t('adminPromotionBuilder.simulator.everyCandidateApplied')}</p>}
        <ul className="space-y-2.5">
          {result.rejected.map((r) => (
            <li key={`${r.id}-${r.code}`} className="rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
              <p className="font-semibold text-sm flex flex-wrap items-center gap-2">{r.name} {r.isDraft && <DraftTag />}</p>
              <p className="text-xs mt-1">{r.reason}</p>
              <Conditions groups={r.conditions} />
              {r.hint && <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>{t('adminPromotionBuilder.simulator.customerHint', { hint: r.hint })}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Simulator({ draft, draftId, known, remember }: Props) {
  const { t } = useTranslation();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [ids, setIds] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [phone, setPhone] = useState('');
  const [at, setAt] = useState('');
  const [alone, setAlone] = useState(false);
  const [running, setRunning] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<PreviewResult | null>(null);

  const run = async () => {
    setRunning(true);
    setErrors([]);
    try {
      setResult(
        await previewPromotions({
          items: ids.map((productId) => ({ productId, quantity: quantities[productId] ?? 1 })),
          couponCode: couponCode.trim() || (draft?.couponCode ?? null) || null,
          customerPhone: phone.trim() || null,
          at: fromLocalInput(at),
          ...(draft ? { draft, draftId, draftOnly: alone } : {}),
        })
      );
    } catch (err) {
      setResult(null);
      setErrors(isApiError(err) && err.errors.length ? err.errors.map((e) => e.message) : [err instanceof Error ? err.message : t('adminPromotionBuilder.simulator.failed')]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Section title={t('adminPromotionBuilder.simulator.title')} description={t('adminPromotionBuilder.simulator.description')}>
      <ProductPicker
        label={t('adminPromotionBuilder.simulator.sampleCart')}
        selectedIds={ids}
        onChange={setIds}
        known={known}
        remember={remember}
        max={50}
        showStock
        rowExtra={(productId) => (
          <label className="flex items-center gap-1.5 text-xs shrink-0">
            {t('adminPromotionBuilder.quantity')}
            <input
              type="number"
              min={1}
              max={99}
              value={quantities[productId] ?? 1}
              onChange={(e) => setQuantities({ ...quantities, [productId]: Math.min(Math.max(Number(e.target.value) || 1, 1), 99) })}
              className="w-16 px-2 py-1 rounded-lg border bg-white text-sm"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </label>
        )}
      />
      <details className="rounded-xl border px-3 py-2" style={{ borderColor: 'var(--color-border)' }}>
        <summary className="text-xs font-semibold cursor-pointer">{t('adminPromotionBuilder.simulator.moreOptions')}</summary>
        <div className="grid sm:grid-cols-3 gap-4 mt-3 pb-1">
          <Field label={t('adminPromotionBuilder.simulator.couponCode')} hint={draft?.couponCode ? t('adminPromotionBuilder.simulator.draftCouponHint', { code: draft.couponCode }) : undefined}>
            <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="input-luxe" placeholder={t('adminPromotionBuilder.simulator.none')} aria-label={t('adminPromotionBuilder.simulator.couponCode')} />
          </Field>
          <Field label={t('adminPromotionBuilder.simulator.customerPhone')} hint={t('adminPromotionBuilder.simulator.customerPhoneHint')}>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-luxe" placeholder={t('adminPromotionBuilder.simulator.anyCustomer')} inputMode="tel" aria-label={t('adminPromotionBuilder.simulator.customerPhone')} />
          </Field>
          <Field label={t('adminPromotionBuilder.simulator.asOf')} hint={t('adminPromotionBuilder.simulator.asOfHint')}>
            <input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className="input-luxe" aria-label={t('adminPromotionBuilder.simulator.dateTime')} />
          </Field>
        </div>
      </details>
      {draft && <Toggle label={t('adminPromotionBuilder.simulator.testAlone')} help={t('adminPromotionBuilder.simulator.testAloneHelp')} checked={alone} onChange={setAlone} />}

      <button type="button" onClick={run} disabled={ids.length === 0 || running} className="btn-primary">
        <FiPlay /> {running ? t('adminPromotionBuilder.simulator.running') : t('adminPromotionBuilder.simulator.run')}
      </button>
      {ids.length === 0 && <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{t('adminPromotionBuilder.simulator.addProduct')}</p>}

      {errors.length > 0 && (
        <Note tone="error">
          <p className="font-semibold">{t('adminPromotionBuilder.simulator.cannotRun')}</p>
          <ul className="list-disc ps-4 mt-1 space-y-0.5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </Note>
      )}
      {result && <Results result={result} />}
    </Section>
  );
}
