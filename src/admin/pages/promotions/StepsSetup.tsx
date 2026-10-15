/** Promotion Builder, steps 1 and 2: the basics and the product groups. */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import type { ProductGroup, PromotionInput, PromotionMeta } from '../../../api/promotionTypes';
import type { CategoryRow, SubcategoryRow } from '../../../lib/api/categories';
import SingleImageUploader from '../../components/SingleImageUploader';
import { deviceTimeZone, fromLocalInput, GROUP_KEYS, inCairo, newGroup, TEMPLATES, toLocalInput } from './builderModel';
import { Choice, Field, Note, Section, TextField, Toggle } from './builderUi';
import ProductPicker, { type PickedProduct } from './ProductPicker';

export interface StepProps {
  value: PromotionInput;
  onChange: (next: PromotionInput) => void;
  known: Record<string, PickedProduct>;
  remember: (product: PickedProduct) => void;
  meta: PromotionMeta | undefined;
  categories: CategoryRow[];
  subcategories: SubcategoryRow[];
}

const TEMPLATE_GROUP_NAMES: Record<string, string> = {
  'Discounted products': 'discountedProducts',
  'Products on offer': 'productsOnOffer',
  'Qualifying products': 'qualifyingProducts',
  'Reward products': 'rewardProducts',
};

// ---------------------------------------------------------------- step 1

export function BasicsStep({ value, onChange, isNew }: StepProps & { isNew: boolean }) {
  const { t } = useTranslation();
  const [template, setTemplate] = useState<string | null>(null);
  const set = (patch: Partial<PromotionInput>) => onChange({ ...value, ...patch });
  const zone = deviceTimeZone();
  const elsewhere = zone !== 'Africa/Cairo';

  return (
    <div className="space-y-6">
      {isNew && (
        <Section title={t('adminPromotionBuilder.basics.templatesTitle')} description={t('adminPromotionBuilder.basics.templatesDescription')}>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
            {TEMPLATES.map((templateItem) => {
              const selected = template === templateItem.id;
              return (
                <button
                  type="button"
                  key={templateItem.id}
                  aria-pressed={selected}
                  onClick={() => {
                    setTemplate(templateItem.id);
                    const templateValue = templateItem.build();
                    onChange({
                      ...value,
                      ...templateValue,
                      groups: templateValue.groups.map((group) => ({
                        ...group,
                        name: t(`adminPromotionBuilder.products.defaultGroupNames.${TEMPLATE_GROUP_NAMES[group.name]}`),
                      })),
                    });
                  }}
                  className="text-start p-3 rounded-2xl border transition-colors hover:border-[var(--color-gold)]"
                  style={{ borderColor: selected ? 'var(--color-coffee)' : 'var(--color-border)', backgroundColor: selected ? 'var(--color-cream)' : '#fff' }}
                >
                  <span className="block text-sm font-semibold leading-snug">{t(`adminPromotionBuilder.templates.${templateItem.id}.title`)}</span>
                  <span className="block text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--color-muted)' }}>{t(`adminPromotionBuilder.templates.${templateItem.id}.example`)}</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      <Section title={t('adminPromotionBuilder.basics.nameTitle')} description={t('adminPromotionBuilder.basics.nameDescription')}>
        <TextField label={t('adminPromotionBuilder.basics.promotionName')} value={value.name} onChange={(name) => set({ name })} placeholder={t('adminPromotionBuilder.basics.namePlaceholder')} maxLength={160} />
        <Field label={t('adminPromotionBuilder.basics.internalNotes')}>
          <textarea
            value={value.internalDescription ?? ''}
            onChange={(e) => set({ internalDescription: e.target.value || null })}
            rows={2}
            maxLength={2000}
            placeholder={t('adminPromotionBuilder.basics.internalNotesPlaceholder')}
            className="input-luxe"
          />
        </Field>
      </Section>

      <Section title={t('adminPromotionBuilder.basics.scheduleTitle')} description={t('adminPromotionBuilder.basics.scheduleDescription')}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t('adminPromotionBuilder.basics.starts')} hint={elsewhere && value.startsAt ? t('adminPromotionBuilder.basics.cairoTime', { date: inCairo(value.startsAt) }) : undefined}>
            <input type="datetime-local" value={toLocalInput(value.startsAt)} onChange={(e) => set({ startsAt: fromLocalInput(e.target.value) })} className="input-luxe" aria-label={t('adminPromotionBuilder.basics.startDateTime')} />
          </Field>
          <Field label={t('adminPromotionBuilder.basics.ends')} hint={elsewhere && value.endsAt ? t('adminPromotionBuilder.basics.cairoTime', { date: inCairo(value.endsAt) }) : undefined}>
            <input type="datetime-local" value={toLocalInput(value.endsAt)} onChange={(e) => set({ endsAt: fromLocalInput(e.target.value) })} className="input-luxe" aria-label={t('adminPromotionBuilder.basics.endDateTime')} />
          </Field>
        </div>
        <Note>
          {t('adminPromotionBuilder.basics.timezoneNote', { zone })}
          {elsewhere && ` ${t('adminPromotionBuilder.basics.cairoTimezoneNote')}`}
        </Note>
      </Section>

      <Section title={t('adminPromotionBuilder.basics.couponTitle')} description={t('adminPromotionBuilder.basics.couponDescription')}>
        <Toggle
          label={t('adminPromotionBuilder.basics.requireCoupon')}
          checked={value.couponCode !== null}
          onChange={(on) => set({ couponCode: on ? '' : null, showCouponCode: on ? value.showCouponCode : false })}
        />
        {value.couponCode !== null && (
          <>
            <TextField
              label={t('adminPromotionBuilder.basics.code')}
              value={value.couponCode}
              onChange={(code) => set({ couponCode: code.toUpperCase().replace(/\s/g, '') })}
              placeholder="e.g. GLOW20"
              maxLength={64}
              hint={t('adminPromotionBuilder.basics.codeHint')}
            />
            <Toggle
              label={t('adminPromotionBuilder.basics.showCode')}
              help={t('adminPromotionBuilder.basics.showCodeHelp')}
              checked={value.showCouponCode}
              onChange={(showCouponCode) => set({ showCouponCode })}
            />
          </>
        )}
        <Toggle
          label={t('adminPromotionBuilder.basics.showPromotion')}
          help={t('adminPromotionBuilder.basics.showPromotionHelp')}
          checked={value.showOnStorefront}
          onChange={(showOnStorefront) => set({ showOnStorefront })}
        />
      </Section>

      <Section
        title={t('adminPromotionBuilder.basics.bannerTitle')}
        description={t('adminPromotionBuilder.basics.bannerDescription')}
      >
        <SingleImageUploader value={value.bannerImage ?? ''} onChange={(url) => set({ bannerImage: url || null })} folder="offers" />
      </Section>

      <Section title={t('adminPromotionBuilder.basics.customerTextTitle')} description={t('adminPromotionBuilder.basics.customerTextDescription')}>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField label={t('adminPromotionBuilder.basics.titleEnglish')} value={value.title} onChange={(v) => set({ title: v || null })} placeholder={t('adminPromotionBuilder.basics.titlePlaceholder')} maxLength={160} />
          <TextField label={t('adminPromotionBuilder.basics.titleArabic')} value={value.titleAr} onChange={(v) => set({ titleAr: v || null })} placeholder={t('adminPromotionBuilder.basics.titleArabicPlaceholder')} maxLength={160} dir="rtl" />
          <TextField label={t('adminPromotionBuilder.basics.badgeEnglish')} value={value.badgeLabel} onChange={(v) => set({ badgeLabel: v || null })} placeholder={t('adminPromotionBuilder.basics.writtenAutomatically')} maxLength={40} hint={t('adminPromotionBuilder.basics.badgeHint')} />
          <TextField label={t('adminPromotionBuilder.basics.badgeArabic')} value={value.badgeLabelAr} onChange={(v) => set({ badgeLabelAr: v || null })} placeholder={t('adminPromotionBuilder.basics.writtenAutomatically')} maxLength={40} dir="rtl" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t('adminPromotionBuilder.basics.descriptionEnglish')}>
            <textarea value={value.description ?? ''} onChange={(e) => set({ description: e.target.value || null })} rows={2} maxLength={1000} className="input-luxe" />
          </Field>
          <Field label={t('adminPromotionBuilder.basics.descriptionArabic')}>
            <textarea value={value.descriptionAr ?? ''} onChange={(e) => set({ descriptionAr: e.target.value || null })} rows={2} maxLength={1000} dir="rtl" className="input-luxe" />
          </Field>
        </div>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------- step 2

/** Where a product group is referred to, so it is not removed while something still needs it. */
function usesOf(value: PromotionInput, key: string, t: TFunction): string[] {
  const uses: string[] = [];
  if (value.config.trigger?.group === key) uses.push(t('adminPromotionBuilder.products.buyQuantity'));
  value.config.conditions.groups.forEach((g) =>
    g.conditions.forEach((c) => {
      if ('group' in c && c.group === key) uses.push(t('adminPromotionBuilder.products.condition'));
    })
  );
  value.config.rewards.forEach((r, i) => {
    if ('group' in r && r.group === key) uses.push(t('adminPromotionBuilder.products.reward', { count: i + 1 }));
    if (r.type === 'gift_choice' && r.fromGroup === key) uses.push(t('adminPromotionBuilder.products.giftsOfReward', { count: i + 1 }));
  });
  return [...new Set(uses)];
}

function Chips({ options, selected, onToggle }: { options: { id: string; label: string }[]; selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o.id);
        return (
          <button
            type="button"
            key={o.id}
            aria-pressed={on}
            onClick={() => onToggle(o.id)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
            style={{ borderColor: on ? 'var(--color-coffee)' : 'var(--color-border)', backgroundColor: on ? 'var(--color-coffee)' : '#fff', color: on ? '#fff' : 'var(--color-coffee)' }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

function GroupEditor({ group, index, props }: { group: ProductGroup; index: number; props: StepProps }) {
  const { t } = useTranslation();
  const { value, onChange, known, remember, meta, categories, subcategories } = props;
  const [brandSearch, setBrandSearch] = useState('');
  const update = (patch: Partial<ProductGroup>) => onChange({ ...value, groups: value.groups.map((g, i) => (i === index ? { ...g, ...patch } : g)) });
  const uses = usesOf(value, group.key, t);
  const brands = (meta?.brands ?? []).filter((b) => !group.brands.includes(b) && b.toLowerCase().includes(brandSearch.trim().toLowerCase()));
  const chosenCategories = categories.filter((c) => group.categoryIds.includes(c.id));
  const targets = group.productIds.length + group.categoryIds.length + group.subcategoryIds.length + group.brands.length;

  return (
    <Section
      title={t('adminPromotionBuilder.products.groupTitle', { key: group.key })}
      description={uses.length ? t('adminPromotionBuilder.products.groupUsed', { uses: uses.join('، ') }) : t('adminPromotionBuilder.products.groupUnused')}
      aside={
        <button
          type="button"
          onClick={() => onChange({ ...value, groups: value.groups.filter((_, i) => i !== index) })}
          disabled={uses.length > 0}
          title={uses.length ? t('adminPromotionBuilder.products.groupStillUsed', { uses: uses.join('، ') }) : t('adminPromotionBuilder.products.removeGroup')}
          aria-label={t('adminPromotionBuilder.products.removeGroupNamed', { key: group.key })}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit"
        >
          <FiTrash2 size={15} />
        </button>
      }
    >
      <TextField label={t('adminPromotionBuilder.products.groupName')} value={group.name} onChange={(name) => update({ name })} placeholder={t('adminPromotionBuilder.products.groupNamePlaceholder')} maxLength={120} hint={t('adminPromotionBuilder.products.groupNameHint')} />
      <Choice
        legend={t('adminPromotionBuilder.products.scopeLegend')}
        value={group.scope}
        onChange={(scope) => update({ scope })}
        options={[
          { value: 'all', label: t('adminPromotionBuilder.products.allProducts'), help: t('adminPromotionBuilder.products.allProductsHelp') },
          { value: 'selected', label: t('adminPromotionBuilder.products.selectedProducts'), help: t('adminPromotionBuilder.products.selectedProductsHelp') },
        ]}
      />

      {group.scope === 'selected' && (
        <>
          {targets === 0 && <Note tone="warn">{t('adminPromotionBuilder.products.emptyGroup')}</Note>}
          <Field label={t('adminPromotionBuilder.products.categories')} hint={t('adminPromotionBuilder.products.categoriesHint')}>
            <Chips options={categories.map((c) => ({ id: c.id, label: c.name }))} selected={group.categoryIds} onToggle={(id) => update({ categoryIds: toggleIn(group.categoryIds, id) })} />
          </Field>
          {subcategories.length > 0 && (
            <details className="rounded-xl border px-3 py-2" style={{ borderColor: 'var(--color-border)' }} open={group.subcategoryIds.length > 0}>
              <summary className="text-xs font-semibold cursor-pointer">{t('adminPromotionBuilder.products.subcategories', { count: group.subcategoryIds.length })}</summary>
              <div className="space-y-3 mt-3 pb-1">
                {categories.map((c) => {
                  const subs = subcategories.filter((s) => s.category_id === c.id);
                  if (subs.length === 0) return null;
                  return (
                    <div key={c.id}>
                      <p className="text-[11px] mb-1.5" style={{ color: 'var(--color-muted)' }}>
                        {c.name}
                        {chosenCategories.includes(c) && ` (${t('adminPromotionBuilder.products.categoryIncluded')})`}
                      </p>
                      <Chips options={subs.map((s) => ({ id: s.id, label: s.name }))} selected={group.subcategoryIds} onToggle={(id) => update({ subcategoryIds: toggleIn(group.subcategoryIds, id) })} />
                    </div>
                  );
                })}
              </div>
            </details>
          )}
          <Field label={t('adminPromotionBuilder.products.brands', { count: group.brands.length })}>
            {group.brands.length > 0 && (
              <div className="mb-2">
                <Chips options={group.brands.map((b) => ({ id: b, label: `${b} ×` }))} selected={group.brands} onToggle={(b) => update({ brands: group.brands.filter((x) => x !== b) })} />
              </div>
            )}
            <input value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)} placeholder={t('adminPromotionBuilder.products.searchBrands')} className="input-luxe" aria-label={t('adminPromotionBuilder.products.searchBrands')} />
            {brandSearch.trim() && (
              <div className="mt-2 max-h-40 overflow-y-auto">
                {brands.length ? (
                  <Chips
                    options={brands.slice(0, 30).map((b) => ({ id: b, label: b }))}
                    selected={[]}
                    onToggle={(b) => {
                      update({ brands: [...group.brands, b] });
                      setBrandSearch('');
                    }}
                  />
                ) : (
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{t('adminPromotionBuilder.products.noBrandMatches')}</p>
                )}
              </div>
            )}
          </Field>
          <ProductPicker label={t('adminPromotionBuilder.products.individualProducts')} selectedIds={group.productIds} onChange={(productIds) => update({ productIds })} known={known} remember={remember} />
        </>
      )}

      <details className="rounded-xl border px-3 py-2" style={{ borderColor: 'var(--color-border)' }} open={group.excludedProductIds.length > 0}>
        <summary className="text-xs font-semibold cursor-pointer">{t('adminPromotionBuilder.products.excludeProducts', { count: group.excludedProductIds.length })}</summary>
        <div className="mt-3 pb-1">
          <ProductPicker
            label={t('adminPromotionBuilder.products.excludedProducts')}
            hint={t('adminPromotionBuilder.products.excludedProductsHint')}
            selectedIds={group.excludedProductIds}
            onChange={(excludedProductIds) => update({ excludedProductIds })}
            known={known}
            remember={remember}
          />
        </div>
      </details>
    </Section>
  );
}

export function GroupsStep(props: StepProps) {
  const { t } = useTranslation();
  const { value, onChange, meta } = props;
  const limit = meta?.limits.groups ?? GROUP_KEYS.length;
  const nextKey = GROUP_KEYS.find((k) => !value.groups.some((g) => g.key === k));

  return (
    <div className="space-y-6">
      <Note>{t('adminPromotionBuilder.products.groupsIntro')}</Note>

      {value.groups.length === 0 && (
        <div className="card-luxe p-8 text-center">
          <p className="font-medium">{t('adminPromotionBuilder.products.noGroups')}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>{t('adminPromotionBuilder.products.noGroupsDescription')}</p>
        </div>
      )}
      {value.groups.map((group, index) => (
        <GroupEditor key={group.key} group={group} index={index} props={props} />
      ))}

      {nextKey && value.groups.length < limit && (
        <button
          type="button"
          onClick={() => onChange({ ...value, groups: [...value.groups, newGroup(nextKey, value.groups.length === 0 ? t('adminPromotionBuilder.products.qualifyingProducts') : value.groups.length === 1 ? t('adminPromotionBuilder.products.rewardProducts') : t('adminPromotionBuilder.products.groupNameWithKey', { key: nextKey }), 'selected')] })}
          className="btn-secondary"
        >
          <FiPlus /> {t('adminPromotionBuilder.products.addGroup')}
        </button>
      )}
    </div>
  );
}
