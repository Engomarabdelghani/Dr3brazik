import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FiCopy, FiEdit2, FiPause, FiPlay, FiPlus, FiSearch, FiSlash, FiTrash2, FiZap } from 'react-icons/fi';
import type { AdminPromotion, EffectiveStatus, PromotionStatus } from '../../../api/promotionTypes';
import PromoBadge from '../../../components/product/PromoBadge';
import { deletePromotion, duplicatePromotion, fetchAdminPromotions, setPromotionStatus } from '../../../lib/api/promotions';
import { STATUS_STYLE } from './builderModel';
import { Note, StatusPill } from './builderUi';
import Simulator from './Simulator';
import type { PickedProduct } from './ProductPicker';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const FILTERS: { value: EffectiveStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'all' },
  { value: 'active', label: 'active' },
  { value: 'scheduled', label: 'scheduled' },
  { value: 'draft', label: 'drafts' },
  { value: 'paused', label: 'paused' },
  { value: 'expired', label: 'expired' },
  { value: 'inactive', label: 'inactive' },
];

const date = (iso: string | null, locale: string) =>
  iso ? new Intl.DateTimeFormat(locale.startsWith('ar') ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) : null;

function schedule(p: AdminPromotion, t: TFunction, locale: string): string {
  const start = date(p.startsAt, locale);
  const end = date(p.endsAt, locale);
  if (!start && !end) return t('adminPromotions.noDates');
  if (start && end) return t('adminPromotions.dateRange', { start, end });
  return start ? t('adminPromotions.fromDate', { date: start }) : t('adminPromotions.untilDate', { date: end });
}

export default function PromotionsList() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<EffectiveStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [known, setKnown] = useState<Record<string, PickedProduct>>({});

  // One request; the tabs filter in the browser so their counts are always there.
  const { data: all = [], isLoading, isError } = useQuery({ queryKey: ['admin', 'promotions'], queryFn: () => fetchAdminPromotions() });
  const term = search.trim().toLowerCase();
  const matching = all.filter((p) => !term || p.name.toLowerCase().includes(term) || (p.couponCode ?? '').toLowerCase().includes(term) || p.display.badge.en.toLowerCase().includes(term));
  const shown = matching.filter((p) => filter === 'all' || p.effectiveStatus === filter);
  const count = (status: EffectiveStatus | 'all') => (status === 'all' ? matching.length : matching.filter((p) => p.effectiveStatus === status).length);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'promotion-meta'] });
    // The storefront's own caches: badges, prices and cart totals follow at once in this browser.
    queryClient.invalidateQueries({ queryKey: ['promotions'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const act = async (id: string, work: () => Promise<unknown>) => {
    setBusy(id);
    setError(null);
    try {
      await work();
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('adminPromotions.actionError'));
    } finally {
      setBusy(null);
    }
  };

  const setStatus = (p: AdminPromotion, status: PromotionStatus) => act(p.id, () => setPromotionStatus(p.id, status));
  const onDuplicate = (p: AdminPromotion) =>
    act(p.id, async () => {
      const id = await duplicatePromotion(p.id);
      navigate(`/admin/promotions/${id}/edit`);
    });
  const onDelete = (p: AdminPromotion) => {
    if (!confirm(t('adminPromotions.deleteConfirm', { name: p.name }))) return;
    void act(p.id, () => deletePromotion(p.id));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('adminPromotions.title')}</h1>
          <p className="text-sm mt-1 max-w-2xl" style={{ color: 'var(--color-muted)' }}>
            {t('adminPromotions.description')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setTesting((v) => !v)} className="btn-secondary" aria-expanded={testing}>
            <FiPlay /> {testing ? t('adminPromotions.hideSimulator') : t('adminPromotions.testCart')}
          </button>
          <Link to="/admin/promotions/new" className="btn-primary"><FiPlus /> {t('adminPromotions.newPromotion')}</Link>
        </div>
      </div>

      {testing && (
        <div className="mb-6">
          <Simulator known={known} remember={(product) => setKnown((prev) => ({ ...prev, [product.id]: product }))} />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('adminPromotions.filterByStatus')}>
          {FILTERS.map((f) => {
            const on = filter === f.value;
            return (
              <button
                type="button"
                key={f.value}
                aria-pressed={on}
                onClick={() => setFilter(f.value)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
                style={{ borderColor: on ? 'var(--color-coffee)' : 'var(--color-border)', backgroundColor: on ? 'var(--color-coffee)' : 'var(--color-surface)', color: on ? '#fff' : 'var(--color-coffee)' }}
              >
                {t(`adminPromotions.filters.${f.label}`)} <span style={{ opacity: 0.7 }}>{count(f.value).toLocaleString(i18n.language)}</span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute start-4 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--color-muted)' }} aria-hidden="true" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('adminPromotions.searchPlaceholder')} className="input-luxe input-with-icon input-compact" aria-label={t('adminPromotions.searchLabel')} />
        </div>
      </div>

      {error && <div className="mb-4"><Note tone="error">{error}</Note></div>}

      {isLoading ? (
        <div className="card-luxe p-8 text-center" style={{ color: 'var(--color-muted)' }}>{t('common.loading')}</div>
      ) : isError ? (
        <div className="card-luxe p-8 text-center">
          <p className="font-medium">{t('adminPromotions.loadError')}</p>
          <button type="button" onClick={refresh} className="btn-secondary mt-4">{t('adminPromotions.tryAgain')}</button>
        </div>
      ) : all.length === 0 ? (
        <div className="card-luxe p-10 text-center">
          <FiZap size={28} className="mx-auto mb-3" style={{ color: 'var(--color-muted)' }} aria-hidden="true" />
          <p className="font-medium">{t('adminPromotions.emptyTitle')}</p>
          <p className="text-sm mt-1 mb-5" style={{ color: 'var(--color-muted)' }}>{t('adminPromotions.emptyDescription')}</p>
          <Link to="/admin/promotions/new" className="btn-primary"><FiPlus /> {t('adminPromotions.newPromotion')}</Link>
        </div>
      ) : shown.length === 0 ? (
        <div className="card-luxe p-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>{t('adminPromotions.noMatches')}</div>
      ) : (
        <ul className="space-y-3">
          {shown.map((p) => {
            const working = busy === p.id;
            const limit = p.usageLimitTotal;
            return (
              <li key={p.id} className="card-luxe p-4 md:p-5" style={{ opacity: working ? 0.6 : 1 }} aria-busy={working}>
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                  <div className="min-w-0 flex-1 basis-72">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/admin/promotions/${p.id}/edit`} className="font-semibold hover:text-[var(--color-gold)] transition-colors break-words">{p.name}</Link>
                      <StatusPill status={{ ...STATUS_STYLE[p.effectiveStatus]!, label: t(`adminPromotions.statuses.${p.effectiveStatus}`) }} />
                      {p.couponCode && <code className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--color-cream)' }}>{p.couponCode}</code>}
                      {!p.showOnStorefront && <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>{t('adminPromotions.hiddenFromStorefront')}</span>}
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                      <PromoBadge kind={p.display.kind} label={p.display.badge} size="sm" />
                      <span className="text-sm min-w-0">{i18n.language.startsWith('ar') ? p.display.summary.ar || p.display.summary.en : p.display.summary.en}</span>
                    </div>
                    <p className="text-xs mt-2.5" style={{ color: 'var(--color-muted)' }}>
                      {schedule(p, t, i18n.language)} · {t('adminPromotions.usage', { count: p.usageCount })}{limit !== null ? ` ${t('adminPromotions.usageLimit', { limit })}` : ''} · {t('adminPromotions.priority', { priority: p.priority })}
                      {p.stackGroup ? ` · ${t('adminPromotions.exclusiveGroup', { name: p.stackGroup.name })}` : ''}
                      {!p.isCombinable ? ` · ${t('adminPromotions.notCombinable')}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {p.status === 'active' ? (
                      <button type="button" onClick={() => setStatus(p, 'paused')} disabled={working} className="list-action"><FiPause size={14} /> {t('adminPromotions.pause')}</button>
                    ) : (
                      <button type="button" onClick={() => setStatus(p, 'active')} disabled={working} className="list-action list-action-primary">
                        <FiPlay size={14} /> {p.status === 'paused' ? t('adminPromotions.resume') : t('adminPromotions.activate')}
                      </button>
                    )}
                    {p.status !== 'inactive' && p.status !== 'draft' && (
                      <button type="button" onClick={() => setStatus(p, 'inactive')} disabled={working} className="list-action"><FiSlash size={14} /> {t('adminPromotions.deactivate')}</button>
                    )}
                    <Link to={`/admin/promotions/${p.id}/edit`} className="list-action"><FiEdit2 size={14} /> {t('adminPromotions.edit')}</Link>
                    <button type="button" onClick={() => onDuplicate(p)} disabled={working} className="list-action"><FiCopy size={14} /> {t('adminPromotions.duplicate')}</button>
                    <button
                      type="button"
                      onClick={() => onDelete(p)}
                      disabled={working || p.usageCount > 0}
                      title={p.usageCount > 0 ? t('adminPromotions.deleteUsedTitle') : undefined}
                      className="list-action list-action-danger"
                    >
                      <FiTrash2 size={14} /> {t('adminPromotions.delete')}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
