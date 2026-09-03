import { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';

const coupons = [
  { code: 'KARAM10', desc: '10% off your entire order' },
  { code: 'GOLD15', desc: '15% off orders over 3,000 EGP' },
];

function CouponCard({ code, desc }: { code: string; desc: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <button
      onClick={onCopy}
      className="flex items-center justify-between gap-4 w-full sm:w-auto sm:min-w-[280px] rounded-2xl px-5 py-4 border-2 border-dashed transition-colors"
      style={{ borderColor: 'var(--color-gold)', backgroundColor: 'rgba(201,162,39,0.06)' }}
    >
      <div className="text-left">
        <p className="font-extrabold tracking-widest text-sm" style={{ color: 'var(--color-coffee)' }}>{code}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{desc}</p>
      </div>
      <span className="shrink-0" style={{ color: 'var(--color-gold)' }}>
        {copied ? <FiCheck size={18} /> : <FiCopy size={18} />}
      </span>
    </button>
  );
}

export default function CouponStrip() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 -mt-10 md:-mt-12 relative z-10 px-6">
      {coupons.map((c) => <CouponCard key={c.code} {...c} />)}
    </div>
  );
}
