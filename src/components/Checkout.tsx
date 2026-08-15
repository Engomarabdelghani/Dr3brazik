import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { WHATSAPP_NUMBER, buildWhatsAppOrderMessage } from '../data/constants';

export const Checkout = ({ cartItems, totalAmount, clearCart }: { cartItems: any[]; totalAmount: number; clearCart: () => void }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [zones, setZones] = useState<any[]>([]);
    const [selectedZone, setSelectedZone] = useState<any>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const { data } = await supabase.from('shipping_zones').select('*').order('created_at');
                if (!mounted) return;
                if (data) setZones(data);
            } catch (err) {
                // ignore
            }
        })();
        return () => { mounted = false; };
    }, []);

    const shippingCost = selectedZone ? Number(selectedZone.shipping_cost) : 0;
    const finalTotal = totalAmount + shippingCost;

    const handleWhatsAppCheckout = () => {
        if (!name || !phone || !address || !selectedZone) {
            alert('يرجى استكمال جميع البيانات واختيار المحافظة');
            return;
        }

            const items = cartItems.map(item => ({ name: item.name || item.product?.name || '', quantity: item.quantity, price: item.price ?? item.product?.price ?? 0 }));

            const message = buildWhatsAppOrderMessage({
                items,
                subtotal: totalAmount,
                shippingCost,
                total: finalTotal,
                customerName: name,
                phone,
                address,
                governorate: selectedZone?.governorate_ar ?? selectedZone?.governorate_en,
            });

            window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
        clearCart();
    };

    return (
        <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-lg my-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">إتمام الطلب</h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">الاسم بالكامل</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border p-3 rounded-lg" placeholder="أدخل اسمك الكامل" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">رقم الموبايل</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border p-3 rounded-lg" placeholder="010xxxxxxxx" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">المحافظة</label>
                    <select
                        className="w-full border p-3 rounded-lg bg-white"
                        onChange={(e) => {
                            const zone = zones.find(z => z.id === e.target.value);
                            setSelectedZone(zone);
                        }}
                    >
                        <option value="">اختر المحافظة...</option>
                        {zones.map(zone => (
                            <option key={zone.id} value={zone.id}>{zone.governorate_ar} ({zone.shipping_cost} ج.م)</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">العنوان بالتفصيل</label>
                    <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border p-3 rounded-lg" placeholder="الشارع، رقم الحلة، العلامة المميزة"></textarea>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2 border">
                    <div className="flex justify-between text-gray-600">
                        <span>مجموع المنتجات:</span>
                        <span>{totalAmount} ج.م</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>سعر التوصيل:</span>
                        <span>{shippingCost} ج.م</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-pink-600 border-t pt-2">
                        <span>الإجمالي النهائي:</span>
                        <span>{finalTotal} ج.م</span>
                    </div>
                </div>

                <button onClick={handleWhatsAppCheckout} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition">
                    إرسال الطلب عبر واتساب 💬
                </button>
            </div>
        </div>
    );
};