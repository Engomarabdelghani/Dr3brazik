import { useState, useEffect } from 'react';
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

export const HomeBannersSlider = () => {
    const [banners, setBanners] = useState<any[]>([]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const { data } = await supabase.from('promo_banners').select('*').order('display_order', { ascending: true });
                if (!mounted) return;
                if (data) setBanners(data.filter((banner) => isBannerTimeActive(banner)));
            } catch (err) {
                // ignore
            }
        })();
        return () => { mounted = false; };
    }, []);

    if (banners.length === 0) return null;

    return (
        <div className="w-full my-4 overflow-hidden rounded-2xl shadow-md">
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4">
                {banners.map((banner) => (
                    <div key={banner.id} className="min-w-full snap-center relative">
                        <img src={banner.image_url} alt={banner.title} className="w-full h-48 md:h-80 object-cover rounded-2xl" />
                    </div>
                ))}
            </div>
        </div>
    );
};