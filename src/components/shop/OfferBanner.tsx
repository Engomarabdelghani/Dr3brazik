import { motion } from 'framer-motion';
import { useCountdown } from '../../hooks/useCountdown';

export default function OfferBanner() {
  const { h, m, s } = useCountdown(18);

  return (
    <section className="relative h-[260px] md:h-[320px] overflow-hidden">
      <img
        src="/images/hero-banner.jpg"
        alt="Dr. Karam AbdelRazek exclusive offers"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(58,38,42,0.55) 0%, rgba(58,38,42,0.72) 100%)' }}
      />
      <div className="grain-overlay" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative h-full flex flex-col items-center justify-center text-center px-6"
      >
        <span className="text-xs font-bold tracking-[0.28em] uppercase" style={{ color: 'var(--color-gold-light)' }}>
          Limited Time Only
        </span>
        <h1 className="mt-3 text-3xl md:text-5xl font-extrabold text-white tracking-tight">Exclusive Offers</h1>
        <p className="mt-3 max-w-sm text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
          Special savings on a curated selection of best-selling formulas, while supplies last.
        </p>

        {/* <div className="flex items-center gap-2 mt-7">
          {[h, m, s].map((unit, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center font-extrabold text-base md:text-lg text-white"
                style={{ backgroundColor: 'rgba(201,162,39,0.2)', border: '1px solid var(--color-gold)' }}
              >
                {String(unit).padStart(2, '0')}
              </div>
              {i < 2 && <span className="text-white text-xl font-bold">:</span>}
            </div>
          ))}
        </div>
        <p className="text-[10px] tracking-[0.2em] uppercase mt-2" style={{ color: 'var(--color-gold-light)' }}>
          Hours · Minutes · Seconds Remaining
        </p> */}
      </motion.div>
    </section>
  );
}
