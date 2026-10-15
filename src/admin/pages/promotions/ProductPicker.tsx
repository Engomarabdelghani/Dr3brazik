import { useId, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiX } from 'react-icons/fi';
import { fetchAdminProducts } from '../../../lib/api/products';
import type { Product } from '../../../types';
import { cld } from '../../../utils/cloudinary';
import { toPicked, type PickedProduct } from './builderModel';

export type { PickedProduct };

interface Props {
  label: string;
  hint?: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Products the builder already knows by id. */
  known: Record<string, PickedProduct>;
  remember: (product: PickedProduct) => void;
  max?: number;
  /** Extra control on each selected row (a gift's quantity). */
  rowExtra?: (id: string) => ReactNode;
  showStock?: boolean;
}

/** Search the catalog and build a list of products. Used for product groups and for gifts. */
export default function ProductPicker({ label, hint, selectedIds, onChange, known, remember, max = 500, rowExtra, showStock = false }: Props) {
  const { t, i18n } = useTranslation();
  const inputId = useId();
  const [search, setSearch] = useState('');
  const term = search.trim();
  const { data, isFetching } = useQuery({
    queryKey: ['admin', 'promotion-product-search', term],
    queryFn: () => fetchAdminProducts({ search: term, page: 1, pageSize: 20 }),
    enabled: term.length > 1,
    staleTime: 30_000,
  });
  const full = selectedIds.length >= max;

  const add = (product: Product) => {
    if (selectedIds.includes(product.id) || full) return;
    remember(toPicked(product));
    onChange([...selectedIds, product.id]);
    setSearch('');
  };

  return (
    <div className="min-w-0">
      <label htmlFor={inputId} className="text-xs font-semibold mb-1.5 block">
        {label} <span className="font-normal" style={{ color: 'var(--color-muted)' }}>({selectedIds.length})</span>
      </label>
      <div className="relative">
        <FiSearch className="absolute start-4 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--color-muted)' }} aria-hidden="true" />
        <input
          id={inputId}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={full ? t('adminPromotionBuilder.productPicker.limitReached', { max }) : t('adminPromotionBuilder.productPicker.searchPlaceholder')}
          disabled={full}
          className="input-luxe input-with-icon"
          autoComplete="off"
        />
      </div>
      {hint && <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: 'var(--color-muted)' }}>{hint}</p>}

      {term.length > 1 && (
        <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
          {isFetching && !data ? (
            <p className="p-3 text-xs" style={{ color: 'var(--color-muted)' }}>{t('adminPromotionBuilder.productPicker.searching')}</p>
          ) : data && data.products.length > 0 ? (
            data.products.map((p) => {
              const taken = selectedIds.includes(p.id);
              return (
                <button type="button" key={p.id} onClick={() => add(p)} disabled={taken} className="w-full text-start px-3 py-2 hover:bg-black/5 flex items-center gap-3 disabled:opacity-40">
                  <img src={p.images[0] ? cld(p.images[0], 60) : '/images/placeholder.svg'} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  <span className="flex-1 text-sm truncate">{p.name}</span>
                  <span className="text-xs shrink-0" style={{ color: 'var(--color-muted)' }}>
                    {taken ? t('adminPromotionBuilder.productPicker.added') : `${p.price.toLocaleString(i18n.language)} ${p.currency}${showStock ? ` · ${p.stock ?? 0} ${t('adminPromotionBuilder.productPicker.inStock')}` : ''}`}
                  </span>
                </button>
              );
            })
          ) : (
            <p className="p-3 text-xs" style={{ color: 'var(--color-muted)' }}>{t('adminPromotionBuilder.productPicker.noMatches', { term })}</p>
          )}
        </div>
      )}

      {selectedIds.length > 0 && (
        <ul className="space-y-1.5 mt-3">
          {selectedIds.map((id) => {
            const p = known[id];
            return (
              <li key={id} className="flex items-center gap-3 p-2 rounded-xl" style={{ backgroundColor: 'var(--color-blush)' }}>
                <img src={p?.image ? cld(p.image, 60) : '/images/placeholder.svg'} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm truncate">{p?.name ?? t('common.loading')}</span>
                  {p && (
                    <span className="block text-[11px]" style={{ color: p.stock === 0 && showStock ? '#b91c1c' : 'var(--color-muted)' }}>
                      {p.price.toLocaleString(i18n.language)} {p.currency}
                      {showStock && p.stock !== null ? ` · ${p.stock === 0 ? t('adminPromotionBuilder.productPicker.outOfStock') : `${p.stock} ${t('adminPromotionBuilder.productPicker.inStock')}`}` : ''}
                    </span>
                  )}
                </span>
                {rowExtra?.(id)}
                <button type="button" onClick={() => onChange(selectedIds.filter((x) => x !== id))} aria-label={t('adminPromotionBuilder.productPicker.removeItem', { name: p?.name ?? t('adminPromotionBuilder.productPicker.product') })} className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors">
                  <FiX size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
