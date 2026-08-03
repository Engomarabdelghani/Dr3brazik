import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiArrowLeft, FiSave, FiSearch, FiX } from 'react-icons/fi';
import { fetchOffers, createOffer, updateOffer, type OfferInput } from '../../lib/api/offers';
import { fetchCategoryRows } from '../../lib/api/categories';
import { fetchAdminProducts, fetchProductsByIds } from '../../lib/api/products';
import { cld } from '../../utils/cloudinary';
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
  // Selected products are kept as full objects (name/image/price), not just IDs —
  // that's what lets us show a real product row instead of a raw UUID chip.
  const [selectedProducts, setSelectedProducts] = useState<{ id: string; name: string; price: number; currency: string; image?: string }[]>([]);
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
    setStartDate(toLocalInput(existing.startDate));
    setEndDate(toLocalInput(existing.endDate));
    setIsEnabled(existing.isEnabled);

    if (existing.productIds?.length) {
      fetchProductsByIds(existing.productIds).then((products) => {
        setSelectedProducts(products.map((p) => ({ id: p.id, name: p.name, price: p.price, currency: p.currency, image: p.images[0] })));
      });
    }
  }, [existing]);

  const { data: searchResults } = useQuery({
    queryKey: ['admin', 'offer-product-search', productSearch],
    queryFn: () => fetchAdminProducts({ search: productSearch, page: 1, pageSize: 8 }),
    enabled: targetType === 'products' && productSearch.trim().length > 1,
  });

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const previewProduct = selectedProducts[0];

  const previewPrice = useMemo(() => {
    const base = previewProduct?.price ?? 1000;
    const val = Number(discountValue) || 0;
    return discountType === 'percent' ? Math.round(base * (1 - val / 100)) : Math.max(base - val, 0);
  }, [discountType, discountValue, previewProduct]);

  const addProduct = (p: { id: string; name: string; price: number; currency: string; images: string[] }) => {
    if (selectedProducts.some((sp) => sp.id === p.id)) return;
    setSelectedProducts([...selectedProducts, { id: p.id, name: p.name, price: p.price, currency: p.currency, image: p.images[0] }]);
    setProductSearch('');
  };

  const removeProduct = (id: string) => setSelectedProducts(selectedProducts.filter((p) => p.id !== id));

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
    if (targetType === 'products' && selectedProducts.length === 0) {
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
        productIds: targetType === 'products' ? selectedProducts.map((p) => p.id) : undefined,
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
            <p className="text-xs -mt-2" style={{ color: 'var(--color-muted)' }}>
              Choose whether this discount applies to every product in one category, or only to specific products you pick below.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTargetType('category')}
                className="btn-secondary flex-1"
                style={targetType === 'category' ? { backgroundColor: 'var(--color-ink)', color: '#fff' } : undefined}
              >
                Entire Category
              </button>
              <button
                type="button"
                onClick={() => setTargetType('products')}
                className="btn-secondary flex-1"
                style={targetType === 'products' ? { backgroundColor: 'var(--color-ink)', color: '#fff' } : undefined}
              >
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
                  <div className="space-y-1 mb-4 max-h-56 overflow-y-auto rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
                    {searchResults.products.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => addProduct(p)}
                        disabled={selectedProducts.some((sp) => sp.id === p.id)}
                        className="w-full text-left px-3 py-2 hover:bg-black/5 flex items-center gap-3 disabled:opacity-40"
                      >
                        <img
                          src={p.images[0] ? cld(p.images[0], 60) : 'https://picsum.photos/seed/placeholder/60/60'}
                          alt={p.name}
                          className="w-9 h-9 rounded-lg object-cover shrink-0"
                        />
                        <span className="flex-1 text-sm truncate">{p.name}</span>
                        <span className="text-xs shrink-0" style={{ color: 'var(--color-muted)' }}>{p.price} {p.currency}</span>
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-muted)' }}>
                  {selectedProducts.length} product{selectedProducts.length === 1 ? '' : 's'} selected
                </p>
                <div className="space-y-2">
                  {selectedProducts.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl" style={{ backgroundColor: 'var(--color-blush)' }}>
                      <img
                        src={p.image ? cld(p.image, 60) : 'https://picsum.photos/seed/placeholder/60/60'}
                        alt={p.name}
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                      <span className="flex-1 text-sm truncate">{p.name}</span>
                      <span className="text-xs shrink-0" style={{ color: 'var(--color-muted)' }}>{p.price} {p.currency}</span>
                      <button type="button" onClick={() => removeProduct(p.id)} aria-label={`Remove ${p.name}`} className="shrink-0 hover:text-red-500 transition-colors">
                        <FiX size={15} />
                      </button>
                    </div>
                  ))}
                  {selectedProducts.length === 0 && (
                    <p className="text-xs py-2" style={{ color: 'var(--color-muted)' }}>Search above and pick products to add them here.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-luxe p-6">
            <h2 className="font-semibold mb-4">Preview</h2>
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-ink)' }}>
              {previewProduct?.image && (
                <img src={cld(previewProduct.image, 300)} alt={previewProduct.name} className="w-full h-32 object-cover" />
              )}
              <div className="p-5 text-center">
                <p className="text-xs text-white/70 mb-1 truncate">{previewProduct?.name ?? (title || 'Your Offer Title')}</p>
                <p className="text-3xl font-extrabold" style={{ color: 'var(--color-gold-light)' }}>
                  {discountType === 'percent' ? `${discountValue || 0}% OFF` : `${discountValue || 0} EGP OFF`}
                </p>
                <p className="text-xs text-white/50 mt-2 line-through">{(previewProduct?.price ?? 1000).toLocaleString()} EGP</p>
                <p className="text-sm text-white font-semibold">{previewPrice.toLocaleString()} EGP</p>
                <p className="text-[10px] text-white/40 mt-3">
                  {targetType === 'category'
                    ? (selectedCategory?.name ?? 'Choose a category')
                    : previewProduct
                      ? `+ ${selectedProducts.length - 1} more product${selectedProducts.length - 1 === 1 ? '' : 's'}`.replace('+ 0 more products', 'This product only')
                      : 'Pick products to preview'}
                </p>
              </div>
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