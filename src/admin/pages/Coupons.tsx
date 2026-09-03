import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiTag, FiSearch } from 'react-icons/fi';
import {
  fetchCoupons, createCoupon, updateCoupon, deleteCoupon, isCouponActive, type CouponInput,
} from '../../lib/api/coupons';
import { fetchAdminProducts, fetchProductsByIds } from '../../lib/api/products';
import { cld } from '../../utils/cloudinary';
import type { Coupon, CouponDiscountType, CouponTargetType } from '../../types';

export default function AdminCoupons() {
  const queryClient = useQueryClient();
  const { data: coupons = [], isLoading } = useQuery({ queryKey: ['admin', 'coupons'], queryFn: fetchCoupons });
  const [editing, setEditing] = useState<Coupon | 'new' | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    queryClient.invalidateQueries({ queryKey: ['coupons'] });
  };

  const onDelete = async (coupon: Coupon) => {
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return;
    await deleteCoupon(coupon.id);
    invalidate();
  };

  const discountLabel = (c: Coupon) => c.discountType === 'percent' ? `${c.discountValue}% Off` : `${c.discountValue} EGP Off`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Discount codes customers can enter at checkout. {coupons.length} coupons.
          </p>
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary"><FiPlus /> Create Coupon</button>
      </div>

      {isLoading ? (
        <div className="card-luxe p-8 text-center" style={{ color: 'var(--color-muted)' }}>Loading…</div>
      ) : coupons.length === 0 ? (
        <div className="card-luxe p-10 text-center">
          <FiTag size={28} className="mx-auto mb-3" style={{ color: 'var(--color-muted)' }} />
          <p className="font-medium">No coupons yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Create a code customers can apply at checkout.</p>
        </div>
      ) : (
        <div className="card-luxe overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: 'var(--color-border)' }}>
                <th className="p-3 font-semibold">Code</th>
                <th className="p-3 font-semibold">Discount</th>
                <th className="p-3 font-semibold">Applies To</th>
                <th className="p-3 font-semibold">Min. Order</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const active = isCouponActive(c);
                return (
                  <tr key={c.id} className="border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-3 font-mono font-bold tracking-wide">{c.code}</td>
                    <td className="p-3" style={{ color: 'var(--color-gold)' }}>{discountLabel(c)}</td>
                    <td className="p-3">{c.targetType === 'all' ? 'Entire Store' : `${c.productIds?.length ?? 0} product(s)`}</td>
                    <td className="p-3">{c.minOrderAmount ? `${c.minOrderAmount.toLocaleString('en-US')} EGP` : '—'}</td>
                    <td className="p-3">
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: active ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.12)',
                          color: active ? '#16a34a' : 'var(--color-muted)',
                        }}
                      >
                        {active ? 'Active' : c.isEnabled ? 'Scheduled/Expired' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => setEditing(c)} aria-label="Edit" className="hover:text-[var(--color-gold)] transition-colors">
                          <FiEdit2 size={15} />
                        </button>
                        <button onClick={() => onDelete(c)} aria-label="Delete" className="hover:text-red-500 transition-colors">
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <CouponModal
          coupon={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { invalidate(); setEditing(null); }}
        />
      )}
    </div>
  );
}

function toLocalInput(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CouponModal({ coupon, onClose, onSaved }: { coupon: Coupon | null; onClose: () => void; onSaved: () => void }) {
  const [code, setCode] = useState(coupon?.code ?? '');
  const [discountType, setDiscountType] = useState<CouponDiscountType>(coupon?.discountType ?? 'percent');
  const [discountValue, setDiscountValue] = useState(String(coupon?.discountValue ?? '10'));
  const [targetType, setTargetType] = useState<CouponTargetType>(coupon?.targetType ?? 'all');
  const [minOrderAmount, setMinOrderAmount] = useState(coupon?.minOrderAmount != null ? String(coupon.minOrderAmount) : '');
  const [startDate, setStartDate] = useState(toLocalInput(coupon?.startDate));
  const [endDate, setEndDate] = useState(toLocalInput(coupon?.endDate));
  const [isEnabled, setIsEnabled] = useState(coupon?.isEnabled ?? true);
  const [isPublic, setIsPublic] = useState(coupon?.isPublic ?? true);
  const [selectedProducts, setSelectedProducts] = useState<{ id: string; name: string; price: number; currency: string; image?: string }[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (coupon?.productIds?.length) {
      fetchProductsByIds(coupon.productIds).then((products) => {
        setSelectedProducts(products.map((p) => ({ id: p.id, name: p.name, price: p.price, currency: p.currency, image: p.images[0] })));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: searchResults } = useQuery({
    queryKey: ['admin', 'coupon-product-search', productSearch],
    queryFn: () => fetchAdminProducts({ search: productSearch, page: 1, pageSize: 8 }),
    enabled: targetType === 'products' && productSearch.trim().length > 1,
  });

  const addProduct = (p: { id: string; name: string; price: number; currency: string; images: string[] }) => {
    if (selectedProducts.some((sp) => sp.id === p.id)) return;
    setSelectedProducts([...selectedProducts, { id: p.id, name: p.name, price: p.price, currency: p.currency, image: p.images[0] }]);
    setProductSearch('');
  };

  const removeProduct = (id: string) => setSelectedProducts(selectedProducts.filter((p) => p.id !== id));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { setError('Please enter a code.'); return; }
    if (targetType === 'products' && selectedProducts.length === 0) { setError('Choose at least one product.'); return; }

    setSaving(true);
    setError(null);
    try {
      const input: CouponInput = {
        code: code.trim(),
        discountType,
        discountValue: Number(discountValue) || 0,
        targetType,
        productIds: targetType === 'products' ? selectedProducts.map((p) => p.id) : undefined,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        isEnabled,
        isPublic,
      };
      if (coupon) await updateCoupon(coupon.id, input);
      else await createCoupon(input);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save coupon — the code may already be in use.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 py-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative card-luxe p-6 w-full max-w-md bg-white max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold">{coupon ? 'Edit Coupon' : 'Create Coupon'}</h3>
          <button onClick={onClose} aria-label="Close"><FiX size={18} /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Code (e.g. WELCOME10)" className="input-luxe font-mono tracking-wide"
          />

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setDiscountType('percent')} className="btn-secondary" style={discountType === 'percent' ? { backgroundColor: 'var(--color-coffee)', color: '#fff' } : undefined}>
              Percent Off
            </button>
            <button type="button" onClick={() => setDiscountType('fixed')} className="btn-secondary" style={discountType === 'fixed' ? { backgroundColor: 'var(--color-coffee)', color: '#fff' } : undefined}>
              Fixed Amount
            </button>
          </div>
          <input
            type="number" min="0" required value={discountValue} onChange={(e) => setDiscountValue(e.target.value)}
            placeholder={discountType === 'percent' ? 'e.g. 10 (%)' : 'e.g. 50 (EGP)'} className="input-luxe"
          />

          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--color-muted)' }}>Minimum Order Amount — optional</label>
            <input type="number" min="0" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} placeholder="e.g. 500" className="input-luxe" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--color-muted)' }}>Start Date — optional</label>
              <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-luxe" />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--color-muted)' }}>End Date — optional</label>
              <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-luxe" />
            </div>
          </div>

          <div>
            <label className="text-xs mb-1.5 block font-semibold" style={{ color: 'var(--color-heading)' }}>Applies To</label>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setTargetType('all')} className="btn-secondary flex-1" style={targetType === 'all' ? { backgroundColor: 'var(--color-coffee)', color: '#fff' } : undefined}>
                Entire Store
              </button>
              <button type="button" onClick={() => setTargetType('products')} className="btn-secondary flex-1" style={targetType === 'products' ? { backgroundColor: 'var(--color-coffee)', color: '#fff' } : undefined}>
                Specific Products
              </button>
            </div>

            {targetType === 'products' && (
              <div>
                <div className="relative mb-2">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--color-muted)' }} />
                  <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products…" className="input-luxe pl-10" />
                </div>
                {searchResults && searchResults.products.length > 0 && (
                  <div className="space-y-1 mb-3 max-h-40 overflow-y-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
                    {searchResults.products.map((p) => (
                      <button
                        type="button" key={p.id} onClick={() => addProduct(p)}
                        disabled={selectedProducts.some((sp) => sp.id === p.id)}
                        className="w-full text-left px-3 py-2 hover:bg-black/5 flex items-center gap-3 disabled:opacity-40"
                      >
                        <img src={p.images[0] ? cld(p.images[0], 60) : 'https://picsum.photos/seed/placeholder/60/60'} alt={p.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                        <span className="flex-1 text-sm truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  {selectedProducts.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 p-2 rounded-xl" style={{ backgroundColor: 'var(--color-blush)' }}>
                      <img src={p.image ? cld(p.image, 60) : 'https://picsum.photos/seed/placeholder/60/60'} alt={p.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      <span className="flex-1 text-sm truncate">{p.name}</span>
                      <button type="button" onClick={() => removeProduct(p.id)} aria-label={`Remove ${p.name}`} className="shrink-0 hover:text-red-500 transition-colors">
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}
                  {selectedProducts.length === 0 && <p className="text-xs py-1" style={{ color: 'var(--color-muted)' }}>No products selected yet.</p>}
                </div>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} className="w-4 h-4 accent-[var(--color-gold)]" />
            <span className="text-sm font-medium">Enabled</span>
          </label>
          <div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="w-4 h-4 accent-[var(--color-gold)]" />
              <span className="text-sm font-medium">Show in site-wide banner</span>
            </label>
            <p className="text-[11px] mt-1 pl-6" style={{ color: 'var(--color-muted)' }}>
              Off = the code still works when a customer types it at checkout, it just won't be advertised on the site.
            </p>
          </div>

          {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving…' : coupon ? 'Save Changes' : 'Create Coupon'}</button>
        </form>
      </motion.div>
    </div>
  );
}
