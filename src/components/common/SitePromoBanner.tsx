import { useQuery } from '@tanstack/react-query';
import { fetchCoupons, isCouponActive } from '../../lib/api/coupons';
import { useEffect, useState, useRef } from 'react';

export default function SitePromoBanner() {
  const { data: coupons = [] } = useQuery({ queryKey: ['coupons'], queryFn: fetchCoupons, staleTime: 60_000 });
  const activeCoupons = (coupons || []).filter((c: any) => isCouponActive(c));
  const [index, setIndex] = useState(0);
  const bannerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeCoupons.length) return;
    setIndex(0);
    const id = setInterval(() => setIndex((i) => (i + 1) % activeCoupons.length), 4000);
    return () => clearInterval(id);
  }, [activeCoupons.length]);

  useEffect(() => {
    const el = bannerRef.current;
    if (!el) return;
    const height = el.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--site-promo-offset', `${height}px`);
    document.body.classList.add('has-site-promo');
    return () => {
      document.documentElement.style.removeProperty('--site-promo-offset');
      document.body.classList.remove('has-site-promo');
    };
  }, [index, activeCoupons.length]);

  if (!activeCoupons.length) return null;

  const active = activeCoupons[index];
  const label = active.discountType === 'percent'
    ? `${active.discountValue}% Off`
    : `${active.discountValue} EGP Off`;

  return (
    <div ref={bannerRef} className="w-full bg-[linear-gradient(90deg,#fef3c7,#fff7ed)] text-sm text-center py-2 px-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
      <div className="container-luxe flex items-center justify-center gap-3">
        <span className="font-semibold">{label}</span>
        <span>— use code</span>
        <button
          onClick={() => { navigator.clipboard?.writeText(active.code); }}
          className="font-mono px-2 py-1 rounded-md bg-white/80 hover:bg-white/95"
        >{active.code}</button>
        <span className="text-[13px] text-[var(--color-muted)]">{active.targetType === 'products' ? 'Applies to selected products' : 'Applies site-wide'}</span>
      </div>
    </div>
  );
}
