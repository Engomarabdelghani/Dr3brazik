import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';
import {
  FiSearch, FiX, FiRefreshCw, FiChevronLeft, FiChevronRight, FiAlertTriangle, FiShoppingBag,
  FiClock, FiTrendingUp, FiInbox, FiCalendar, FiArrowRight, FiCheck, FiSliders,
} from 'react-icons/fi';
import { fetchAdminOrderStats, fetchAdminOrders, setOrderStatus } from '../../lib/api/orders';
import type { AdminOrderSort, AdminOrderSummary } from '../../api/types';
import type { OrderStatus } from '../../types';
import OrderDrawer from '../components/orders/OrderDrawer';
import { STATUS_META, STATUS_ORDER, orderLabel, fullDate, money, nextStep, paymentLabel, timeAgo, whatsappLink } from '../components/orders/orderUi';
import StatusBadge from '../components/orders/StatusBadge';

const EASE = [0.22, 1, 0.36, 1] as const;
const PAGE_SIZES = [10, 20, 50];

type Range = 'all' | 'today' | '7d' | '30d' | 'custom';
const RANGES: { value: Range; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom' },
];

const SORTS: { value: AdminOrderSort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'total_desc', label: 'Highest total' },
  { value: 'total_asc', label: 'Lowest total' },
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** The selected range → the API's from/to (local midnights, `to` exclusive). */
function rangeToDates(range: Range, from: string, to: string): { from?: string; to?: string } {
  const today = startOfDay(new Date());
  if (range === 'today') return { from: today.toISOString() };
  if (range === '7d') return { from: new Date(today.getTime() - 6 * 86_400_000).toISOString() };
  if (range === '30d') return { from: new Date(today.getTime() - 29 * 86_400_000).toISOString() };
  if (range === 'custom') {
    const parse = (s: string) => (s ? new Date(`${s}T00:00:00`) : undefined);
    const f = parse(from);
    const t = parse(to);
    return {
      from: f?.toISOString(),
      to: t ? new Date(t.getTime() + 86_400_000).toISOString() : undefined,
    };
  }
  return {};
}

/** Counts up to `value` whenever it changes. */
function useCountUp(value: number, duration = 900) {
  const [shown, setShown] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const from = fromRef.current;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return shown;
}

function StatCard({ icon: Icon, label, value, format, hint, tone, active, onClick, pulse, delay }: {
  icon: typeof FiInbox;
  label: string;
  value: number;
  format?: (n: number) => string;
  hint?: string;
  tone: 'gold' | 'ink' | 'blue' | 'green';
  active?: boolean;
  onClick?: () => void;
  pulse?: boolean;
  delay: number;
}) {
  const shown = useCountUp(value);
  const tones = {
    gold: { bg: 'rgba(192,138,99,0.14)', fg: 'var(--color-gold)' },
    ink: { bg: 'rgba(17,24,39,0.06)', fg: 'var(--color-coffee)' },
    blue: { bg: 'rgba(37,99,235,0.1)', fg: '#2563eb' },
    green: { bg: 'rgba(34,197,94,0.12)', fg: '#16a34a' },
  }[tone];
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: EASE }}
      whileHover={onClick ? { y: -3 } : undefined}
      className="relative text-left rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md disabled:cursor-default"
      style={{ border: `1px solid ${active ? 'var(--color-gold)' : 'var(--color-border)'}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: tones.bg }}>
          <Icon size={18} style={{ color: tones.fg }} />
        </span>
        {pulse && (
          <span className="relative flex w-2.5 h-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ backgroundColor: '#2563eb' }} />
            <span className="relative inline-flex rounded-full w-2.5 h-2.5" style={{ backgroundColor: '#2563eb' }} />
          </span>
        )}
      </div>
      <p className="text-2xl font-extrabold tabular-nums">{format ? format(shown) : Math.round(shown).toLocaleString('en-US')}</p>
      <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{label}</p>
      {hint && <p className="text-[11px] mt-2 font-medium" style={{ color: tones.fg }}>{hint}</p>}
    </motion.button>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <tr key={i} className="border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
          {[56, 140, 120, 60, 80, 90, 120].map((w, j) => (
            <td key={j} className="p-4">
              <div className="h-3.5 rounded-full bg-black/[0.06] animate-pulse" style={{ width: w }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function EmptyState({ filtered, onReset }: { filtered: boolean; onReset: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="py-16 text-center">
      <span className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--color-cream)' }}>
        <FiShoppingBag size={24} style={{ color: 'var(--color-gold)' }} />
      </span>
      <p className="font-bold">{filtered ? 'No orders match these filters' : 'No orders yet'}</p>
      <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
        {filtered ? 'Try a different status, date range or search.' : 'New checkouts will appear here as they come in.'}
      </p>
      {filtered && (
        <button onClick={onReset} className="btn-secondary mt-5 text-xs px-5 py-2.5">Clear filters</button>
      )}
    </motion.div>
  );
}

/** Page numbers with ellipses: 1 … 4 5 6 … 12 */
function pageList(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push('…');
    out.push(p);
  });
  return out;
}

interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'error';
}

/**
 * Every checkout is saved (owner decision, 4 Oct 2026). This is the record to
 * check before fulfilling: the WhatsApp message can be edited by the customer,
 * this can't.
 */
export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();

  const status = (params.get('status') ?? '') as OrderStatus | '';
  const search = params.get('q') ?? '';
  const payment = (params.get('pay') ?? '') as 'cod' | 'wallet' | '';
  const sort = (params.get('sort') ?? 'newest') as AdminOrderSort;
  const range = (params.get('range') ?? 'all') as Range;
  const customFrom = params.get('from') ?? '';
  const customTo = params.get('to') ?? '';
  const pageSize = PAGE_SIZES.includes(Number(params.get('size'))) ? Number(params.get('size')) : 20;
  const page = Math.max(1, Number(params.get('page') ?? 1));

  const [searchInput, setSearchInput] = useState(search);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const setParam = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params);
      for (const [k, v] of Object.entries(updates)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      if (!('page' in updates)) next.delete('page');
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  // Debounced search: typing doesn't fire a request per key.
  useEffect(() => {
    if (searchInput.trim() === search) return;
    const t = setTimeout(() => setParam({ q: searchInput.trim() || null }), 350);
    return () => clearTimeout(t);
  }, [searchInput, search, setParam]);

  const dates = useMemo(() => rangeToDates(range, customFrom, customTo), [range, customFrom, customTo]);

  const { data, isLoading, isFetching, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['admin', 'orders', { page, pageSize, status, search, payment, sort, ...dates }],
    queryFn: () =>
      fetchAdminOrders({
        page,
        pageSize,
        status: status || undefined,
        search: search || undefined,
        paymentMethod: payment || undefined,
        sort,
        from: dates.from,
        to: dates.to,
      }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });

  const { data: stats } = useQuery({ queryKey: ['admin', 'orders', 'stats'], queryFn: fetchAdminOrderStats, refetchInterval: 60_000 });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));
  const filtersActive = Boolean(status || search || payment || range !== 'all' || sort !== 'newest');

  const notify = (message: string, tone: Toast['tone'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  };

  const changeStatus = useCallback(
    async (id: string, orderCode: string, next: OrderStatus) => {
      setBusy(true);
      setRowBusy(id);
      try {
        const change = await setOrderStatus(id, next);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] }),
          queryClient.invalidateQueries({ queryKey: ['admin', 'order', id] }),
          queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] }),
          // Stock changed: the products list must not show the old numbers.
          ...(change.stockReturned || change.stockTaken ? [queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })] : []),
        ]);
        const units = (n: number) => `${n} unit${n === 1 ? '' : 's'}`;
        const stockNote = change.stockReturned
          ? ` · ${units(change.stockReturned)} returned to stock`
          : change.stockTaken
            ? ` · ${units(change.stockTaken)} taken from stock`
            : '';
        notify(`Order ${orderCode} marked as ${STATUS_META[next].label.toLowerCase()}${stockNote}`);
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Could not update the order', 'error');
      } finally {
        setBusy(false);
        setRowBusy(null);
      }
    },
    [queryClient]
  );

  const resetFilters = () => {
    setSearchInput('');
    setParams(new URLSearchParams(), { replace: true });
  };

  const closeDrawer = useCallback(() => setOpenId(null), []);

  const counts = stats?.counts;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm mt-1 flex items-center gap-2" style={{ color: 'var(--color-muted)' }}>
            The saved record of what each customer ordered and paid.
            {dataUpdatedAt > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#16a34a' }} />
                Updated {new Date(dataUpdatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ['admin', 'orders', 'stats'] });
          }}
          className="btn-secondary text-xs px-4 py-2.5"
        >
          <motion.span animate={{ rotate: isFetching ? 360 : 0 }} transition={isFetching ? { repeat: Infinity, duration: 0.9, ease: 'linear' } : { duration: 0 }} className="inline-flex">
            <FiRefreshCw size={14} />
          </motion.span>
          Refresh
        </motion.button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard delay={0} icon={FiInbox} tone="blue" label="Awaiting confirmation" value={counts?.new ?? 0} pulse={(counts?.new ?? 0) > 0}
          hint={(counts?.new ?? 0) > 0 ? 'Click to review' : 'All caught up'} active={status === 'new'} onClick={() => setParam({ status: status === 'new' ? null : 'new' })} />
        <StatCard delay={0.06} icon={FiClock} tone="gold" label="Orders today" value={stats?.today ?? 0} hint={stats ? money(stats.todayRevenue) : undefined}
          active={range === 'today'} onClick={() => setParam({ range: range === 'today' ? null : 'today', from: null, to: null })} />
        <StatCard delay={0.12} icon={FiShoppingBag} tone="ink" label="All orders" value={stats?.total ?? 0}
          hint={counts ? `${counts.delivered} delivered · ${counts.cancelled} cancelled` : undefined} />
        <StatCard delay={0.18} icon={FiTrendingUp} tone="green" label="Revenue (excl. cancelled)" value={stats?.revenue ?? 0} format={(n) => money(Math.round(n))} />
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
        {[{ value: '' as const, label: 'All', n: stats?.total }, ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_META[s].label, n: counts?.[s] }))].map((tab) => {
          const active = status === tab.value;
          return (
            <button
              key={tab.value || 'all'}
              onClick={() => setParam({ status: tab.value || null })}
              className="relative px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors"
              style={{ color: active ? '#fff' : 'var(--color-coffee)' }}
            >
              {active && (
                <motion.span layoutId="order-tab" className="absolute inset-0 rounded-full" style={{ backgroundColor: 'var(--color-coffee)' }} transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
              )}
              <span className="relative inline-flex items-center gap-2">
                {tab.label}
                {tab.n != null && (
                  <span className="text-[11px] tabular-nums px-1.5 py-0.5 rounded-full" style={{ backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'rgba(17,24,39,0.06)' }}>
                    {tab.n}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search + filters */}
      <div className="rounded-2xl bg-white p-3 mb-5 shadow-sm" style={{ border: '1px solid var(--color-border)' }}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2" size={15} style={{ color: 'var(--color-muted)' }} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search order code (S-0513), customer name or phone…"
              className="input-luxe pl-10 pr-9"
            />
            <AnimatePresence>
              {searchInput && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/5"
                  aria-label="Clear search"
                >
                  <FiX size={13} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <select value={range} onChange={(e) => setParam({ range: e.target.value === 'all' ? null : e.target.value, ...(e.target.value !== 'custom' ? { from: null, to: null } : {}) })} className="input-luxe w-auto" aria-label="Date range">
            {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors"
            style={{ backgroundColor: showFilters || payment || sort !== 'newest' ? 'var(--color-cream)' : 'transparent', color: 'var(--color-coffee)' }}
          >
            <FiSliders size={14} /> More
          </button>
          <AnimatePresence>
            {filtersActive && (
              <motion.button
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                onClick={resetFilters}
                className="text-xs font-semibold px-3 py-2 rounded-full hover:bg-black/5"
                style={{ color: 'var(--color-gold)' }}
              >
                Reset all
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence initial={false}>
          {(showFilters || range === 'custom') && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: EASE }} className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                {range === 'custom' && (
                  <div className="flex items-center gap-2">
                    <FiCalendar size={14} style={{ color: 'var(--color-muted)' }} />
                    <input type="date" value={customFrom} max={customTo || undefined} onChange={(e) => setParam({ from: e.target.value || null })} className="input-luxe w-auto py-2 text-sm" aria-label="From date" />
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>to</span>
                    <input type="date" value={customTo} min={customFrom || undefined} onChange={(e) => setParam({ to: e.target.value || null })} className="input-luxe w-auto py-2 text-sm" aria-label="To date" />
                  </div>
                )}
                {showFilters && (
                  <>
                    <select value={payment} onChange={(e) => setParam({ pay: e.target.value || null })} className="input-luxe w-auto py-2 text-sm" aria-label="Payment method">
                      <option value="">Any payment</option>
                      <option value="cod">Cash on delivery</option>
                      <option value="wallet">Instapay / Wallet</option>
                    </select>
                    <select value={sort} onChange={(e) => setParam({ sort: e.target.value === 'newest' ? null : e.target.value })} className="input-luxe w-auto py-2 text-sm" aria-label="Sort">
                      {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isError && (
        <div className="mb-4 text-sm p-4 rounded-2xl flex items-center justify-between gap-3" style={{ backgroundColor: 'rgba(239,68,68,0.07)', color: '#dc2626' }}>
          Could not load orders.
          <button onClick={() => refetch()} className="font-semibold underline">Try again</button>
        </div>
      )}

      {/* Table (md and up) */}
      <div className="hidden md:block rounded-2xl bg-white overflow-hidden shadow-sm" style={{ border: '1px solid var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[920px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider" style={{ color: 'var(--color-muted)', backgroundColor: 'var(--color-cream)' }}>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Delivery</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <SkeletonRows />}
              <AnimatePresence initial={false}>
                {data?.orders.map((o, i) => (
                  <OrderRow key={o.id} order={o} index={i} busy={rowBusy === o.id} onOpen={() => setOpenId(o.id)} onAdvance={changeStatus} />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {!isLoading && data?.orders.length === 0 && <EmptyState filtered={filtersActive} onReset={resetFilters} />}
      </div>

      {/* Cards (mobile) */}
      <div className="md:hidden space-y-3">
        {isLoading && Array.from({ length: 4 }, (_, i) => <div key={i} className="h-32 rounded-2xl bg-white animate-pulse" style={{ border: '1px solid var(--color-border)' }} />)}
        <AnimatePresence initial={false}>
          {data?.orders.map((o, i) => (
            <OrderCard key={o.id} order={o} index={i} busy={rowBusy === o.id} onOpen={() => setOpenId(o.id)} onAdvance={changeStatus} />
          ))}
        </AnimatePresence>
        {!isLoading && data?.orders.length === 0 && (
          <div className="rounded-2xl bg-white" style={{ border: '1px solid var(--color-border)' }}>
            <EmptyState filtered={filtersActive} onReset={resetFilters} />
          </div>
        )}
      </div>

      {/* Pagination */}
      {(data?.total ?? 0) > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data?.total ?? 0)} of {data?.total} orders
          </p>
          <div className="flex items-center gap-1.5">
            <button disabled={page <= 1} onClick={() => setParam({ page: String(page - 1) })} className="w-9 h-9 rounded-full border flex items-center justify-center disabled:opacity-30 hover:bg-white transition-colors" style={{ borderColor: 'var(--color-border)' }} aria-label="Previous page">
              <FiChevronLeft size={16} />
            </button>
            {pageList(page, totalPages).map((p, i) =>
              p === '…' ? (
                <span key={`gap-${i}`} className="px-1 text-sm" style={{ color: 'var(--color-muted)' }}>…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setParam({ page: String(p) })}
                  className="min-w-9 h-9 px-2 rounded-full text-sm font-semibold transition-colors"
                  style={{ backgroundColor: p === page ? 'var(--color-coffee)' : 'transparent', color: p === page ? '#fff' : 'var(--color-coffee)' }}
                >
                  {p}
                </button>
              )
            )}
            <button disabled={page >= totalPages} onClick={() => setParam({ page: String(page + 1) })} className="w-9 h-9 rounded-full border flex items-center justify-center disabled:opacity-30 hover:bg-white transition-colors" style={{ borderColor: 'var(--color-border)' }} aria-label="Next page">
              <FiChevronRight size={16} />
            </button>
            <select value={pageSize} onChange={(e) => setParam({ size: e.target.value === '20' ? null : e.target.value })} className="input-luxe w-auto py-1.5 text-xs ml-2" aria-label="Orders per page">
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} / page</option>)}
            </select>
          </div>
        </div>
      )}

      <OrderDrawer orderId={openId} onClose={closeDrawer} onChangeStatus={changeStatus} busy={busy} />

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 items-end pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium text-white"
              style={{ backgroundColor: t.tone === 'success' ? 'var(--color-coffee)' : '#dc2626' }}
            >
              {t.tone === 'success' ? <FiCheck size={16} /> : <FiAlertTriangle size={16} />} {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- rows

interface RowProps {
  order: AdminOrderSummary;
  index: number;
  busy: boolean;
  onOpen: () => void;
  onAdvance: (id: string, orderCode: string, status: OrderStatus) => Promise<void>;
}

function QuickActions({ order, busy, onAdvance, compact }: Omit<RowProps, 'index' | 'onOpen'> & { compact?: boolean }) {
  const next = nextStep(order.status);
  const wa = whatsappLink(order.customerPhone, order.customerName, orderLabel(order));
  return (
    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      {next && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          disabled={busy}
          onClick={() => onAdvance(order.id, orderLabel(order), next.to)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
          style={{ backgroundColor: STATUS_META[next.to].bg, color: STATUS_META[next.to].color }}
          title={next.label}
        >
          {busy ? <FiRefreshCw size={12} className="animate-spin" /> : (() => { const Icon = STATUS_META[next.to].icon; return <Icon size={12} />; })()}
          {compact ? STATUS_META[next.to].label : next.label.replace('Mark as ', '').replace(' order', '')}
        </motion.button>
      )}
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[rgba(37,211,102,0.12)]" style={{ color: '#25D366' }} title="Message on WhatsApp" aria-label="Message on WhatsApp">
          <FaWhatsapp size={16} />
        </a>
      )}
    </div>
  );
}

function OrderRow({ order: o, index, busy, onOpen, onAdvance }: RowProps) {
  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.3), duration: 0.3, ease: EASE }}
      onClick={onOpen}
      className="group border-b last:border-0 cursor-pointer transition-colors hover:bg-[var(--color-cream)]/60"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <td className="px-4 py-3.5">
        <p className="font-bold tabular-nums">{orderLabel(o)}</p>
        <p className="text-xs" style={{ color: 'var(--color-muted)' }} title={fullDate(o.createdAt)}>{timeAgo(o.createdAt)}</p>
      </td>
      <td className="px-4 py-3.5">
        <p className="font-medium">{o.customerName}</p>
        <p className="text-xs tabular-nums" style={{ color: 'var(--color-muted)' }}>{o.customerPhone}</p>
      </td>
      <td className="px-4 py-3.5">
        <p>{o.city ?? o.governorate}</p>
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{o.city ? o.governorate : paymentLabel(o.paymentMethod)}</p>
      </td>
      <td className="px-4 py-3.5">
        <span className="tabular-nums">{o.itemCount}</span>
        {o.shortfallUnits > 0 && (
          <span title="Ordered beyond available stock" className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>
            <FiAlertTriangle size={10} /> {o.shortfallUnits} short
          </span>
        )}
      </td>
      <td className="px-4 py-3.5 font-bold tabular-nums whitespace-nowrap">{money(o.total)}</td>
      <td className="px-4 py-3.5"><StatusBadge status={o.status} /></td>
      <td className="px-4 py-3.5">
        <div className="flex items-center justify-end gap-1">
          <QuickActions order={o} busy={busy} onAdvance={onAdvance} />
          <span className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--color-muted)' }}>
            <FiArrowRight size={15} />
          </span>
        </div>
      </td>
    </motion.tr>
  );
}

function OrderCard({ order: o, index, busy, onOpen, onAdvance }: RowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.3, ease: EASE }}
      onClick={onOpen}
      className="rounded-2xl bg-white p-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">{orderLabel(o)} · <span className="font-medium">{o.customerName}</span></p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{timeAgo(o.createdAt)} · {o.city ? `${o.governorate} — ${o.city}` : o.governorate}</p>
        </div>
        <StatusBadge status={o.status} />
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-sm">
          <span className="font-bold">{money(o.total)}</span>
          <span className="ml-2 text-xs" style={{ color: 'var(--color-muted)' }}>{o.itemCount} item{o.itemCount === 1 ? '' : 's'}</span>
          {o.shortfallUnits > 0 && <FiAlertTriangle size={12} className="inline ml-2" style={{ color: '#dc2626' }} />}
        </p>
        <QuickActions order={o} busy={busy} onAdvance={onAdvance} compact />
      </div>
    </motion.div>
  );
}
