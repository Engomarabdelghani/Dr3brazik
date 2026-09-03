import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const isBannerTimeActive = (banner: any) => {
    if (banner.is_active === false || banner.isEnabled === false) return false;

    const now = Date.now();
    const start = banner.start_date ?? banner.startDate;
    const end = banner.end_date ?? banner.endDate;

    if (start && new Date(start).getTime() > now) return false;
    if (end && new Date(end).getTime() < now) return false;

    return true;
};

export const BannersManager = () => {
    const [banners, setBanners] = useState<any[]>([]);
    const [title, setTitle] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [displayOrder, setDisplayOrder] = useState<number>(0);
    const [isActive, setIsActive] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        const { data } = await supabase.from('promo_banners').select('*').order('display_order');
        if (data) setBanners(data.filter((banner) => isBannerTimeActive(banner)));
    };

    const handleAddBanner = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile) return alert('يرجى اختيار صورة البنر');

        setUploading(true);
        try {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `banners/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('store-images').upload(filePath, imageFile);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('store-images').getPublicUrl(filePath);

            if (editingId) {
                await supabase.from('promo_banners').update({ title, image_url: publicUrl, link_url: linkUrl, display_order: displayOrder, is_active: isActive }).eq('id', editingId);
                setEditingId(null);
            } else {
                await supabase.from('promo_banners').insert([{ title, image_url: publicUrl, link_url: linkUrl, display_order: displayOrder, is_active: isActive }]);
            }
            setTitle('');
            setImageFile(null);
            setLinkUrl('');
            setDisplayOrder(0);
            setIsActive(true);
            fetchBanners();
        } catch (error: any) {
            alert('خطأ أثناء رفع البنر: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذا البنر؟')) {
            await supabase.from('promo_banners').delete().eq('id', id);
            fetchBanners();
        }
    };

    const handleEdit = (banner: any) => {
        setEditingId(banner.id);
        setTitle(banner.title ?? '');
        setLinkUrl(banner.link_url ?? '');
        setDisplayOrder(banner.display_order ?? 0);
        setIsActive(banner.is_active ?? true);
        setImageFile(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">إدارة البنرات الإعلانية (Home Banners)</h2>

            <form onSubmit={handleAddBanner} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium mb-1">عنوان البنر (اختياري)</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2 rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">رابط عند الضغط (link)</label>
                    <input type="text" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full border p-2 rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">صورة البنر</label>
                    <input type="file" accept="image/*" onChange={(e) => e.target.files && setImageFile(e.target.files[0])} className="w-full border p-2 rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">ترتيب العرض</label>
                    <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} className="w-full border p-2 rounded-lg" />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm">نشط</label>
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                </div>
                <button type="submit" disabled={uploading} className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700">
                    {uploading ? 'جاري الرفع...' : (editingId ? 'حفظ التعديلات' : 'إضافة بنر جديد')}
                </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners.map((banner) => (
                    <div key={banner.id} className="border rounded-lg p-3 flex justify-between items-center shadow-sm">
                        <img src={banner.image_url} alt={banner.title} className="w-32 h-16 object-cover rounded" />
                        <div>
                            <h4 className="font-semibold">{banner.title || 'بدون عنوان'}</h4>
                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{banner.link_url}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEdit(banner)} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">تعديل</button>
                            <button onClick={() => handleDelete(banner.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">حذف</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};