/** Promotion Builder, steps 3 to 5: when it applies, what it gives, and how it combines. */
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import type { PromotionCondition, PromotionConfig, PromotionInput, PromotionReward, QuantityMode, RewardType, UnitSelect } from '../../../api/promotionTypes';
import { CONDITION_TYPES, GROUP_KEYS, newCondition, newGroup, newReward, REWARD_TYPES } from './builderModel';
import { Choice, Field, Note, NumberField, Section, SelectField, Toggle } from './builderUi';
import ProductPicker from './ProductPicker';
import type { StepProps } from './StepsSetup';

const UNIT_TYPES: RewardType[] = ['percent_off', 'fixed_off', 'fixed_price', 'tiered_percent'];

/** A unit reward or the buy quantity needs a product group: make the first one when there is none. */
function withGroup(value: PromotionInput, groupName: string): { value: PromotionInput; key: string } {
  if (value.groups[0]) return { value, key: value.groups[0].key };
  return { value: { ...value, groups: [newGroup('A', groupName)] }, key: 'A' };
}

function useGroupOptions(value: PromotionInput) {
  return value.groups.map((g) => ({ value: g.key, label: `${g.key} · ${g.name || 'Unnamed group'}` }));
}

const MODE_OPTIONS: QuantityMode[] = ['aggregate', 'per_product'];

// ---------------------------------------------------------------- step 3

function ConditionRow({ condition, onChange, onRemove, groups }: { condition: PromotionCondition; onChange: (c: PromotionCondition) => void; onRemove: () => void; groups: { value: string; label: string }[] }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <SelectField
            label={t('adminPromotionBuilder.conditions.condition')}
            value={condition.type}
            onChange={(type) => onChange(newCondition(type, 'group' in condition ? condition.group : groups[0]?.value))}
            options={CONDITION_TYPES.filter((conditionType) => groups.length > 0 || !conditionType.type.startsWith('group_')).map((conditionType) => ({ value: conditionType.type, label: t(`adminPromotionBuilder.conditions.types.${conditionType.type}.label`) }))}
            hint={t(`adminPromotionBuilder.conditions.types.${condition.type}.help`)}
          />
        </div>
        <button type="button" onClick={onRemove} aria-label={t('adminPromotionBuilder.conditions.removeCondition')} className="mt-6 w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors shrink-0">
          <FiTrash2 size={15} />
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        {'group' in condition && <SelectField label={t('adminPromotionBuilder.conditions.productGroup')} value={condition.group} onChange={(group) => onChange({ ...condition, group })} options={groups} />}
        {condition.type === 'cart_subtotal' && (
          <>
            <NumberField label={t('adminPromotionBuilder.conditions.atLeast')} value={condition.min} onChange={(min) => onChange({ ...condition, min: min ?? Number.NaN })} suffix="EGP" step={0.01} />
            <NumberField label={t('adminPromotionBuilder.conditions.atMostOptional')} value={condition.max} onChange={(max) => onChange({ ...condition, max })} suffix="EGP" step={0.01} optional />
          </>
        )}
        {condition.type === 'group_subtotal' && <NumberField label={t('adminPromotionBuilder.conditions.atLeast')} value={condition.min} onChange={(min) => onChange({ ...condition, min: min ?? Number.NaN })} suffix="EGP" step={0.01} />}
        {(condition.type === 'group_quantity' || condition.type === 'cart_quantity') && (
          <>
            <NumberField label={t('adminPromotionBuilder.conditions.atLeast')} value={condition.min} onChange={(min) => onChange({ ...condition, min: min ?? Number.NaN })} min={1} max={300} suffix={t('adminPromotionBuilder.units')} />
            <NumberField label={t('adminPromotionBuilder.conditions.atMostOptional')} value={condition.max} onChange={(max) => onChange({ ...condition, max })} min={1} max={300} suffix={t('adminPromotionBuilder.units')} optional hint={t('adminPromotionBuilder.conditions.atMostHint')} />
          </>
        )}
      </div>
      {condition.type === 'group_quantity' && (
        <div className="mt-4">
          <Choice legend={t('adminPromotionBuilder.conditions.quantityMode')} value={condition.mode} onChange={(mode) => onChange({ ...condition, mode })} options={MODE_OPTIONS.map((mode) => ({ value: mode, label: t(`adminPromotionBuilder.quantityModes.${mode}.label`), help: t(`adminPromotionBuilder.quantityModes.${mode}.help`) }))} />
        </div>
      )}
    </div>
  );
}

export function ConditionsStep({ value, onChange }: StepProps) {
  const { t } = useTranslation();
  const groups = useGroupOptions(value);
  const { config } = value;
  const setConfig = (patch: Partial<PromotionConfig>, base = value) => onChange({ ...base, config: { ...base.config, ...patch } });
  const conditions = config.conditions;
  const setGroups = (next: PromotionConfig['conditions']['groups']) => setConfig({ conditions: { ...conditions, groups: next.filter((g) => g.conditions.length > 0) } });

  return (
    <div className="space-y-6">
      <Section
        title={t('adminPromotionBuilder.conditions.buyQuantityTitle')}
        description={t('adminPromotionBuilder.conditions.buyQuantityDescription')}
      >
        <Toggle
          label={t('adminPromotionBuilder.conditions.requireBuyQuantity')}
          checked={config.trigger !== null}
          onChange={(on) => {
            if (!on) return setConfig({ trigger: null, application: { ...config.application, repeat: false, maxApplications: null, qualifierCanBeReward: false } });
            const ready = withGroup(value, t('adminPromotionBuilder.products.qualifyingProducts'));
            setConfig({ trigger: { group: ready.key, quantity: 1, mode: 'aggregate' }, application: { ...config.application, repeat: true } }, ready.value);
          }}
        />
        {config.trigger && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <NumberField label={t('adminPromotionBuilder.conditions.buy')} value={config.trigger.quantity} onChange={(quantity) => setConfig({ trigger: { ...config.trigger!, quantity: quantity ?? Number.NaN } })} min={1} max={100} suffix={t('adminPromotionBuilder.units')} />
              <SelectField label={t('adminPromotionBuilder.conditions.fromProductGroup')} value={config.trigger.group} onChange={(group) => setConfig({ trigger: { ...config.trigger!, group } })} options={groups} hint={t('adminPromotionBuilder.conditions.qualifyingProductsHint')} />
            </div>
            <Choice legend={t('adminPromotionBuilder.conditions.quantityMode')} value={config.trigger.mode} onChange={(mode) => setConfig({ trigger: { ...config.trigger!, mode } })} options={MODE_OPTIONS.map((mode) => ({ value: mode, label: t(`adminPromotionBuilder.quantityModes.${mode}.label`), help: t(`adminPromotionBuilder.quantityModes.${mode}.help`) }))} />
          </>
        )}
      </Section>

      <Section
        title={t('adminPromotionBuilder.conditions.extraConditionsTitle')}
        description={t('adminPromotionBuilder.conditions.extraConditionsDescription')}
      >
        {conditions.groups.length === 0 && <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{t(config.trigger ? 'adminPromotionBuilder.conditions.noConditionsWithTrigger' : 'adminPromotionBuilder.conditions.noConditions')}</p>}

        {conditions.groups.length > 1 && (
          <Choice
            legend={t('adminPromotionBuilder.conditions.betweenSets')}
            value={conditions.match}
            onChange={(match) => setConfig({ conditions: { ...conditions, match } })}
            options={[
              { value: 'all', label: t('adminPromotionBuilder.conditions.allSets'), help: t('adminPromotionBuilder.conditions.allSetsHelp') },
              { value: 'any', label: t('adminPromotionBuilder.conditions.anySet'), help: t('adminPromotionBuilder.conditions.anySetHelp') },
            ]}
          />
        )}

        {conditions.groups.map((group, gi) => (
          <div key={gi} className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: 'var(--color-bg)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{conditions.groups.length > 1 ? t('adminPromotionBuilder.conditions.conditionSet', { count: gi + 1 }) : t('adminPromotionBuilder.conditions.conditions')}</p>
              {group.conditions.length > 1 && (
                <div className="flex gap-1.5" role="group" aria-label={t('adminPromotionBuilder.conditions.combineConditions')}>
                  {(['all', 'any'] as const).map((match) => (
                    <button
                      type="button"
                      key={match}
                      aria-pressed={group.match === match}
                      onClick={() => setGroups(conditions.groups.map((g, i) => (i === gi ? { ...g, match } : g)))}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border"
                      style={{ borderColor: 'var(--color-coffee)', backgroundColor: group.match === match ? 'var(--color-coffee)' : '#fff', color: group.match === match ? '#fff' : 'var(--color-coffee)' }}
                    >
                      {t(match === 'all' ? 'adminPromotionBuilder.conditions.allMustPass' : 'adminPromotionBuilder.conditions.anyIsEnough')}
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
              <FiPlus /> {t('adminPromotionBuilder.conditions.addConditionToSet')}
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setConfig({ conditions: { ...conditions, groups: [...conditions.groups, { match: 'all', conditions: [newCondition('cart_subtotal')] }] } })}
          disabled={conditions.groups.length >= 4}
          className="btn-secondary disabled:opacity-40"
        >
          <FiPlus /> {t(conditions.groups.length === 0 ? 'adminPromotionBuilder.conditions.addCondition' : 'adminPromotionBuilder.conditions.addConditionSet')}
        </button>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------- step 4

const SELECT_OPTIONS = ['cheapest', 'most_expensive'] as const satisfies readonly UnitSelect[];

/** "How many units get it": a number, or every eligible unit. */
function UnitsField({ units, onChange, hasTrigger }: { units: number | null; onChange: (units: number | null) => void; hasTrigger: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <Toggle
        label={t(hasTrigger ? 'adminPromotionBuilder.rewards.everyOtherUnit' : 'adminPromotionBuilder.rewards.everyEligibleUnit')}
        help={t(hasTrigger ? 'adminPromotionBuilder.rewards.everyOtherUnitHelp' : 'adminPromotionBuilder.restrictUnitsHelp')}
        checked={units === null}
        onChange={(all) => onChange(all ? null : 1)}
      />
      {units !== null && <NumberField label={t(hasTrigger ? 'adminPromotionBuilder.rewards.getUnits' : 'adminPromotionBuilder.rewards.unitsDiscounted')} value={units} onChange={(n) => onChange(n ?? Number.NaN)} min={1} max={100} suffix={t('adminPromotionBuilder.units')} />}
    </div>
  );
}

function RewardEditor({ reward, index, props }: { reward: PromotionReward; index: number; props: StepProps }) {
  const { t } = useTranslation();
  const { value, onChange, known, remember, meta } = props;
  const groups = useGroupOptions(value);
  const hasTrigger = value.config.trigger !== null;
  const replace = (next: PromotionReward, base = value) => onChange({ ...base, config: { ...base.config, rewards: base.config.rewards.map((r, i) => (i === index ? next : r)) } });
  const remove = () => onChange({ ...value, config: { ...value.config, rewards: value.config.rewards.filter((_, i) => i !== index) } });

  const changeType = (type: RewardType) => {
    if (!UNIT_TYPES.includes(type)) return replace(newReward(type));
    const ready = withGroup(value, t('adminPromotionBuilder.products.qualifyingProducts'));
    const fresh = newReward(type, 'group' in reward ? reward.group : ready.key);
    // With a buy quantity, "get 1" is the usual meaning; without one, every eligible unit.
    replace(hasTrigger && 'units' in fresh ? { ...fresh, units: 1 } : fresh, ready.value);
  };

  return (
    <Section
      title={t('adminPromotionBuilder.rewards.rewardTitle', { count: index + 1 })}
      description={t('adminPromotionBuilder.rewards.rewardDescription', { help: t(`adminPromotionBuilder.rewardTypes.${reward.type}.help`), example: t(`adminPromotionBuilder.rewardTypes.${reward.type}.example`) })}
      aside={
        value.config.rewards.length > 1 ? (
          <button type="button" onClick={remove} aria-label={t('adminPromotionBuilder.rewards.removeReward', { count: index + 1 })} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors">
            <FiTrash2 size={15} />
          </button>
        ) : undefined
      }
    >
      <Field label={t('adminPromotionBuilder.rewards.type')}>
        <select value={reward.type} onChange={(e) => changeType(e.target.value as RewardType)} className="input-luxe" aria-label={t('adminPromotionBuilder.rewards.type')}>
          {(['Products', 'Gift', 'Cart'] as const).map((level) => (
            <optgroup key={level} label={t(`adminPromotionBuilder.rewards.levels.${level}`)}>
              {REWARD_TYPES.filter((typeOption) => typeOption.level === level).map((typeOption) => (
                <option key={typeOption.type} value={typeOption.type}>{t(`adminPromotionBuilder.rewardTypes.${typeOption.type}.label`)}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>

      {reward.type === 'percent_off' && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <NumberField label={t('adminPromotionBuilder.rewards.discount')} value={reward.percent} onChange={(percent) => replace({ ...reward, percent: percent ?? Number.NaN })} min={0.01} max={100} step={0.01} suffix="%" hint={t('adminPromotionBuilder.rewards.fullPercentHint')} />
            <SelectField label={t('adminPromotionBuilder.rewards.rewardedProducts')} value={reward.group} onChange={(group) => replace({ ...reward, group })} options={groups} hint={hasTrigger ? t('adminPromotionBuilder.rewards.rewardGroupHint') : undefined} />
          </div>
          <UnitsField units={reward.units} onChange={(units) => replace({ ...reward, units })} hasTrigger={hasTrigger} />
          {reward.units !== null && <SelectField label={t('adminPromotionBuilder.rewards.whichUnits')} value={reward.select} onChange={(select) => replace({ ...reward, select })} options={SELECT_OPTIONS.map((option) => ({ value: option, label: t(`adminPromotionBuilder.rewards.unitSelection.${option}`) }))} />}
        </>
      )}

      {reward.type === 'fixed_off' && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <NumberField label={t('adminPromotionBuilder.rewards.amountOff')} value={reward.amount} onChange={(amount) => replace({ ...reward, amount: amount ?? Number.NaN })} min={0.01} step={0.01} suffix="EGP" />
            <SelectField label={t('adminPromotionBuilder.rewards.rewardedProducts')} value={reward.group} onChange={(group) => replace({ ...reward, group })} options={groups} />
          </div>
          <Choice
            legend={t('adminPromotionBuilder.rewards.amountMode')}
            value={reward.per}
            onChange={(per) => replace({ ...reward, per })}
            options={[
              { value: 'unit', label: t('adminPromotionBuilder.rewards.amountPerUnit'), help: t('adminPromotionBuilder.rewards.amountPerUnitHelp') },
              { value: 'total', label: t('adminPromotionBuilder.rewards.amountShared'), help: t('adminPromotionBuilder.rewards.amountSharedHelp') },
            ]}
          />
          <UnitsField units={reward.units} onChange={(units) => replace({ ...reward, units })} hasTrigger={hasTrigger} />
          {reward.units !== null && <SelectField label={t('adminPromotionBuilder.rewards.whichUnits')} value={reward.select} onChange={(select) => replace({ ...reward, select })} options={SELECT_OPTIONS.map((option) => ({ value: option, label: t(`adminPromotionBuilder.rewards.unitSelection.${option}`) }))} />}
          <Note>{t('adminPromotionBuilder.rewards.amountCannotExceedPrice')}</Note>
        </>
      )}

      {reward.type === 'fixed_price' && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <NumberField label={t('adminPromotionBuilder.rewards.promotionalUnitPrice')} value={reward.price} onChange={(price) => replace({ ...reward, price: price ?? Number.NaN })} min={0} step={0.01} suffix="EGP" hint={t('adminPromotionBuilder.rewards.cheaperUnitsHint')} />
            <SelectField label={t('adminPromotionBuilder.rewards.rewardedProducts')} value={reward.group} onChange={(group) => replace({ ...reward, group })} options={groups} />
          </div>
          <UnitsField units={reward.units} onChange={(units) => replace({ ...reward, units })} hasTrigger={hasTrigger} />
        </>
      )}

      {reward.type === 'tiered_percent' && (
        <>
          <SelectField label={t('adminPromotionBuilder.rewards.products')} value={reward.group} onChange={(group) => replace({ ...reward, group })} options={groups} />
          <Field label={t('adminPromotionBuilder.rewards.discountPerUnit')} hint={t('adminPromotionBuilder.rewards.zeroPercentHint')}>
            <div className="space-y-2">
              {reward.tiers.map((tier, ti) => (
                <div key={ti} className="flex items-center gap-3">
                  <span className="text-sm font-semibold w-20 shrink-0">{t('adminPromotionBuilder.rewards.ordinalUnit', { count: ti + 1 })}</span>
                  <div className="relative flex-1 max-w-[11rem]">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={Number.isNaN(tier.percent) ? '' : tier.percent}
                      onChange={(e) => replace({ ...reward, tiers: reward.tiers.map((t, j) => (j === ti ? { percent: e.target.value === '' ? Number.NaN : Number(e.target.value) } : t)) })}
                      className="input-luxe input-with-suffix"
                      aria-label={t('adminPromotionBuilder.rewards.discountForUnit', { count: ti + 1 })}
                    />
                    <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>%</span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{tier.percent === 0 ? t('adminPromotionBuilder.rewards.fullPrice') : tier.percent >= 100 ? t('adminPromotionBuilder.rewards.free') : t('adminPromotionBuilder.rewards.percentOff', { percent: tier.percent })}</span>
                  {reward.tiers.length > 2 && ti === reward.tiers.length - 1 && (
                    <button type="button" onClick={() => replace({ ...reward, tiers: reward.tiers.slice(0, -1) })} aria-label={t('adminPromotionBuilder.rewards.removeLastUnit')} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-600">
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
              <FiPlus /> {t('adminPromotionBuilder.rewards.addUnit', { count: reward.tiers.length + 1 })}
            </button>
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <SelectField
              label={t('adminPromotionBuilder.rewards.fromUnitOn', { count: reward.tiers.length + 1 })}
              value={reward.beyond}
              onChange={(beyond) => replace({ ...reward, beyond })}
              options={[
                { value: 'repeat', label: t('adminPromotionBuilder.rewards.repeatFromFirst') },
                { value: 'last', label: t('adminPromotionBuilder.rewards.keepLastDiscount') },
                { value: 'none', label: t('adminPromotionBuilder.rewards.fullPrice') },
              ]}
            />
            <SelectField
              label={t('adminPromotionBuilder.rewards.firstUnitRule')}
              value={reward.order}
              onChange={(order) => replace({ ...reward, order })}
              options={[
                { value: 'price_desc', label: t('adminPromotionBuilder.rewards.expensiveFirst') },
                { value: 'price_asc', label: t('adminPromotionBuilder.rewards.cheapestFirst') },
              ]}
            />
          </div>
          <Choice
            legend={t('adminPromotionBuilder.rewards.unitsCounted')}
            value={reward.scope}
            onChange={(scope) => replace({ ...reward, scope })}
            options={[
              { value: 'group', label: t('adminPromotionBuilder.quantityModes.aggregate.label'), help: t('adminPromotionBuilder.rewards.unitsAcrossGroupHelp') },
              { value: 'per_product', label: t('adminPromotionBuilder.quantityModes.per_product.label'), help: t('adminPromotionBuilder.rewards.unitsPerProductHelp') },
            ]}
          />
        </>
      )}

      {reward.type === 'gift' && (
        <>
          <ProductPicker
            label={t('adminPromotionBuilder.rewards.giftProducts')}
            hint={t('adminPromotionBuilder.rewards.giftProductsHint')}
            selectedIds={reward.items.map((item) => item.productId)}
            onChange={(ids) => replace({ ...reward, items: ids.map((productId) => reward.items.find((item) => item.productId === productId) ?? { productId, quantity: 1 }) })}
            known={known}
            remember={remember}
            max={meta?.limits.giftItems ?? 5}
            showStock
            rowExtra={(productId) => (
              <label className="flex items-center gap-1.5 text-xs shrink-0">
                {t('adminPromotionBuilder.quantity')}
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
            label={t('adminPromotionBuilder.rewards.requireGiftStock')}
            help={t('adminPromotionBuilder.rewards.requireGiftStockHelp')}
            checked={reward.requireStock}
            onChange={(requireStock) => replace({ ...reward, requireStock })}
          />
        </>
      )}

      {reward.type === 'gift_choice' && (
        <>
          <Choice
            legend={t('adminPromotionBuilder.rewards.giftsSource')}
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
              { value: 'list', label: t('adminPromotionBuilder.rewards.pickedProducts'), help: t('adminPromotionBuilder.rewards.pickedProductsHelp', { limit: meta?.limits.giftOptions ?? 12 }) },
              { value: 'group', label: t('adminPromotionBuilder.rewards.groupOfProducts'), help: t('adminPromotionBuilder.rewards.groupOfProductsHelp') },
            ]}
          />

          {reward.fromGroup === null ? (
            <ProductPicker
              label={t('adminPromotionBuilder.rewards.giftProducts')}
              hint={t('adminPromotionBuilder.rewards.customerChoosesGiftHint')}
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
                  label={t('adminPromotionBuilder.conditions.productGroup')}
                  value={reward.fromGroup}
                  onChange={(fromGroup) => replace({ ...reward, fromGroup })}
                  options={groups}
                  hint={t('adminPromotionBuilder.rewards.chooseGiftGroupHint')}
                />
                <NumberField
                  label={t('adminPromotionBuilder.rewards.giftMaxValue')}
                  value={reward.maxValue}
                  onChange={(maxValue) => replace({ ...reward, maxValue })}
                  min={0.01}
                  step={0.01}
                  suffix="EGP"
                  optional
                  placeholder={t('adminPromotionBuilder.rewards.anyPrice')}
                  hint={t('adminPromotionBuilder.rewards.giftMaxValueHint')}
                />
              </div>
              {(() => {
                const group = value.groups.find((g) => g.key === reward.fromGroup);
                const empty = group?.scope === 'selected' && group.productIds.length + group.categoryIds.length + group.subcategoryIds.length + group.brands.length === 0;
                return (
                  <Note tone={empty || group?.scope === 'all' ? 'warn' : 'info'}>
                    {empty
                      ? t('adminPromotionBuilder.rewards.giftGroupEmpty', { name: group?.name })
                      : group?.scope === 'all'
                        ? t('adminPromotionBuilder.rewards.giftGroupAll', { name: group?.name })
                        : t('adminPromotionBuilder.rewards.giftGroupSelected')}{' '}
                    {t('adminPromotionBuilder.rewards.giftGroupLimit', { limit: meta?.limits.giftGroupOptions ?? 48 })}
                  </Note>
                );
              })()}
            </>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <NumberField label={t('adminPromotionBuilder.rewards.giftChooseCount')} value={reward.choose} onChange={(choose) => replace({ ...reward, choose: choose ?? Number.NaN })} min={1} max={3} suffix={t('adminPromotionBuilder.gifts')} />
          </div>
          <Toggle label={t('adminPromotionBuilder.rewards.onlyInStockGifts')} help={t('adminPromotionBuilder.rewards.onlyInStockGiftsHelp')} checked={reward.requireStock} onChange={(requireStock) => replace({ ...reward, requireStock })} />
        </>
      )}

      {reward.type === 'order_percent_off' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <NumberField label={t('adminPromotionBuilder.rewards.cartDiscount')} value={reward.percent} onChange={(percent) => replace({ ...reward, percent: percent ?? Number.NaN })} min={0.01} max={100} step={0.01} suffix="%" hint={t('adminPromotionBuilder.rewards.cartDiscountHint')} />
        </div>
      )}
      {reward.type === 'order_fixed_off' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <NumberField label={t('adminPromotionBuilder.rewards.cartAmountOff')} value={reward.amount} onChange={(amount) => replace({ ...reward, amount: amount ?? Number.NaN })} min={0.01} step={0.01} suffix="EGP" hint={t('adminPromotionBuilder.rewards.cartAmountHint')} />
        </div>
      )}
    </Section>
  );
}

export function RewardsStep(props: StepProps) {
  const { t } = useTranslation();
  const { value, onChange, meta } = props;
  const trigger = value.config.trigger;
  const buyGroup = trigger ? value.groups.find((g) => g.key === trigger.group) : undefined;
  const limit = meta?.limits.rewards ?? 5;

  return (
    <div className="space-y-6">
      <Note>
        {trigger ? (
          <>
            {t('adminPromotionBuilder.rewards.qualifyingProducts')}: <strong>{trigger.quantity}</strong> {t('adminPromotionBuilder.rewards.fromGroup')} <strong>{buyGroup?.name ?? trigger.group}</strong>
            {trigger.mode === 'per_product' ? ` (${t('adminPromotionBuilder.rewards.sameProduct')})` : ''}. {t('adminPromotionBuilder.rewards.chooseRewardedProducts')}
          </>
        ) : (
          <>{t('adminPromotionBuilder.rewards.noBuyQuantity')}</>
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
        <FiPlus /> {t('adminPromotionBuilder.rewards.addReward')}
      </button>
      {value.config.rewards.length > 1 && <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{t('adminPromotionBuilder.rewards.allRewardsTogether')}</p>}
    </div>
  );
}

// ---------------------------------------------------------------- step 5

export function RulesStep({ value, onChange, meta }: StepProps) {
  const { t } = useTranslation();
  const { config } = value;
  const app = config.application;
  const set = (patch: Partial<PromotionInput>) => onChange({ ...value, ...patch });
  const setApp = (patch: Partial<PromotionConfig['application']>) => onChange({ ...value, config: { ...config, application: { ...app, ...patch } } });
  const hasTrigger = config.trigger !== null;
  const existing = meta?.stackGroups ?? [];
  const sharing = value.stackGroup ? existing.find((g) => g.name.toLowerCase() === value.stackGroup!.name.trim().toLowerCase()) : undefined;

  return (
    <div className="space-y-6">
      <Section title={t('adminPromotionBuilder.rules.repeating')} description={t('adminPromotionBuilder.rules.repeatingDescription')}>
        {hasTrigger ? (
          <>
            <Toggle
              label={t('adminPromotionBuilder.rules.repeatApplication')}
              help={t('adminPromotionBuilder.rules.repeatApplicationHelp', { quantity: config.trigger!.quantity })}
              checked={app.repeat}
              onChange={(repeat) => setApp({ repeat, maxApplications: repeat ? app.maxApplications : null })}
            />
            {app.repeat && (
              <div className="grid sm:grid-cols-2 gap-4">
                <NumberField label={t('adminPromotionBuilder.rules.maxApplications')} value={app.maxApplications} onChange={(maxApplications) => setApp({ maxApplications })} min={1} max={100} optional />
              </div>
            )}
            <Toggle
              label={t('adminPromotionBuilder.rules.qualifierCanBeReward')}
              help={t('adminPromotionBuilder.rules.qualifierCanBeRewardHelp')}
              checked={app.qualifierCanBeReward}
              onChange={(qualifierCanBeReward) => setApp({ qualifierCanBeReward })}
            />
          </>
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{t('adminPromotionBuilder.rules.oncePerOrder')}</p>
        )}
      </Section>

      <Section title={t('adminPromotionBuilder.rules.limits')} description={t('adminPromotionBuilder.rules.noLimitHint')}>
        <div className="grid sm:grid-cols-3 gap-4">
          <NumberField label={t('adminPromotionBuilder.rules.maxDiscount')} value={app.maxDiscount} onChange={(maxDiscount) => setApp({ maxDiscount })} min={0.01} step={0.01} suffix="EGP" optional />
          <NumberField label={t('adminPromotionBuilder.rules.totalUses')} value={value.usageLimitTotal} onChange={(usageLimitTotal) => set({ usageLimitTotal })} min={1} suffix={t('adminPromotionBuilder.orders')} optional hint={t('adminPromotionBuilder.rules.acrossCustomers')} />
          <NumberField label={t('adminPromotionBuilder.rules.usesPerCustomer')} value={value.usageLimitPerCustomer} onChange={(usageLimitPerCustomer) => set({ usageLimitPerCustomer })} min={1} suffix={t('adminPromotionBuilder.orders')} optional />
        </div>
        <Note>{t('adminPromotionBuilder.rules.limitsExplanation')}</Note>
      </Section>

      <Section title={t('adminPromotionBuilder.rules.combining')} description={t('adminPromotionBuilder.rules.combiningDescription')}>
        <div className="grid sm:grid-cols-2 gap-4">
          <NumberField label={t('adminPromotionBuilder.rules.priority')} value={value.priority} onChange={(priority) => set({ priority: priority ?? 0 })} min={-1000} max={1000} hint={t('adminPromotionBuilder.rules.priorityHint')} />
        </div>
        <Toggle
          label={t('adminPromotionBuilder.rules.canCombinePromotions')}
          help={t('adminPromotionBuilder.rules.canCombinePromotionsHelp')}
          checked={value.isCombinable}
          onChange={(isCombinable) => set({ isCombinable })}
        />
        <Toggle
          label={t('adminPromotionBuilder.rules.canCombineCoupons')}
          help={t('adminPromotionBuilder.rules.canCombineCouponsHelp')}
          checked={value.combinesWithCoupons}
          onChange={(combinesWithCoupons) => set({ combinesWithCoupons })}
        />
        <Toggle
          label={t('adminPromotionBuilder.rules.applyToDiscounted')}
          help={t('adminPromotionBuilder.rules.applyToDiscountedHelp')}
          checked={app.applyToDiscounted}
          onChange={(applyToDiscounted) => setApp({ applyToDiscounted })}
        />
      </Section>

      <Section title={t('adminPromotionBuilder.rules.exclusiveGroup')} description={t('adminPromotionBuilder.rules.exclusiveGroupDescription')}>
        <Toggle label={t('adminPromotionBuilder.rules.belongsToExclusiveGroup')} checked={value.stackGroup !== null} onChange={(on) => set({ stackGroup: on ? { name: existing[0]?.name ?? '', policy: existing[0]?.policy ?? 'priority' } : null })} />
        {value.stackGroup && (
          <>
            <Field label={t('adminPromotionBuilder.rules.groupName')} hint={t('adminPromotionBuilder.rules.groupNameHint')}>
              <input
                value={value.stackGroup.name}
                onChange={(e) => {
                  const match = existing.find((g) => g.name.toLowerCase() === e.target.value.trim().toLowerCase());
                  set({ stackGroup: { name: e.target.value, policy: match?.policy ?? value.stackGroup!.policy } });
                }}
                list="promotion-stack-groups"
                maxLength={80}
                placeholder={t('adminPromotionBuilder.rules.groupNamePlaceholder')}
                className="input-luxe"
                aria-label={t('adminPromotionBuilder.rules.groupName')}
              />
              <datalist id="promotion-stack-groups">
                {existing.map((g) => <option key={g.id} value={g.name} />)}
              </datalist>
            </Field>
            <Choice
              legend={t('adminPromotionBuilder.rules.winningPromotion')}
              value={value.stackGroup.policy}
              onChange={(policy) => set({ stackGroup: { ...value.stackGroup!, policy } })}
              options={[
                { value: 'priority', label: t('adminPromotionBuilder.rules.priorityWins'), help: t('adminPromotionBuilder.rules.priorityWinsHelp') },
                { value: 'best_discount', label: t('adminPromotionBuilder.rules.bestDiscountWins'), help: t('adminPromotionBuilder.rules.bestDiscountWinsHelp') },
              ]}
            />
            {sharing && sharing.members > 0 && (
              <Note tone="warn">
                {t('adminPromotionBuilder.rules.groupMembersNotice', { name: sharing.name, count: sharing.members })}
              </Note>
            )}
          </>
        )}
      </Section>
    </div>
  );
}
