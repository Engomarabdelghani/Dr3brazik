import { motion } from 'framer-motion';
import type { FilterGroup } from '../../data/categoryFilters';

export type SubFilterState = Record<string, string[]>;

export default function ShopSubFilters({ categoryLabel, groups, selected, onToggle, onClear }: {
  categoryLabel: string;
  groups: FilterGroup[];
  selected: SubFilterState;
  onToggle: (groupKey: string, option: string) => void;
  onClear: () => void;
}) {
  const activeCount = Object.values(selected).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div
        className="rounded-2xl border border-dashed p-4 md:p-5 mb-8"
        style={{ borderColor: 'var(--color-gold)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--color-gold)' }}>
            Refine {categoryLabel}
          </span>
          {activeCount > 0 && (
            <button onClick={onClear} className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
              Clear ({activeCount})
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-x-10 gap-y-4">
          {groups.map((group) => (
            <div key={group.key}>
              <p className="text-[11px] mb-2" style={{ color: 'var(--color-muted)' }}>{group.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.options.map((option) => {
                  const active = selected[group.key]?.includes(option) ?? false;
                  return (
                    <button
                      key={option}
                      onClick={() => onToggle(group.key, option)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
                      style={{
                        borderColor: active ? 'var(--color-coffee)' : 'var(--color-border)',
                        backgroundColor: active ? 'var(--color-blush)' : 'transparent',
                        color: 'var(--color-coffee)',
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
