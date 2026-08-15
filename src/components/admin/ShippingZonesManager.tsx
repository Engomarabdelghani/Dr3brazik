import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export const ShippingZonesManager = () => {
  const [zones, setZones] = useState<any[]>([]);
  const [governorateAr, setGovernorateAr] = useState('');
  const [governorateEn, setGovernorateEn] = useState('');
  const [shippingCost, setShippingCost] = useState('0');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { fetchZones(); }, []);

  const fetchZones = async () => {
    const { data } = await supabase.from('shipping_zones').select('*').order('created_at');
    if (data) setZones(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cost = Number(shippingCost) || 0;
    try {
      if (editingId) {
        await supabase.from('shipping_zones').update({ governorate_ar: governorateAr, governorate_en: governorateEn, shipping_cost: cost }).eq('id', editingId);
        setEditingId(null);
      } else {
        await supabase.from('shipping_zones').insert([{ governorate_ar: governorateAr, governorate_en: governorateEn, shipping_cost: cost }]);
      }
      setGovernorateAr(''); setGovernorateEn(''); setShippingCost('0');
      fetchZones();
    } catch (err: any) {
      alert('خطأ أثناء الإضافة: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف المحافظة؟')) return;
    await supabase.from('shipping_zones').delete().eq('id', id);
    fetchZones();
  };

  const handleEdit = (z: any) => {
    setEditingId(z.id);
    setGovernorateAr(z.governorate_ar ?? '');
    setGovernorateEn(z.governorate_en ?? '');
    setShippingCost(String(z.shipping_cost ?? 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Shipping Zones (المحافظات)</h2>

      <form onSubmit={handleAdd} className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">اسم المحافظة (عربي)</label>
          <input value={governorateAr} onChange={(e) => setGovernorateAr(e.target.value)} className="w-full border p-2 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Governorate (EN)</label>
          <input value={governorateEn} onChange={(e) => setGovernorateEn(e.target.value)} className="w-full border p-2 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Shipping Cost</label>
          <input value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} type="number" step="0.01" className="w-full border p-2 rounded-lg" />
        </div>
        <div>
          <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700">Add Zone</button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {zones.map((z) => (
          <div key={z.id} className="border rounded-lg p-3 flex items-center justify-between">
            <div>
              <h4 className="font-semibold">{z.governorate_ar} — {z.governorate_en}</h4>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Cost: {z.shipping_cost} {z.currency ?? 'EGP'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(z)} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">Edit</button>
              <button onClick={() => handleDelete(z.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
