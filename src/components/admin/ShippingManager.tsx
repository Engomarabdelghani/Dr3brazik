import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export const ShippingManager = () => {
    const [zones, setZones] = useState<any[]>([]);
    const [govName, setGovName] = useState('');
    const [cost, setCost] = useState('');

    useEffect(() => {
        fetchZones();
    }, []);

    const fetchZones = async () => {
        const { data } = await supabase.from('shipping_zones').select('*').order('governorate_ar');
        if (data) setZones(data);
    };

    const handleAddZone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!govName || !cost) return alert('يرجى إدخال اسم المحافظة وسعر الشحن');

        const { error } = await supabase.from('shipping_zones').insert([{ governorate_ar: govName, shipping_cost: parseFloat(cost) }]);
        if (!error) {
            setGovName('');
            setCost('');
            fetchZones();
        } else {
            alert('حدث خطأ');
        }
    };

    const handleDelete = async (id: string) => {
        await supabase.from('shipping_zones').delete().eq('id', id);
        fetchZones();
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-md mt-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">إدارة المحافظات وأسعار الشحن</h2>

            <form onSubmit={handleAddZone} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium mb-1">اسم المحافظة</label>
                    <input type="text" placeholder="مثال: القاهرة، الجيزة..." value={govName} onChange={(e) => setGovName(e.target.value)} className="w-full border p-2 rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">سعر التوصيل (ج.م)</label>
                    <input type="number" placeholder="50" value={cost} onChange={(e) => setCost(e.target.value)} className="w-full border p-2 rounded-lg" />
                </div>
                <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700">إضافة المحافظة</button>
            </form>

            <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="bg-gray-100 border-b">
                            <th className="p-3">المحافظة</th>
                            <th className="p-3">سعر التوصيل</th>
                            <th className="p-3">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {zones.map((zone) => (
                            <tr key={zone.id} className="border-b">
                                <td className="p-3">{zone.governorate_ar}</td>
                                <td className="p-3">{zone.shipping_cost} ج.م</td>
                                <td className="p-3">
                                    <button onClick={() => handleDelete(zone.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">حذف</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};