import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FiSave, FiCheck } from 'react-icons/fi';
import { fetchSettings, updateSettings } from '../../lib/api/settings';
import type { SiteSettings } from '../../types';

const empty: SiteSettings = {
  siteName: '', logoUrl: '', faviconUrl: '', whatsapp: '', facebook: '', instagram: '', tiktok: '',
  email: '', address: '', heroImages: [], seoTitle: '', seoDescription: '',
};

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'settings'], queryFn: fetchSettings });
  const [form, setForm] = useState<SiteSettings>(empty);
  const [heroInput, setHeroInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => setForm((f) => ({ ...f, [key]: value }));

  const addHeroImage = () => {
    if (!heroInput.trim()) return;
    set('heroImages', [...form.heroImages, heroInput.trim()]);
    setHeroInput('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(form);
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <form onSubmit={onSubmit} className="grid lg:grid-cols-2 gap-6">
        <div className="card-luxe p-6 space-y-4">
          <h2 className="font-semibold">Branding</h2>
          <input value={form.siteName} onChange={(e) => set('siteName', e.target.value)} placeholder="Site Name" className="input-luxe" />
          <input value={form.logoUrl ?? ''} onChange={(e) => set('logoUrl', e.target.value)} placeholder="Logo URL" className="input-luxe" />
          <input value={form.faviconUrl ?? ''} onChange={(e) => set('faviconUrl', e.target.value)} placeholder="Favicon URL" className="input-luxe" />
        </div>

        <div className="card-luxe p-6 space-y-4">
          <h2 className="font-semibold">Contact & Social</h2>
          <input value={form.whatsapp ?? ''} onChange={(e) => set('whatsapp', e.target.value)} placeholder="WhatsApp Number" className="input-luxe" />
          <input value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder="Email" className="input-luxe" />
          <input value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} placeholder="Address" className="input-luxe" />
          <input value={form.facebook ?? ''} onChange={(e) => set('facebook', e.target.value)} placeholder="Facebook URL" className="input-luxe" />
          <input value={form.instagram ?? ''} onChange={(e) => set('instagram', e.target.value)} placeholder="Instagram URL" className="input-luxe" />
          <input value={form.tiktok ?? ''} onChange={(e) => set('tiktok', e.target.value)} placeholder="TikTok URL" className="input-luxe" />
        </div>

        <div className="card-luxe p-6 space-y-4">
          <h2 className="font-semibold">Homepage Hero Images</h2>
          <div className="flex gap-2">
            <input value={heroInput} onChange={(e) => setHeroInput(e.target.value)} placeholder="Paste image URL" className="input-luxe" />
            <button type="button" onClick={addHeroImage} className="btn-secondary shrink-0">Add</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {form.heroImages.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                <img src={url} alt={`Hero ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => set('heroImages', form.heroImages.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card-luxe p-6 space-y-4">
          <h2 className="font-semibold">SEO</h2>
          <input value={form.seoTitle ?? ''} onChange={(e) => set('seoTitle', e.target.value)} placeholder="Default Meta Title" className="input-luxe" />
          <textarea value={form.seoDescription ?? ''} onChange={(e) => set('seoDescription', e.target.value)} placeholder="Default Meta Description" rows={3} className="input-luxe" />
        </div>

        <div className="lg:col-span-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saved ? <FiCheck /> : <FiSave />} {saving ? 'Saving…' : saved ? 'Saved' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
