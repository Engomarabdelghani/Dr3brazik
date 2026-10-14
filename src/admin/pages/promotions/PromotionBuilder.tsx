import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FiArrowLeft, FiArrowRight, FiCheck, FiSave, FiZap } from 'react-icons/fi';
import { isApiError } from '../../../api/client';
import type { PromotionInput, PromotionStatus } from '../../../api/promotionTypes';
import { fetchCategoryRows, fetchSubcategoryRows } from '../../../lib/api/categories';
import { fetchProductsByIds } from '../../../lib/api/products';
import { createPromotion, fetchAdminPromotion, fetchPromotionMeta, updatePromotion } from '../../../lib/api/promotions';
import { blankPromotion, localIssues, STATUS_STYLE, stepOfError, STEPS, toInput, toPicked } from './builderModel';
import { Note, StatusPill } from './builderUi';
import type { PickedProduct } from './ProductPicker';
import Simulator from './Simulator';
import { ConditionsStep, RewardsStep, RulesStep } from './StepsRules';
import { BasicsStep, GroupsStep, type StepProps } from './StepsSetup';

/** Every product id a promotion mentions, so their names and pictures can be loaded once. */
function referencedProducts(p: PromotionInput): string[] {
  const ids = new Set<string>();
  for (const g of p.groups) for (const id of [...g.productIds, ...g.excludedProductIds]) ids.add(id);
  for (const r of p.config.rewards) {
    if (r.type === 'gift') for (const item of r.items) ids.add(item.productId);
    if (r.type === 'gift_choice') for (const id of r.options) ids.add(id);
  }
  return [...ids];
}

interface Problem {
  step: number;
  message: string;
}

export default function PromotionBuilder() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: saved, isLoading, error: loadError } = useQuery({ queryKey: ['admin', 'promotion', id], queryFn: () => fetchAdminPromotion(id!), enabled: !isNew });
  const { data: meta } = useQuery({ queryKey: ['admin', 'promotion-meta'], queryFn: fetchPromotionMeta });
  const { data: categories = [] } = useQuery({ queryKey: ['admin', 'categories-raw'], queryFn: fetchCategoryRows });
  const { data: subcategories = [] } = useQuery({ queryKey: ['admin', 'subcategories-raw'], queryFn: fetchSubcategoryRows });

  const [value, setValue] = useState<PromotionInput>(blankPromotion);
  const [known, setKnown] = useState<Record<string, PickedProduct>>({});
  const [step, setStep] = useState(0);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [saving, setSaving] = useState<'save' | 'activate' | null>(null);
  const loaded = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!saved || loaded.current) return;
    loaded.current = true;
    const input = toInput(saved);
    setValue(input);
    const ids = referencedProducts(input);
    if (ids.length) {
      fetchProductsByIds(ids)
        .then((products) => setKnown((prev) => ({ ...prev, ...Object.fromEntries(products.map((p) => [p.id, toPicked(p)])) })))
        .catch(() => undefined);
    }
  }, [saved]);

  const remember = (product: PickedProduct) => setKnown((prev) => ({ ...prev, [product.id]: product }));
  const props: StepProps = { value, onChange: setValue, known, remember, meta, categories, subcategories };

  const goTo = (next: number) => {
    setStep(Math.min(Math.max(next, 0), STEPS.length - 1));
    // Move focus to the step heading so keyboard and screen-reader users land on the new step.
    requestAnimationFrame(() => heading.current?.focus());
  };

  const stepsWithProblems = useMemo(() => new Set(problems.map((p) => p.step)), [problems]);
  const currentProblems = localIssues(value).filter((p) => p.step === step);

  const save = async (status: PromotionStatus, kind: 'save' | 'activate') => {
    const local = localIssues(value);
    if (local.length) {
      setProblems(local);
      goTo(local[0]!.step);
      return;
    }
    setSaving(kind);
    setProblems([]);
    try {
      const input: PromotionInput = { ...value, status, couponCode: value.couponCode || null };
      if (isNew) await createPromotion(input);
      else await updatePromotion(id!, input);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
      queryClient.removeQueries({ queryKey: ['admin', 'promotion', id] });
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      navigate('/admin/promotions');
    } catch (err) {
      const found: Problem[] =
        isApiError(err) && err.errors.length
          ? err.errors.map((e) => ({ step: stepOfError(e.path), message: e.message }))
          : [{ step, message: err instanceof Error ? err.message : 'The promotion could not be saved.' }];
      setProblems(found);
      goTo(found[0]!.step);
    } finally {
      setSaving(null);
    }
  };

  if (!isNew && isLoading) return <div className="card-luxe p-8 text-center" style={{ color: 'var(--color-muted)' }}>Loading…</div>;
  if (!isNew && (loadError || (!isLoading && !saved))) {
    return (
      <div className="card-luxe p-10 text-center">
        <p className="font-medium">This promotion could not be loaded</p>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>It may have been deleted.</p>
        <Link to="/admin/promotions" className="btn-secondary mt-5">Back to Promotions</Link>
      </div>
    );
  }

  const status = saved ? STATUS_STYLE[saved.effectiveStatus]! : STATUS_STYLE.draft!;
  const live = saved?.effectiveStatus === 'active' || saved?.effectiveStatus === 'scheduled';
  const canActivate = !saved || saved.status !== 'active';
  const last = step === STEPS.length - 1;

  return (
    <div>
      <Link to="/admin/promotions" className="inline-flex items-center gap-2 text-sm font-medium mb-6 hover:text-[var(--color-gold)] transition-colors">
        <FiArrowLeft className="rtl-flip" /> Back to Promotions
      </Link>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">{isNew ? 'New promotion' : value.name || 'Edit promotion'}</h1>
        <StatusPill status={status} />
        {saved && saved.usageCount > 0 && <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Used by {saved.usageCount} order{saved.usageCount === 1 ? '' : 's'}</span>}
      </div>

      {live && (
        <div className="mb-6">
          <Note tone="warn">
            This promotion is {saved!.effectiveStatus === 'active' ? 'live' : 'scheduled'}. Saving applies your changes to new carts and orders straight away. Orders already placed keep the price and the promotion details they were placed with.
          </Note>
        </div>
      )}

      {/* Steps: every step is reachable at any time; a dot marks steps that need attention. */}
      <nav aria-label="Promotion builder steps" className="mb-6 overflow-x-auto scrollbar-hide">
        <ol className="flex gap-2 min-w-max">
          {STEPS.map((s, i) => {
            const current = i === step;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={current ? 'step' : undefined}
                  className="flex items-center gap-2.5 ps-2.5 pe-4 py-2 rounded-full border text-start transition-colors"
                  style={{ borderColor: current ? 'var(--color-coffee)' : 'var(--color-border)', backgroundColor: current ? 'var(--color-coffee)' : 'var(--color-surface)', color: current ? '#fff' : 'var(--color-coffee)' }}
                >
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: current ? 'rgba(255,255,255,0.2)' : 'var(--color-cream)' }}>
                    {i < step && !stepsWithProblems.has(i) ? <FiCheck size={12} aria-hidden="true" /> : i + 1}
                  </span>
                  <span className="text-sm font-semibold whitespace-nowrap">{s.title}</span>
                  {stepsWithProblems.has(i) && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Needs attention"><span className="sr-only">Needs attention</span></span>}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <h2 ref={heading} tabIndex={-1} className="text-lg font-bold mb-1" style={{ outline: 'none' }}>
        Step {step + 1} of {STEPS.length}: {STEPS[step]!.title}
      </h2>
      <p className="text-sm mb-5" style={{ color: 'var(--color-muted)' }}>{STEPS[step]!.hint}</p>

      {problems.filter((p) => p.step === step).length > 0 && (
        <div className="mb-5">
          <Note tone="error">
            <p className="font-semibold">Please fix the following:</p>
            <ul className="list-disc ps-4 mt-1 space-y-0.5">
              {problems.filter((p) => p.step === step).map((p) => <li key={p.message}>{p.message}</li>)}
            </ul>
          </Note>
        </div>
      )}

      {step === 0 && <BasicsStep {...props} isNew={isNew} />}
      {step === 1 && <GroupsStep {...props} />}
      {step === 2 && <ConditionsStep {...props} />}
      {step === 3 && <RewardsStep {...props} />}
      {step === 4 && <RulesStep {...props} />}
      {step === 5 && (
        <div className="space-y-6">
          {localIssues(value).length > 0 && (
            <Note tone="warn">
              <p className="font-semibold">Not ready to save yet:</p>
              <ul className="list-disc ps-4 mt-1 space-y-0.5">
                {localIssues(value).map((p) => (
                  <li key={p.message}>
                    {p.message}{' '}
                    <button type="button" onClick={() => goTo(p.step)} className="underline font-semibold">Go to {STEPS[p.step]!.title}</button>
                  </li>
                ))}
              </ul>
            </Note>
          )}
          <Simulator draft={value} draftId={id} known={known} remember={remember} />
        </div>
      )}

      {problems.some((p) => p.step !== step) && (
        <div className="mt-5">
          <Note tone="error">
            Other steps need attention:{' '}
            {[...stepsWithProblems].filter((s) => s !== step).map((s) => (
              <button type="button" key={s} onClick={() => goTo(s)} className="underline font-semibold me-2">{STEPS[s]!.title}</button>
            ))}
          </Note>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <button type="button" onClick={() => goTo(step - 1)} disabled={step === 0} className="btn-secondary disabled:opacity-40">
          <FiArrowLeft className="rtl-flip" /> Back
        </button>
        <div className="flex flex-wrap items-center gap-3">
          {!last && currentProblems.length > 0 && <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{currentProblems[0]!.message}</span>}
          <button type="button" onClick={() => save(saved?.status ?? 'draft', 'save')} disabled={saving !== null} className={last ? 'btn-secondary' : 'text-sm font-semibold px-3 py-2 hover:text-[var(--color-gold)]'}>
            <span className="inline-flex items-center gap-2"><FiSave /> {saving === 'save' ? 'Saving…' : saved ? 'Save changes' : 'Save as draft'}</span>
          </button>
          {last ? (
            canActivate && (
              <button type="button" onClick={() => save('active', 'activate')} disabled={saving !== null} className="btn-primary">
                <FiZap /> {saving === 'activate' ? 'Activating…' : value.startsAt && new Date(value.startsAt) > new Date() ? 'Save and schedule' : 'Save and activate'}
              </button>
            )
          ) : (
            <button type="button" onClick={() => goTo(step + 1)} className="btn-primary">
              Next: {STEPS[step + 1]!.title} <FiArrowRight className="rtl-flip" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
