/** Promotion Builder, steps 3 to 5: when it applies, what it gives, and how it combines. */
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import type { PromotionCondition, PromotionConfig, PromotionInput, PromotionReward, QuantityMode, RewardType, UnitSelect } from '../../../api/promotionTypes';
import { CONDITION_TYPES, GROUP_KEYS, newCondition, newGroup, newReward, REWARD_TYPES } from './builderModel';
import { Choice, Field, Note, NumberField, Section, SelectField, Toggle } from './builderUi';
import ProductPicker from './ProductPicker';
import type { StepProps } from './StepsSetup';

const UNIT_TYPES: RewardType[] = ['percent_off', 'fixed_off', 'fixed_price', 'tiered_percent'];
const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

/** A unit reward or the buy quantity needs a product group: make the first one when there is none. */
function withGroup(value: PromotionInput): { value: PromotionInput; key: string } {
  if (value.groups[0]) return { value, key: value.groups[0].key };
  return { value: { ...value, groups: [newGroup('A', 'Products on offer')] }, key: 'A' };
}

function useGroupOptions(value: PromotionInput) {
  return value.groups.map((g) => ({ value: g.key, label: `${g.key} · ${g.name || 'Unnamed group'}` }));
}

const MODE_OPTIONS: { value: QuantityMode; label: string; help: string }[] = [
  { value: 'aggregate', label: 'Across the group', help: 'Any mix of products from the group counts: 1 serum + 1 toner = 2.' },
  { value: 'per_product', label: 'Per product', help: 'The quantity must be reached with one product: 2 of the same serum.' },
];

// ---------------------------------------------------------------- step 3

function ConditionRow({ condition, onChange, onRemove, groups }: { condition: PromotionCondition; onChange: (c: PromotionCondition) => void; onRemove: () => void; groups: { value: string; label: string }[] }) {
  const info = CONDITION_TYPES.find((t) => t.type === condition.type)!;
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <SelectField
            label="Condition"
            value={condition.type}
            onChange={(type) => onChange(newCondition(type, 'group' in condition ? condition.group : groups[0]?.value))}
            options={CONDITION_TYPES.filter((t) => groups.length > 0 || !t.type.startsWith('group_')).map((t) => ({ value: t.type, label: t.label }))}
            hint={info.help}
          />
        </div>
        <button type="button" onClick={onRemove} aria-label="Remove condition" className="mt-6 w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors shrink-0">
          <FiTrash2 size={15} />
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        {'group' in condition && <SelectField label="Product group" value={condition.group} onChange={(group) => onChange({ ...condition, group })} options={groups} />}
        {condition.type === 'cart_subtotal' && (
          <>
            <NumberField label="At least" value={condition.min} onChange={(min) => onChange({ ...condition, min: min ?? Number.NaN })} suffix="EGP" step={0.01} />
            <NumberField label="At most (optional)" value={condition.max} onChange={(max) => onChange({ ...condition, max })} suffix="EGP" step={0.01} optional />
          </>
        )}
        {condition.type === 'group_subtotal' && <NumberField label="At least" value={condition.min} onChange={(min) => onChange({ ...condition, min: min ?? Number.NaN })} suffix="EGP" step={0.01} />}
        {(condition.type === 'group_quantity' || condition.type === 'cart_quantity') && (
          <>
            <NumberField label="At least" value={condition.min} onChange={(min) => onChange({ ...condition, min: min ?? Number.NaN })} min={1} max={300} suffix="units" />
            <NumberField label="At most (optional)" value={condition.max} onChange={(max) => onChange({ ...condition, max })} min={1} max={300} suffix="units" optional hint="Above this the promotion no longer applies." />
          </>
        )}
      </div>
      {condition.type === 'group_quantity' && (
        <div className="mt-4">
          <Choice legend="How is the quantity counted?" value={condition.mode} onChange={(mode) => onChange({ ...condition, mode })} options={MODE_OPTIONS} />
        </div>
      )}
    </div>
  );
}

export function ConditionsStep({ value, onChange }: StepProps) {
  const groups = useGroupOptions(value);
  const { config } = value;
  const setConfig = (patch: Partial<PromotionConfig>, base = value) => onChange({ ...base, config: { ...base.config, ...patch } });
  const conditions = config.conditions;
  const setGroups = (next: PromotionConfig['conditions']['groups']) => setConfig({ conditions: { ...conditions, groups: next.filter((g) => g.conditions.length > 0) } });

  return (
    <div className="space-y-6">
      <Section
        title="Buy quantity"
        description="The “buy X” part of an offer. Each time the customer has this many units, the reward is given once, and those units are used up: they cannot earn the reward a second time. Leave it off for a plain discount."
      >
        <Toggle
          label="The customer must buy a quantity to earn the reward"
          checked={config.trigger !== null}
          onChange={(on) => {
            if (!on) return setConfig({ trigger: null, application: { ...config.application, repeat: false, maxApplications: null, qualifierCanBeReward: false } });
            const ready = withGroup(value);
            setConfig({ trigger: { group: ready.key, quantity: 1, mode: 'aggregate' }, application: { ...config.application, repeat: true } }, ready.value);
          }}
        />
        {config.trigger && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <NumberField label="Buy" value={config.trigger.quantity} onChange={(quantity) => setConfig({ trigger: { ...config.trigger!, quantity: quantity ?? Number.NaN } })} min={1} max={100} suffix="units" />
              <SelectField label="From product group" value={config.trigger.group} onChange={(group) => setConfig({ trigger: { ...config.trigger!, group } })} options={groups} hint="The qualifying products. The rewarded products are chosen in the next step and can be a different group." />
            </div>
            <Choice legend="How is the quantity counted?" value={config.trigger.mode} onChange={(mode) => setConfig({ trigger: { ...config.trigger!, mode } })} options={MODE_OPTIONS} />
          </>
        )}
      </Section>

      <Section
        title="Extra conditions"
        description="Checks on the cart that must pass before the promotion applies at all, such as a minimum cart total. They are measured before any promotion discount, and they never use units up."
      >
        {conditions.groups.length === 0 && <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No extra conditions: the promotion applies to every cart{config.trigger ? ' that reaches the buy quantity' : ' with eligible products'}.</p>}

        {conditions.groups.length > 1 && (
          <Choice
            legend="Between the condition sets below"
            value={conditions.match}
            onChange={(match) => setConfig({ conditions: { ...conditions, match } })}
            options={[
              { value: 'all', label: 'All sets must pass', help: 'Set 1 AND set 2.' },
              { value: 'any', label: 'Any one set is enough', help: 'Set 1 OR set 2.' },
            ]}
          />
        )}

        {conditions.groups.map((group, gi) => (
          <div key={gi} className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: 'var(--color-bg)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{conditions.groups.length > 1 ? `Condition set ${gi + 1}` : 'Conditions'}</p>
              {group.conditions.length > 1 && (
                <div className="flex gap-1.5" role="group" aria-label="How the conditions in this set combine">
                  {(['all', 'any'] as const).map((match) => (
                    <button
                      type="button"
                      key={match}
                      aria-pressed={group.match === match}
                      onClick={() => setGroups(conditions.groups.map((g, i) => (i === gi ? { ...g, match } : g)))}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border"
                      style={{ borderColor: 'var(--color-coffee)', backgroundColor: group.match === match ? 'var(--color-coffee)' : '#fff', color: group.match === match ? '#fff' : 'var(--color-coffee)' }}
                    >
                      {match === 'all' ? 'ALL must pass' : 'ANY is enough'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {group.conditions.map((condition, ci) => (
              <ConditionRow
                key={ci}
                condition={condition}
                groups={groups}
                onChange={(next) => setGroups(conditions.groups.map((g, i) => (i === gi ? { ...g, conditions: g.conditions.map((c, j) => (j === ci ? next : c)) } : g)))}
                onRemove={() => setGroups(conditions.groups.map((g, i) => (i === gi ? { ...g, conditions: g.conditions.filter((_, j) => j !== ci) } : g)))}
              />
            ))}
            <button
              type="button"
              onClick={() => setGroups(conditions.groups.map((g, i) => (i === gi ? { ...g, conditions: [...g.conditions, newCondition('cart_subtotal')] } : g)))}
              disabled={group.conditions.length >= 8}
              className="text-xs font-semibold inline-flex items-center gap-1.5 hover:text-[var(--color-gold)] disabled:opacity-40"
            >
              <FiPlus /> Add a condition to this set
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setConfig({ conditions: { ...conditions, groups: [...conditions.groups, { match: 'all', conditions: [newCondition('cart_subtotal')] }] } })}
          disabled={conditions.groups.length >= 4}
          className="btn-secondary disabled:opacity-40"
        >
          <FiPlus /> {conditions.groups.length === 0 ? 'Add a condition' : 'Add another condition set'}
        </button>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------- step 4

const SELECT_OPTIONS: { value: UnitSelect; label: string }[] = [
  { value: 'cheapest', label: 'The lowest-priced units first' },
  { value: 'most_expensive', label: 'The highest-priced units first' },
];

/** "How many units get it": a number, or every eligible unit. */
function UnitsField({ units, onChange, hasTrigger }: { units: number | null; onChange: (units: number | null) => void; hasTrigger: boolean }) {
  return (
    <div className="space-y-3">
      <Toggle
        label={hasTrigger ? 'Reward every other eligible unit' : 'Apply to every eligible unit'}
        help={hasTrigger ? 'Off: a set number of units is rewarded each time the buy quantity is met (the “get Y”).' : 'Off: only a set number of units is discounted.'}
        checked={units === null}
        onChange={(all) => onChange(all ? null : 1)}
      />
      {units !== null && <NumberField label={hasTrigger ? 'Get (units rewarded each time)' : 'Units discounted'} value={units} onChange={(n) => onChange(n ?? Number.NaN)} min={1} max={100} suffix="units" />}
    </div>
  );
}

function RewardEditor({ reward, index, props }: { reward: PromotionReward; index: number; props: StepProps }) {
  const { value, onChange, known, remember, meta } = props;
  const groups = useGroupOptions(value);
  const info = REWARD_TYPES.find((t) => t.type === reward.type)!;
  const hasTrigger = value.config.trigger !== null;
  const replace = (next: PromotionReward, base = value) => onChange({ ...base, config: { ...base.config, rewards: base.config.rewards.map((r, i) => (i === index ? next : r)) } });
  const remove = () => onChange({ ...value, config: { ...value.config, rewards: value.config.rewards.filter((_, i) => i !== index) } });

  const changeType = (type: RewardType) => {
    if (!UNIT_TYPES.includes(type)) return replace(newReward(type));
    const ready = withGroup(value);
    const fresh = newReward(type, 'group' in reward ? reward.group : ready.key);
    // With a buy quantity, "get 1" is the usual meaning; without one, every eligible unit.
    replace(hasTrigger && 'units' in fresh ? { ...fresh, units: 1 } : fresh, ready.value);
  };

  return (
    <Section
      title={`Reward ${index + 1}`}
      description={`${info.help} Example: ${info.example}.`}
      aside={
        value.config.rewards.length > 1 ? (
          <button type="button" onClick={remove} aria-label={`Remove reward ${index + 1}`} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors">
            <FiTrash2 size={15} />
          </button>
        ) : undefined
      }
    >
      <Field label="Type of reward">
        <select value={reward.type} onChange={(e) => changeType(e.target.value as RewardType)} className="input-luxe" aria-label="Type of reward">
          {(['Products', 'Gift', 'Cart'] as const).map((level) => (
            <optgroup key={level} label={level === 'Products' ? 'On products' : level === 'Gift' ? 'Gifts' : 'On the whole cart'}>
              {REWARD_TYPES.filter((t) => t.level === level).map((t) => (
                <option key={t.type} value={t.type}>{t.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>

      {reward.type === 'percent_off' && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <NumberField label="Discount" value={reward.percent} onChange={(percent) => replace({ ...reward, percent: percent ?? Number.NaN })} min={0.01} max={100} step={0.01} suffix="%" hint="100% makes the rewarded units free." />
            <SelectField label="Rewarded products" value={reward.group} onChange={(group) => replace({ ...reward, group })} options={groups} hint={hasTrigger ? 'Can be the same group the customer buys from, or a different one.' : undefined} />
          </div>
          <UnitsField units={reward.units} onChange={(units) => replace({ ...reward, units })} hasTrigger={hasTrigger} />
          {reward.units !== null && <SelectField label="Which units get the discount?" value={reward.select} onChange={(select) => replace({ ...reward, select })} options={SELECT_OPTIONS} />}
        </>
      )}

      {reward.type === 'fixed_off' && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <NumberField label="Amount off" value={reward.amount} onChange={(amount) => replace({ ...reward, amount: amount ?? Number.NaN })} min={0.01} step={0.01} suffix="EGP" />
            <SelectField label="Rewarded products" value={reward.group} onChange={(group) => replace({ ...reward, group })} options={groups} />
          </div>
          <Choice
            legend="How is the amount applied?"
            value={reward.per}
            onChange={(per) => replace({ ...reward, per })}
            options={[
              { value: 'unit', label: 'Off each unit', help: '50 EGP off every rewarded unit.' },
              { value: 'total', label: 'Once, shared', help: '50 EGP in total, spread over the rewarded units by price.' },
            ]}
          />
          <UnitsField units={reward.units} onChange={(units) => replace({ ...reward, units })} hasTrigger={hasTrigger} />
          {reward.units !== null && <SelectField label="Which units get the discount?" value={reward.select} onChange={(select) => replace({ ...reward, select })} options={SELECT_OPTIONS} />}
          <Note>A unit is never discounted below 0: an amount larger than the price simply makes it free.</Note>
        </>
      )}

      {reward.type === 'fixed_price' && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <NumberField label="Promotional price per unit" value={reward.price} onChange={(price) => replace({ ...reward, price: price ?? Number.NaN })} min={0} step={0.01} suffix="EGP" hint="Units already cheaper than this keep their own price." />
            <SelectField label="Rewarded products" value={reward.group} onChange={(group) => replace({ ...reward, group })} options={groups} />
          </div>
          <UnitsField units={reward.units} onChange={(units) => replace({ ...reward, units })} hasTrigger={hasTrigger} />
        </>
      )}

      {reward.type === 'tiered_percent' && (
        <>
          <SelectField label="Products" value={reward.group} onChange={(group) => replace({ ...reward, group })} options={groups} />
          <Field label="Discount for each unit" hint="0% means that unit is paid in full.">
            <div className="space-y-2">
              {reward.tiers.map((tier, ti) => (
                <div key={ti} className="flex items-center gap-3">
                  <span className="text-sm font-semibold w-20 shrink-0">{ORDINALS[ti]} unit</span>
                  <div className="relative flex-1 max-w-[11rem]">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={Number.isNaN(tier.percent) ? '' : tier.percent}
                      onChange={(e) => replace({ ...reward, tiers: reward.tiers.map((t, j) => (j === ti ? { percent: e.target.value === '' ? Number.NaN : Number(e.target.value) } : t)) })}
                      className="input-luxe input-with-suffix"
                      aria-label={`Discount for the ${ORDINALS[ti]} unit, in percent`}
                    />
                    <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>%</span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{tier.percent === 0 ? 'full price' : tier.percent >= 100 ? 'free' : `${tier.percent}% off`}</span>
                  {reward.tiers.length > 2 && ti === reward.tiers.length - 1 && (
                    <button type="button" onClick={() => replace({ ...reward, tiers: reward.tiers.slice(0, -1) })} aria-label="Remove the last unit" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-600">
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => replace({ ...reward, tiers: [...reward.tiers, { percent: reward.tiers[reward.tiers.length - 1]?.percent ?? 0 }] })}
              disabled={reward.tiers.length >= (meta?.limits.tiers ?? 10)}
              className="text-xs font-semibold inline-flex items-center gap-1.5 mt-3 hover:text-[var(--color-gold)] disabled:opacity-40"
            >
              <FiPlus /> Add the {ORDINALS[reward.tiers.length]} unit
            </button>
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <SelectField
              label={`From the ${ORDINALS[reward.tiers.length]} unit on`}
              value={reward.beyond}
              onChange={(beyond) => replace({ ...reward, beyond })}
              options={[
                { value: 'repeat', label: 'Start again from the 1st unit' },
                { value: 'last', label: 'Keep the last discount' },
                { value: 'none', label: 'Full price' },
              ]}
            />
            <SelectField
              label="Which unit counts as the 1st?"
              value={reward.order}
              onChange={(order) => replace({ ...reward, order })}
              options={[
                { value: 'price_desc', label: 'The most expensive (cheaper units get the discounts)' },
                { value: 'price_asc', label: 'The cheapest (pricier units get the discounts)' },
              ]}
            />
          </div>
          <Choice
            legend="Units are counted"
            value={reward.scope}
            onChange={(scope) => replace({ ...reward, scope })}
            options={[
              { value: 'group', label: 'Across the group', help: 'A serum and a toner are the 1st and 2nd unit.' },
              { value: 'per_product', label: 'Per product', help: 'Each product has its own 1st, 2nd, 3rd unit.' },
            ]}
          />
        </>
      )}

      {reward.type === 'gift' && (
        <>
          <ProductPicker
            label="Gift products"
            hint="Each one is added to the cart for free. Hidden products can be gifts too."
            selectedIds={reward.items.map((item) => item.productId)}
            onChange={(ids) => replace({ ...reward, items: ids.map((productId) => reward.items.find((item) => item.productId === productId) ?? { productId, quantity: 1 }) })}
            known={known}
            remember={remember}
            max={meta?.limits.giftItems ?? 5}
            showStock
            rowExtra={(productId) => (
              <label className="flex items-center gap-1.5 text-xs shrink-0">
                Qty
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={reward.items.find((item) => item.productId === productId)?.quantity ?? 1}
                  onChange={(e) => replace({ ...reward, items: reward.items.map((item) => (item.productId === productId ? { ...item, quantity: Math.min(Math.max(Number(e.target.value) || 1, 1), 10) } : item)) })}
                  className="w-14 px-2 py-1 rounded-lg border bg-white text-sm"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              </label>
            )}
          />
          <Toggle
            label="Only while the gift is in stock"
            help="On: when the gift runs out, customers are told it is unavailable and are not promised it. Off: the gift is always added, even at zero stock."
            checked={reward.requireStock}
            onChange={(requireStock) => replace({ ...reward, requireStock })}
          />
        </>
      )}

      {reward.type === 'gift_choice' && (
        <>
          <Choice
            legend="Gifts to choose from"
            value={reward.fromGroup === null ? 'list' : 'group'}
            onChange={(source) => {
              if (source === 'list') return replace({ ...reward, fromGroup: null, maxValue: null });
              // The gifts need a group of their own: never one the promotion buys from or discounts.
              const taken = new Set<string>([...(value.config.trigger ? [value.config.trigger.group] : []), ...value.config.rewards.flatMap((r) => ('group' in r ? [r.group] : []))]);
              const free = value.groups.find((g) => !taken.has(g.key));
              const key = free?.key ?? GROUP_KEYS.find((k) => !value.groups.some((g) => g.key === k));
              if (!key) return;
              const base = free ? value : { ...value, groups: [...value.groups, newGroup(key, 'Gifts to choose from', 'selected')] };
              replace({ ...reward, options: [], fromGroup: key }, base);
            }}
            options={[
              { value: 'list', label: 'Products I pick', help: `A fixed list of up to ${meta?.limits.giftOptions ?? 12} products.` },
              { value: 'group', label: 'A category, subcategory or brand', help: 'Every product in a product group. New products in it become gifts automatically.' },
            ]}
          />

          {reward.fromGroup === null ? (
            <ProductPicker
              label="Gift products"
              hint="The customer picks in the cart or at checkout. Nothing is added until they choose."
              selectedIds={reward.options}
              onChange={(options) => replace({ ...reward, options })}
              known={known}
              remember={remember}
              max={meta?.limits.giftOptions ?? 12}
              showStock
            />
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <SelectField
                  label="Product group"
                  value={reward.fromGroup}
                  onChange={(fromGroup) => replace({ ...reward, fromGroup })}
                  options={groups}
                  hint="Choose its categories, subcategories or brands in step 2 (Products)."
                />
                <NumberField
                  label="Only gifts worth up to (optional)"
                  value={reward.maxValue}
                  onChange={(maxValue) => replace({ ...reward, maxValue })}
                  min={0.01}
                  step={0.01}
                  suffix="EGP"
                  optional
                  placeholder="Any price"
                  hint="Keeps expensive products in the group from being given away."
                />
              </div>
              {(() => {
                const group = value.groups.find((g) => g.key === reward.fromGroup);
                const empty = group?.scope === 'selected' && group.productIds.length + group.categoryIds.length + group.subcategoryIds.length + group.brands.length === 0;
                return (
                  <Note tone={empty || group?.scope === 'all' ? 'warn' : 'info'}>
                    {empty
                      ? `“${group?.name}” is still empty. Go to step 2 (Products) and choose the category or subcategory whose products can be gifts.`
                      : group?.scope === 'all'
                        ? `“${group?.name}” is every product in the store. Set a maximum value, or narrow the group in step 2.`
                        : 'Customers are offered the visible products of this group, and nothing is added until they choose.'}{' '}
                    At most {meta?.limits.giftGroupOptions ?? 48} are offered at a time: those in stock first, then the cheapest. For a large category, a subcategory or a maximum value keeps the choice manageable.
                  </Note>
                );
              })()}
            </>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <NumberField label="How many may the customer pick?" value={reward.choose} onChange={(choose) => replace({ ...reward, choose: choose ?? Number.NaN })} min={1} max={3} suffix="gifts" />
          </div>
          <Toggle label="Only offer gifts that are in stock" help="Out-of-stock gifts are shown as unavailable and cannot be picked." checked={reward.requireStock} onChange={(requireStock) => replace({ ...reward, requireStock })} />
        </>
      )}

      {reward.type === 'order_percent_off' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <NumberField label="Discount on the cart" value={reward.percent} onChange={(percent) => replace({ ...reward, percent: percent ?? Number.NaN })} min={0.01} max={100} step={0.01} suffix="%" hint="Taken off what is left after the product offers, and spread over the items." />
        </div>
      )}
      {reward.type === 'order_fixed_off' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <NumberField label="Amount off the cart" value={reward.amount} onChange={(amount) => replace({ ...reward, amount: amount ?? Number.NaN })} min={0.01} step={0.01} suffix="EGP" hint="Never more than the cart is worth. Delivery is not discounted." />
        </div>
      )}
    </Section>
  );
}

export function RewardsStep(props: StepProps) {
  const { value, onChange, meta } = props;
  const trigger = value.config.trigger;
  const buyGroup = trigger ? value.groups.find((g) => g.key === trigger.group) : undefined;
  const limit = meta?.limits.rewards ?? 5;

  return (
    <div className="space-y-6">
      <Note>
        {trigger ? (
          <>
            Qualifying products: the customer buys <strong>{trigger.quantity}</strong> from <strong>{buyGroup?.name ?? trigger.group}</strong>
            {trigger.mode === 'per_product' ? ' (of the same product)' : ''}. Rewarded products are chosen below, per reward: the same group, or a different one.
          </>
        ) : (
          <>There is no buy quantity, so each reward applies once to the eligible products in the cart. For “buy X get Y”, turn on the buy quantity in the previous step.</>
        )}
      </Note>

      {value.config.rewards.map((reward, index) => (
        <RewardEditor key={index} reward={reward} index={index} props={props} />
      ))}

      <button
        type="button"
        onClick={() => onChange({ ...value, config: { ...value.config, rewards: [...value.config.rewards, newReward('gift')] } })}
        disabled={value.config.rewards.length >= limit}
        className="btn-secondary disabled:opacity-40"
      >
        <FiPlus /> Add another reward
      </button>
      {value.config.rewards.length > 1 && <p className="text-xs" style={{ color: 'var(--color-muted)' }}>The customer receives all of these rewards together, for example a discount and a gift.</p>}
    </div>
  );
}

// ---------------------------------------------------------------- step 5

export function RulesStep({ value, onChange, meta }: StepProps) {
  const { config } = value;
  const app = config.application;
  const set = (patch: Partial<PromotionInput>) => onChange({ ...value, ...patch });
  const setApp = (patch: Partial<PromotionConfig['application']>) => onChange({ ...value, config: { ...config, application: { ...app, ...patch } } });
  const hasTrigger = config.trigger !== null;
  const existing = meta?.stackGroups ?? [];
  const sharing = value.stackGroup ? existing.find((g) => g.name.toLowerCase() === value.stackGroup!.name.trim().toLowerCase()) : undefined;

  return (
    <div className="space-y-6">
      <Section title="Repeating" description="What happens when a customer qualifies more than once in the same order.">
        {hasTrigger ? (
          <>
            <Toggle
              label="Apply again each time the buy quantity is reached"
              help={`On: with “buy ${config.trigger!.quantity}”, a cart that qualifies three times gets the reward three times. Off: once per order.`}
              checked={app.repeat}
              onChange={(repeat) => setApp({ repeat, maxApplications: repeat ? app.maxApplications : null })}
            />
            {app.repeat && (
              <div className="grid sm:grid-cols-2 gap-4">
                <NumberField label="Maximum times per order" value={app.maxApplications} onChange={(maxApplications) => setApp({ maxApplications })} min={1} max={100} optional />
              </div>
            )}
            <Toggle
              label="A unit that counts as “bought” may also receive the reward"
              help="Off (usual): buy 2 get 1 free needs 3 units. On: for offers like “buy 3, get 10% off all 3”, where the bought units are the discounted ones."
              checked={app.qualifierCanBeReward}
              onChange={(qualifierCanBeReward) => setApp({ qualifierCanBeReward })}
            />
          </>
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>This promotion has no buy quantity, so it applies once per order.</p>
        )}
      </Section>

      <Section title="Limits" description="Leave a field empty for no limit.">
        <div className="grid sm:grid-cols-3 gap-4">
          <NumberField label="Maximum discount per order" value={app.maxDiscount} onChange={(maxDiscount) => setApp({ maxDiscount })} min={0.01} step={0.01} suffix="EGP" optional />
          <NumberField label="Total uses" value={value.usageLimitTotal} onChange={(usageLimitTotal) => set({ usageLimitTotal })} min={1} suffix="orders" optional hint="Across all customers." />
          <NumberField label="Uses per customer" value={value.usageLimitPerCustomer} onChange={(usageLimitPerCustomer) => set({ usageLimitPerCustomer })} min={1} suffix="orders" optional />
        </div>
        <Note>
          Customers check out as guests, so a customer is recognised by phone number. A cancelled order gives its use back. Limits are enforced when the order is placed, even if many customers order at the same moment.
        </Note>
      </Section>

      <Section title="Combining with other offers" description="Promotions run in a fixed order: product offers first, cart discounts after; within each, the highest priority first, then the oldest promotion.">
        <div className="grid sm:grid-cols-2 gap-4">
          <NumberField label="Priority" value={value.priority} onChange={(priority) => set({ priority: priority ?? 0 })} min={-1000} max={1000} hint="Higher runs first. 0 is the default." />
        </div>
        <Toggle
          label="Can be combined with other promotions"
          help="Off: the items this promotion uses are kept out of every other promotion, and it only uses items no other promotion has used."
          checked={value.isCombinable}
          onChange={(isCombinable) => set({ isCombinable })}
        />
        <Toggle
          label="Can be combined with coupon codes"
          help="Off: when a customer enters a coupon, they get whichever saves them more, this promotion or the coupon, never both."
          checked={value.combinesWithCoupons}
          onChange={(combinesWithCoupons) => set({ combinesWithCoupons })}
        />
        <Toggle
          label="Applies to items that are already discounted"
          help="Off: items an earlier promotion already discounted are left out of this one entirely."
          checked={app.applyToDiscounted}
          onChange={(applyToDiscounted) => setApp({ applyToDiscounted })}
        />
      </Section>

      <Section title="Exclusive group" description="Put competing promotions in the same group and only one of them applies to an order.">
        <Toggle label="This promotion belongs to an exclusive group" checked={value.stackGroup !== null} onChange={(on) => set({ stackGroup: on ? { name: existing[0]?.name ?? '', policy: existing[0]?.policy ?? 'priority' } : null })} />
        {value.stackGroup && (
          <>
            <Field label="Group name" hint="Type a new name, or pick an existing group.">
              <input
                value={value.stackGroup.name}
                onChange={(e) => {
                  const match = existing.find((g) => g.name.toLowerCase() === e.target.value.trim().toLowerCase());
                  set({ stackGroup: { name: e.target.value, policy: match?.policy ?? value.stackGroup!.policy } });
                }}
                list="promotion-stack-groups"
                maxLength={80}
                placeholder="e.g. Summer campaigns"
                className="input-luxe"
                aria-label="Exclusive group name"
              />
              <datalist id="promotion-stack-groups">
                {existing.map((g) => <option key={g.id} value={g.name} />)}
              </datalist>
            </Field>
            <Choice
              legend="Which promotion in the group wins?"
              value={value.stackGroup.policy}
              onChange={(policy) => set({ stackGroup: { ...value.stackGroup!, policy } })}
              options={[
                { value: 'priority', label: 'The first that applies', help: 'By priority, then age. Predictable: the saving is not compared.' },
                { value: 'best_discount', label: 'The one that saves the customer most', help: 'Every member is tried; the largest saving wins. A tie goes to the higher priority.' },
              ]}
            />
            {sharing && sharing.members > 0 && (
              <Note tone="warn">
                “{sharing.name}” already has {sharing.members} promotion{sharing.members === 1 ? '' : 's'}. This rule belongs to the group: saving changes it for all of them.
              </Note>
            )}
          </>
        )}
      </Section>
    </div>
  );
}
