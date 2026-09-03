import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiImage, FiShoppingBag, FiSearch, FiPackage } from 'react-icons/fi';
import {
  fetchPromoBanners, createPromoBanner, updatePromoBanner, deletePromoBanner, type PromoBannerInput,
} from '../../lib/api/promoBanners';
import { fetchOffers, isOfferActive, getBogoLabel } from '../../lib/api/offers';
import { fetchAdminProducts, fetchProductsByIds } from '../../lib/api/products';
import { cld } from '../../utils/cloudinary';
import type { PromoBanner, PromoBannerAction } from '../../types';
import SingleImageUploader from '../components/SingleImageUploader';

export default function AdminPromoBanners() {
  const queryClient = useQueryClient();
  const { data: banners = [], isLoading } = useQuery({ queryKey: ['admin', 'promo-banners'], queryFn: fetchPromoBanners });
  const [editing, setEditing] = useState<PromoBanner | 'new' | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'promo-banners'] });
    queryClient.invalidateQueries({ queryKey: ['promo-banners'] });
  };

  const onDelete = async (banner: PromoBanner) => {
    if (!confirm(`Delete "${banner.title}"?`)) return;
    await deletePromoBanner(banner.id);
    invalidate();
  };

  const actionLabel = (b: PromoBanner) => {
    if (b.actionType === 'deal') return `${(b.price ?? 0).toLocaleString('en-US')} EGP — quick-buy`;
    if (b.actionType === 'bundle') return `${b.productIds?.length ?? 0} product(s) — opens a collection page`;
    return b.link || 'Plain banner (no action)';
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Promo Banners</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Full-width slider at the top of the Home page. Each banner can link somewhere, sell a single flat-price
            deal, or add a bundle of real products (at their own real prices) to the cart in one tap. {banners.length} banners.
          </p>
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary"><FiPlus /> Add Banner</button>
      </div>

      {isLoading ? (
        <div className="card-luxe p-8 text-center" style={{ color: 'var(--color-muted)' }}>Loading…</div>
      ) : banners.length === 0 ? (
        <div className="card-luxe p-10 text-center">
          <FiImage size={28} className="mx-auto mb-3" style={{ color: 'var(--color-muted)' }} />
          <p className="font-medium">No promo banners yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Add one to feature it on the Home page.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {banners.map((b) => (
            <div key={b.id} className="card-luxe overflow-hidden">
              <div className="w-full h-32 md:h-40 overflow-hidden">
                <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-4">
                <p className="font-semibold text-sm line-clamp-1">{b.title}</p>
                <p className="text-xs font-bold mt-0.5 flex items-center gap-1" style={{ color: 'var(--color-gold)' }}>
                  {b.actionType === 'deal' && <FiShoppingBag size={11} />}
                  {b.actionType === 'bundle' && <FiPackage size={11} />}
                  {actionLabel(b)}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[10px] font-bold" style={{ color: b.isEnabled ? '#16a34a' : 'var(--color-muted)' }}>
                    {b.isEnabled ? 'ENABLED' : 'DISABLED'} · Order #{b.sortOrder}
                  </p>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setEditing(b)} aria-label="Edit" className="hover:text-[var(--color-gold)] transition-colors">
                      <FiEdit2 size={15} />
                    </button>
                    <button onClick={() => onDelete(b)} aria-label="Delete" className="hover:text-red-500 transition-colors">
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <BannerModal
          banner={editing === 'new' ? null : editing}
          nextSortOrder={banners.length}
          onClose={() => setEditing(null)}
          onSaved={() => { invalidate(); setEditing(null); }}
        />
      )}
    </div>
  );
}

function BannerModal({ banner, nextSortOrder, onClose, onSaved }: {
  banner: PromoBanner | null; nextSortOrder: number; onClose: () => void; onSaved: () => void;
}) {
  const { data: offers = [] } = useQuery({ queryKey: ['admin', 'offers'], queryFn: fetchOffers });
  const activeOffers = offers.filter(isOfferActive);

  const [title, setTitle] = useState(banner?.title ?? '');
  const [image, setImage] = useState(banner?.image ?? '');
  const [link, setLink] = useState(banner?.link ?? '');
  const [price, setPrice] = useState(banner?.price != null ? String(banner.price) : '');
  const [actionType, setActionType] = useState<PromoBannerAction>(banner?.actionType ?? 'link');
  const [sortOrder, setSortOrder] = useState(String(banner?.sortOrder ?? nextSortOrder));
  const [isEnabled, setIsEnabled] = useState(banner?.isEnabled ?? true);
  const [startDate, setStartDate] = useState(() => banner?.startDate ? toLocalInput(banner.startDate) : '');
  const [endDate, setEndDate] = useState(() => banner?.endDate ? toLocalInput(banner.endDate) : '');
  const [selectedProducts, setSelectedProducts] = useState<{ id: string; name: string; price: number; currency: string; image?: string }[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toLocalInput = (iso?: string) => {
    if (!iso) return '';
    const value = new Date(iso);
    if (Number.isNaN(value.getTime())) return '';
    const tzOffset = value.getTimezoneOffset() * 60000;
    return new Date(value.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (banner?.productIds?.length) {
      fetchProductsByIds(banner.productIds).then((products) => {
        setSelectedProducts(products.map((p) => ({ id: p.id, name: p.name, price: p.price, currency: p.currency, image: p.images[0] })));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pre-select the matching offer in the dropdown when editing a link banner that already links to one.
  const linkedOfferId = link.startsWith('/offer/') ? link.replace('/offer/', '') : '';

  const offerLabel = (offer: (typeof offers)[number]) =>
    offer.discountType === 'bogo' ? getBogoLabel(offer)
      : offer.discountType === 'percent' ? `${offer.discountValue}% Off` : `${offer.discountValue} EGP Off`;

  const { data: searchResults } = useQuery({
    queryKey: ['admin', 'banner-product-search', productSearch],
    queryFn: () => fetchAdminProducts({ search: productSearch, page: 1, pageSize: 8 }),
    enabled: actionType === 'bundle' && productSearch.trim().length > 1,
  });

  const addProduct = (p: { id: string; name: string; price: number; currency: string; images: string[] }) => {
    if (selectedProducts.some((sp) => sp.id === p.id)) return;
    setSelectedProducts([...selectedProducts, { id: p.id, name: p.name, price: p.price, currency: p.currency, image: p.images[0] }]);
    setProductSearch('');
  };

  const removeProduct = (id: string) => setSelectedProducts(selectedProducts.filter((p) => p.id !== id));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) { setError('Please upload an image.'); return; }
    if (actionType === 'bundle' && selectedProducts.length === 0) { setError('Choose at least one product for the bundle.'); return; }

    setSaving(true);
    setError(null);
    try {
      const input: PromoBannerInput = {
        title, image,
        link: actionType === 'link' ? (link || undefined) : undefined,
        price: actionType === 'deal' ? (price ? Number(price) : undefined) : undefined,
        actionType,
        productIds: actionType === 'bundle' ? selectedProducts.map((p) => p.id) : undefined,
        sortOrder: Number(sortOrder) || 0,
        isEnabled,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      };
      if (banner) await updatePromoBanner(banner.id, input);
      else await createPromoBanner(input);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save banner.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 py-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative card-luxe p-6 w-full max-w-lg bg-white max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold">{banner ? 'Edit Banner' : 'Add Banner'}</h3>
          <button onClick={onClose} aria-label="Close"><FiX size={18} /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--color-muted)' }}>
              Banner Image — wide format recommended (e.g. 1200×450px)
            </label>
            <SingleImageUploader value={image} onChange={setImage} folder="promo-banners" aspectClassName="aspect-[16/6]" />
          </div>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. 1+1 on Nebula Sun Care)" className="input-luxe" />

          <div>
            <label className="text-xs mb-1.5 block font-semibold" style={{ color: 'var(--color-heading)' }}>What happens when tapped?</label>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setActionType('link')} className="btn-secondary text-xs" style={actionType === 'link' ? { backgroundColor: 'var(--color-coffee)', color: '#fff' } : undefined}>
                Go to a link
              </button>
              <button type="button" onClick={() => setActionType('deal')} className="btn-secondary text-xs" style={actionType === 'deal' ? { backgroundColor: 'var(--color-coffee)', color: '#fff' } : undefined}>
                Single deal price
              </button>
              <button type="button" onClick={() => setActionType('bundle')} className="btn-secondary text-xs" style={actionType === 'bundle' ? { backgroundColor: 'var(--color-coffee)', color: '#fff' } : undefined}>
                Show a collection page
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--color-muted)' }}>Start date (optional)</label>
              <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-luxe" />
            </div>
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: 'var(--color-muted)' }}>End date (optional)</label>
              <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-luxe" />
            </div>
          </div>

          {actionType === 'deal' && (
            <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-cream)' }}>
              <label className="text-xs mb-1.5 block font-semibold">Price (EGP)</label>
              <input
                type="number" min="0" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 450" className="input-luxe"
              />
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-muted)' }}>
                Tapping this banner adds ONE item straight to the cart at exactly this price — good for a single
                bundled/discounted deal that isn't a real catalog product.
              </p>
            </div>
          )}

          {actionType === 'bundle' && (
            <div className="p-3 rounded-xl space-y-3" style={{ backgroundColor: 'var(--color-cream)' }}>
              <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                Pick real products from your catalog. Tapping the banner opens a page showing just these products —
                the customer browses and adds whichever they want themselves (nothing is added automatically, and no
                prices are changed).
              </p>
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--color-muted)' }} />
                <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products to add…" className="input-luxe pl-10" />
              </div>
              {searchResults && searchResults.products.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto rounded-xl border bg-white" style={{ borderColor: 'var(--color-border)' }}>
                  {searchResults.products.map((p) => (
                    <button
                      type="button" key={p.id} onClick={() => addProduct(p)}
                      disabled={selectedProducts.some((sp) => sp.id === p.id)}
                      className="w-full text-left px-3 py-2 hover:bg-black/5 flex items-center gap-3 disabled:opacity-40"
                    >
                      <img src={p.images[0] ? cld(p.images[0], 60) : 'https://picsum.photos/seed/placeholder/60/60'} alt={p.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      <span className="flex-1 text-sm truncate">{p.name}</span>
                      <span className="text-xs shrink-0" style={{ color: 'var(--color-muted)' }}>{p.price} {p.currency}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                {selectedProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-xl bg-white">
                    <img src={p.image ? cld(p.image, 60) : 'https://picsum.photos/seed/placeholder/60/60'} alt={p.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                    <span className="flex-1 text-sm truncate">{p.name}</span>
                    <span className="text-xs shrink-0" style={{ color: 'var(--color-muted)' }}>{p.price} {p.currency}</span>
                    <button type="button" onClick={() => removeProduct(p.id)} aria-label={`Remove ${p.name}`} className="shrink-0 hover:text-red-500 transition-colors">
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
                {selectedProducts.length === 0 && <p className="text-xs py-1" style={{ color: 'var(--color-muted)' }}>No products selected yet.</p>}
              </div>
            </div>
          )}

          {actionType === 'link' && (
            <>
              <div>
                <label className="text-xs mb-1.5 block font-semibold" style={{ color: 'var(--color-heading)' }}>
                  Link to an offer — easiest way
                </label>
                <select
                  value={linkedOfferId}
                  onChange={(e) => setLink(e.target.value ? `/offer/${e.target.value}` : '')}
                  className="input-luxe"
                >
                  <option value="">— Choose an active offer (optional) —</option>
                  {activeOffers.map((o) => (
                    <option key={o.id} value={o.id}>{o.title} — {offerLabel(o)}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
                <span className="text-[11px]" style={{ color: 'var(--color-muted)' }}>or a custom link</span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
              </div>

              <input
                value={link} onChange={(e) => setLink(e.target.value)}
                placeholder="Link (e.g. /shop)"
                className="input-luxe"
              />
            </>
          )}

          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--color-muted)' }}>Sort Order</label>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="input-luxe" />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} className="w-4 h-4 accent-[var(--color-gold)]" />
            <span className="text-sm font-medium">Enabled</span>
          </label>
          {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving…' : 'Save'}</button>
        </form>
      </motion.div>
    </div>
  );
}
