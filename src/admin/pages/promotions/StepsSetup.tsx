/** Promotion Builder, steps 1 and 2: the basics and the product groups. */
import { useState } from 'react';
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

// ---------------------------------------------------------------- step 1

export function BasicsStep({ value, onChange, isNew }: StepProps & { isNew: boolean }) {
  const [template, setTemplate] = useState<string | null>(null);
  const set = (patch: Partial<PromotionInput>) => onChange({ ...value, ...patch });
  const zone = deviceTimeZone();
  const elsewhere = zone !== 'Africa/Cairo';

  return (
    <div className="space-y-6">
      {isNew && (
        <Section title="Start from a template" description="Pick the kind of offer you have in mind. It only pre-fills the next steps: you can change everything afterwards.">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
            {TEMPLATES.map((t) => {
              const selected = template === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  aria-pressed={selected}
                  onClick={() => {
                    setTemplate(t.id);
                    onChange({ ...value, ...t.build() });
                  }}
                  className="text-start p-3 rounded-2xl border transition-colors hover:border-[var(--color-gold)]"
                  style={{ borderColor: selected ? 'var(--color-coffee)' : 'var(--color-border)', backgroundColor: selected ? 'var(--color-cream)' : '#fff' }}
                >
                  <span className="block text-sm font-semibold leading-snug">{t.title}</span>
                  <span className="block text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--color-muted)' }}>{t.example}</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="Name" description="For your team only. Customers see the title below, or one written for them automatically.">
        <TextField label="Promotion name" value={value.name} onChange={(name) => set({ name })} placeholder="e.g. Summer: buy 2 get 1 free" maxLength={160} />
        <Field label="Internal notes (optional)">
          <textarea
            value={value.internalDescription ?? ''}
            onChange={(e) => set({ internalDescription: e.target.value || null })}
            rows={2}
            maxLength={2000}
            placeholder="Why this campaign exists, who asked for it, anything worth remembering."
            className="input-luxe"
          />
        </Field>
      </Section>

      <Section
        title="Schedule"
        description="A promotion only applies while it is active and inside these dates. Leave the start empty to begin as soon as it is activated, and the end empty to run until you stop it."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Starts" hint={elsewhere && value.startsAt ? `In Cairo: ${inCairo(value.startsAt)}` : undefined}>
            <input type="datetime-local" value={toLocalInput(value.startsAt)} onChange={(e) => set({ startsAt: fromLocalInput(e.target.value) })} className="input-luxe" aria-label="Start date and time" />
          </Field>
          <Field label="Ends" hint={elsewhere && value.endsAt ? `In Cairo: ${inCairo(value.endsAt)}` : undefined}>
            <input type="datetime-local" value={toLocalInput(value.endsAt)} onChange={(e) => set({ endsAt: fromLocalInput(e.target.value) })} className="input-luxe" aria-label="End date and time" />
          </Field>
        </div>
        <Note>
          Times are entered in this device’s time zone ({zone}) and stored in UTC, so the promotion starts and ends at the same moment for every customer.
          {elsewhere && ' The shop runs on Cairo time, shown under each field.'}
        </Note>
      </Section>

      <Section title="Coupon code" description="Without a code the promotion applies automatically to every cart that qualifies. With a code, only customers who enter it get it.">
        <Toggle
          label="Customers must enter a code"
          checked={value.couponCode !== null}
          onChange={(on) => set({ couponCode: on ? '' : null, showCouponCode: on ? value.showCouponCode : false })}
        />
        {value.couponCode !== null && (
          <>
            <TextField
              label="Code"
              value={value.couponCode}
              onChange={(code) => set({ couponCode: code.toUpperCase().replace(/\s/g, '') })}
              placeholder="e.g. GLOW20"
              maxLength={64}
              hint="Entered in the cart’s coupon field. It cannot be the same as an existing coupon."
            />
            <Toggle
              label="Show the code on the storefront"
              help="On: product pages show “Use code GLOW20”. Off: the offer is advertised as needing a code, without revealing it."
              checked={value.showCouponCode}
              onChange={(showCouponCode) => set({ showCouponCode })}
            />
          </>
        )}
        <Toggle
          label="Show this promotion on the storefront"
          help="Badges on product cards, details on product pages and “almost there” hints in the cart. Turn off for private codes: the promotion still applies, it is just not advertised."
          checked={value.showOnStorefront}
          onChange={(showOnStorefront) => set({ showOnStorefront })}
        />
      </Section>

      <Section
        title="Banner image (optional)"
        description="Shown on the storefront’s Offers page and at the top of this promotion’s own page. A promo banner on the home page can link to that page."
      >
        <SingleImageUploader value={value.bannerImage ?? ''} onChange={(url) => set({ bannerImage: url || null })} folder="offers" />
      </Section>

      <Section title="Customer-facing text (optional)" description="Leave these empty and the badge, summary and rules are written for you, in English and Arabic, from the promotion’s settings. Fill them in to use your own words.">
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField label="Title (English)" value={value.title} onChange={(v) => set({ title: v || null })} placeholder="e.g. Summer Glow Offer" maxLength={160} />
          <TextField label="Title (Arabic)" value={value.titleAr} onChange={(v) => set({ titleAr: v || null })} placeholder="مثال: عرض الصيف" maxLength={160} dir="rtl" />
          <TextField label="Badge (English)" value={value.badgeLabel} onChange={(v) => set({ badgeLabel: v || null })} placeholder="Written automatically" maxLength={40} hint="The short label over product images. Keep it under 20 characters." />
          <TextField label="Badge (Arabic)" value={value.badgeLabelAr} onChange={(v) => set({ badgeLabelAr: v || null })} placeholder="يُكتب تلقائياً" maxLength={40} dir="rtl" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Description (English)">
            <textarea value={value.description ?? ''} onChange={(e) => set({ description: e.target.value || null })} rows={2} maxLength={1000} className="input-luxe" />
          </Field>
          <Field label="Description (Arabic)">
            <textarea value={value.descriptionAr ?? ''} onChange={(e) => set({ descriptionAr: e.target.value || null })} rows={2} maxLength={1000} dir="rtl" className="input-luxe" />
          </Field>
        </div>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------- step 2

/** Where a product group is referred to, so it is not removed while something still needs it. */
function usesOf(value: PromotionInput, key: string): string[] {
  const uses: string[] = [];
  if (value.config.trigger?.group === key) uses.push('the buy quantity');
  value.config.conditions.groups.forEach((g) =>
    g.conditions.forEach((c) => {
      if ('group' in c && c.group === key) uses.push('a condition');
    })
  );
  value.config.rewards.forEach((r, i) => {
    if ('group' in r && r.group === key) uses.push(`reward ${i + 1}`);
    if (r.type === 'gift_choice' && r.fromGroup === key) uses.push(`the gifts of reward ${i + 1}`);
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
  const { value, onChange, known, remember, meta, categories, subcategories } = props;
  const [brandSearch, setBrandSearch] = useState('');
  const update = (patch: Partial<ProductGroup>) => onChange({ ...value, groups: value.groups.map((g, i) => (i === index ? { ...g, ...patch } : g)) });
  const uses = usesOf(value, group.key);
  const brands = (meta?.brands ?? []).filter((b) => !group.brands.includes(b) && b.toLowerCase().includes(brandSearch.trim().toLowerCase()));
  const chosenCategories = categories.filter((c) => group.categoryIds.includes(c.id));
  const targets = group.productIds.length + group.categoryIds.length + group.subcategoryIds.length + group.brands.length;

  return (
    <Section
      title={`Group ${group.key}`}
      description={uses.length ? `Used by ${uses.join(', ')}.` : 'Not used yet: the next steps let you pick it for the buy quantity, a condition or a reward.'}
      aside={
        <button
          type="button"
          onClick={() => onChange({ ...value, groups: value.groups.filter((_, i) => i !== index) })}
          disabled={uses.length > 0}
          title={uses.length ? `Still used by ${uses.join(', ')}: change that first.` : 'Remove this group'}
          aria-label={`Remove group ${group.key}`}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit"
        >
          <FiTrash2 size={15} />
        </button>
      }
    >
      <TextField label="Group name" value={group.name} onChange={(name) => update({ name })} placeholder="e.g. Serums, Gift-eligible products" maxLength={120} hint="For your team. It appears in this builder and in the simulator." />
      <Choice
        legend="Which products are in this group?"
        value={group.scope}
        onChange={(scope) => update({ scope })}
        options={[
          { value: 'all', label: 'All products', help: 'Every product in the store, except any you exclude below.' },
          { value: 'selected', label: 'Selected products', help: 'Only the categories, brands and products you choose.' },
        ]}
      />

      {group.scope === 'selected' && (
        <>
          {targets === 0 && <Note tone="warn">This group is empty. Choose at least one category, brand or product, or switch to all products.</Note>}
          <Field label="Categories" hint="Every product in a chosen category belongs to the group.">
            <Chips options={categories.map((c) => ({ id: c.id, label: c.name }))} selected={group.categoryIds} onToggle={(id) => update({ categoryIds: toggleIn(group.categoryIds, id) })} />
          </Field>
          {subcategories.length > 0 && (
            <details className="rounded-xl border px-3 py-2" style={{ borderColor: 'var(--color-border)' }} open={group.subcategoryIds.length > 0}>
              <summary className="text-xs font-semibold cursor-pointer">Subcategories ({group.subcategoryIds.length})</summary>
              <div className="space-y-3 mt-3 pb-1">
                {categories.map((c) => {
                  const subs = subcategories.filter((s) => s.category_id === c.id);
                  if (subs.length === 0) return null;
                  return (
                    <div key={c.id}>
                      <p className="text-[11px] mb-1.5" style={{ color: 'var(--color-muted)' }}>
                        {c.name}
                        {chosenCategories.includes(c) && ' (the whole category is already included)'}
                      </p>
                      <Chips options={subs.map((s) => ({ id: s.id, label: s.name }))} selected={group.subcategoryIds} onToggle={(id) => update({ subcategoryIds: toggleIn(group.subcategoryIds, id) })} />
                    </div>
                  );
                })}
              </div>
            </details>
          )}
          <Field label={`Brands (${group.brands.length})`}>
            {group.brands.length > 0 && (
              <div className="mb-2">
                <Chips options={group.brands.map((b) => ({ id: b, label: `${b} ×` }))} selected={group.brands} onToggle={(b) => update({ brands: group.brands.filter((x) => x !== b) })} />
              </div>
            )}
            <input value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)} placeholder="Search brands…" className="input-luxe" aria-label="Search brands" />
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
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No brand matches.</p>
                )}
              </div>
            )}
          </Field>
          <ProductPicker label="Individual products" selectedIds={group.productIds} onChange={(productIds) => update({ productIds })} known={known} remember={remember} />
        </>
      )}

      <details className="rounded-xl border px-3 py-2" style={{ borderColor: 'var(--color-border)' }} open={group.excludedProductIds.length > 0}>
        <summary className="text-xs font-semibold cursor-pointer">Exclude specific products ({group.excludedProductIds.length})</summary>
        <div className="mt-3 pb-1">
          <ProductPicker
            label="Excluded products"
            hint="Left out of the group even when a category or brand above includes them."
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
  const { value, onChange, meta } = props;
  const limit = meta?.limits.groups ?? GROUP_KEYS.length;
  const nextKey = GROUP_KEYS.find((k) => !value.groups.some((g) => g.key === k));

  return (
    <div className="space-y-6">
      <Note>
        A product group is a set of products the promotion refers to. One group is enough for “20% off skincare”. Use two when what the customer
        <strong> buys </strong> and what gets <strong> discounted </strong> are different products: group A for the products that qualify, group B for the products that receive the reward.
        A cart-wide discount or a gift for reaching a cart total needs no group at all.
      </Note>

      {value.groups.length === 0 && (
        <div className="card-luxe p-8 text-center">
          <p className="font-medium">No product groups</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>This promotion works on the whole cart. Add a group if it should depend on, or discount, particular products.</p>
        </div>
      )}
      {value.groups.map((group, index) => (
        <GroupEditor key={group.key} group={group} index={index} props={props} />
      ))}

      {nextKey && value.groups.length < limit && (
        <button
          type="button"
          onClick={() => onChange({ ...value, groups: [...value.groups, newGroup(nextKey, value.groups.length === 0 ? 'Qualifying products' : value.groups.length === 1 ? 'Reward products' : `Group ${nextKey}`, 'selected')] })}
          className="btn-secondary"
        >
          <FiPlus /> Add a product group
        </button>
      )}
    </div>
  );
}
