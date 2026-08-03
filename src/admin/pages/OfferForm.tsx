import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiArrowLeft, FiSave, FiSearch, FiX } from 'react-icons/fi';
import { fetchOffers, createOffer, updateOffer, type OfferInput } from '../../lib/api/offers';
import { fetchCategoryRows } from '../../lib/api/categories';
import { fetchAdminProducts } from '../../lib/api/products';
import type { DiscountType, OfferTargetType } from '../../types';

function toLocalInput(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function OfferForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: offers } = useQuery({ queryKey: ['admin', 'offers'], queryFn: fetchOffers, enabled: isEdit });
  const { data: categories = [] } = useQuery({ queryKey: ['admin', 'categories-raw'], queryFn: fetchCategoryRows });
  const existing = offers?.find((o) => o.id === id);

  const [title, setTitle] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percent');
  const [discountValue, setDiscountValue] = useState('10');
  const [targetType, setTargetType] = useState<OfferTargetType>('category');
  const [categoryId, setCategoryId] = useState('');
  const [productIds, setProductIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(toLocalInput(new Date().toISOString()));
  const [endDate, setEndDate] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setDiscountType(existing.discountType);
    setDiscountValue(String(existing.discountValue));
    setTargetType(existing.targetType);
    setCategoryId(existing.categoryId ?? '');
    setProductIds(existing.productIds ?? []);
    setStartDate(toLocalInput(existing.startDate));
    setEndDate(toLocalInput(existing.endDate));
    setIsEnabled(existing.isEnabled);
  }, [existing]);

  const { data: searchResults } = useQuery({
    queryKey: ['admin', 'offer-product-search', productSearch],
    queryFn: () => fetchAdminProducts({ search: productSearch, page: 1, pageSize: 8 }),
    enabled: targetType === 'products' && productSearch.trim().length > 1,
  });

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const previewPrice = useMemo(() => {
    const base = 1000;
    const val = Number(discountValue) || 0;
    return discountType === 'percent' ? Math.round(base * (1 - val / 100)) : Math.max(base - val, 0);
  }, [discountType, discountValue]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !startDate || !endDate) {
      setError('Title, start date and end date are required.');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after the start date.');
      return;
    }
    if (targetType === 'category' && !categoryId) {
      setError('Choose a category for this offer.');
      return;
    }
    if (targetType === 'products' && productIds.length === 0) {
      setError('Choose at least one product for this offer.');
      return;
    }

    setSaving(true);
    try {
      const input: OfferInput = {
        title: title.trim(),
        discountType,
        discountValue: Number(discountValue),
        targetType,
        categoryId: targetType === 'category' ? categoryId : undefined,
        productIds: targetType === 'products' ? productIds : undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        isEnabled,
      };
      if (isEdit) await updateOffer(id!, input);
      else await createOffer(input);
      navigate('/admin/offers');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save offer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Link to="/admin/offers" className="inline-flex items-center gap-2 text-sm font-medium mb-6 hover:text-[var(--color-gold)] transition-colors">
        <FiArrowLeft /> Back to Offers
      </Link>
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Offer' : 'Create Offer'}</h1>

      <form onSubmit={onSubmit} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-luxe p-6 space-y-4">
            <h2 className="font-semibold">Offer Details</h2>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Offer title (e.g. Summer Sale)" className="input-luxe" />

            <div className="grid grid-cols-2 gap-4">
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType)} className="input-luxe">
                <option value="percent">Percentage Off</option>
                <option value="fixed">Fixed Amount Off</option>
              </select>
              <input
                type="number" min="0" required value={discountValue} onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percent' ? 'e.g. 20 (%)' : 'e.g. 200 (EGP)'} className="input-luxe"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--color-muted)' }}>Start Date</label>
                <input required type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-luxe" />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: 'var(--color-muted)' }}>End Date</label>
                <input required type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-luxe" />
              </div>
            </div>
          </div>

          <div className="card-luxe p-6 space-y-4">
            <h2 className="font-semibold">Applies To</h2>
            <div className="flex gap-2">
              <button type="button" onClick={() => setTargetType('category')} className="btn-secondary flex-1" style={targetType === 'category' ? { backgroundColor: 'var(--color-ink)', color: '#fff' } : undefined}>
                Entire Category
              </button>
              <button type="button" onClick={() => setTargetType('products')} className="btn-secondary flex-1" style={targetType === 'products' ? { backgroundColor: 'var(--color-ink)', color: '#fff' } : undefined}>
                Specific Products
              </button>
            </div>

            {targetType === 'category' ? (
              <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-luxe">
                <option value="">Select a category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <div>
                <div className="relative mb-3">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--color-muted)' }} />
                  <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products to add…" className="input-luxe pl-10" />
                </div>
                {searchResults && searchResults.products.length > 0 && (
                  <div className="space-y-1 mb-3 max-h-48 overflow-y-auto">
                    {searchResults.products.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => { if (!productIds.includes(p.id)) setProductIds([...productIds, p.id]); setProductSearch(''); }}
                        className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-black/5 flex items-center justify-between"
                      >
                        <span>{p.name}</span>
                        <span style={{ color: 'var(--color-muted)' }}>{p.price} {p.currency}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {productIds.map((pid) => (
                    <span key={pid} className="text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ backgroundColor: 'var(--color-blush)' }}>
                      {pid.slice(0, 8)}…
                      <button type="button" onClick={() => setProductIds(productIds.filter((x) => x !== pid))}><FiX size={12} /></button>
                    </span>
                  ))}
                  {productIds.length === 0 && <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No products selected yet.</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-luxe p-6">
            <h2 className="font-semibold mb-4">Preview</h2>
            <div className="rounded-2xl p-5 text-center" style={{ background: 'linear-gradient(135deg, var(--color-ink), #2A1C1F)' }}>
              <p className="text-xs text-white/70 mb-1">{title || 'Your Offer Title'}</p>
              <p className="text-3xl font-extrabold" style={{ color: 'var(--color-gold-light)' }}>
                {discountType === 'percent' ? `${discountValue || 0}% OFF` : `${discountValue || 0} EGP OFF`}
              </p>
              <p className="text-xs text-white/50 mt-2 line-through">1,000 EGP</p>
              <p className="text-sm text-white font-semibold">{previewPrice.toLocaleString()} EGP</p>
              <p className="text-[10px] text-white/40 mt-3">
                {targetType === 'category' ? (selectedCategory?.name ?? 'Choose a category') : `${productIds.length} product(s)`}
              </p>
            </div>
          </div>

          <div className="card-luxe p-6">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} className="w-4 h-4 accent-[var(--color-gold)]" />
              <span className="text-sm font-medium">Enabled</span>
            </label>
            <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
              The offer only affects prices while enabled AND between the start/end dates — it automatically stops applying once the end date passes.
            </p>
          </div>

          {error && <div className="text-xs p-3 rounded-xl" style={{ backgroundColor: 'rgba(220,38,38,0.08)', color: '#dc2626' }}>{error}</div>}

          <button type="submit" disabled={saving} className="btn-primary w-full">
            <FiSave /> {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Offer'}
          </button>
        </div>
      </form>
    </div>
  );
}
