import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiImage, FiShoppingBag } from 'react-icons/fi';
import {
    fetchPromoBanners, createPromoBanner, updatePromoBanner, deletePromoBanner, type PromoBannerInput,
} from '../../lib/api/promoBanners';
import type { PromoBanner } from '../../types';
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

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Promo Banners</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                        Full-width slider shown at the top of the Home page (e.g. "1+1", "30% Off" campaign banners).
                        Add a price to make a banner tappable straight into the cart. {banners.length} banners.
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
                                {b.price != null ? (
                                    <p className="text-xs font-bold mt-0.5 flex items-center gap-1" style={{ color: 'var(--color-gold)' }}>
                                        <FiShoppingBag size={11} /> {b.price.toLocaleString()} EGP — quick-buy
                                    </p>
                                ) : b.link ? (
                                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-muted)' }}>{b.link}</p>
                                ) : null}
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
    const [title, setTitle] = useState(banner?.title ?? '');
    const [image, setImage] = useState(banner?.image ?? '');
    const [link, setLink] = useState(banner?.link ?? '');
    const [price, setPrice] = useState(banner?.price != null ? String(banner.price) : '');
    const [sortOrder, setSortOrder] = useState(String(banner?.sortOrder ?? nextSortOrder));
    const [isEnabled, setIsEnabled] = useState(banner?.isEnabled ?? true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!image) {
            setError('Please upload an image.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const input: PromoBannerInput = {
                title, image, link: link || undefined,
                price: price ? Number(price) : undefined,
                sortOrder: Number(sortOrder) || 0, isEnabled,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
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

                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-cream)' }}>
                        <label className="text-xs mb-1.5 block font-semibold">Price (EGP) — optional</label>
                        <input
                            type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                            placeholder="e.g. 450" className="input-luxe"
                        />
                        <p className="text-[11px] mt-1.5" style={{ color: 'var(--color-muted)' }}>
                            {price
                                ? 'Tapping this banner will add it straight to the cart at this price — the Link field below is ignored.'
                                : 'Leave empty to make this a plain link banner instead (uses the Link field below).'}
                        </p>
                    </div>

                    <input
                        value={link} onChange={(e) => setLink(e.target.value)}
                        placeholder="Link (e.g. /shop?category=... — ignored if a price is set)"
                        className="input-luxe" disabled={Boolean(price)}
                    />
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
