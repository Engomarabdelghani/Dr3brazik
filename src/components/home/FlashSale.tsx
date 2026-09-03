import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiZap } from 'react-icons/fi';
import ProductCard from '../product/ProductCard';
import type { Product } from '../../types';
import { useCountdown } from '../../hooks/useCountdown';

function discountPercentOf(p: Product) {
  if (p.oldPrice) return Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
  return p.discountPercent ?? 0;
}

export default function FlashSale({ items }: { items: Product[] }) {
  const { h, m, s } = useCountdown(18);
  if (items.length === 0) return null;

  const maxDiscount = Math.max(...items.map(discountPercentOf));

  return (
    <section className="relative py-20 md:py-24 overflow-hidden">
      <img
        src="/images/hero-banner.jpg"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(155deg, rgba(58,38,42,0.94) 20%, rgba(58,38,42,0.86) 100%)' }}
      />
      <div className="grain-overlay" />

      <div className="container-luxe relative">
        <div className="flex flex-wrap items-end justify-between gap-8 mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-4"
              style={{ backgroundColor: 'var(--color-gold)', color: 'var(--color-coffee)' }}
            >
              <FiZap size={12} /> Up to {maxDiscount}% Off
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Flash Sale</h2>
            <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Best-selling formulas, marked down for a limited time.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center gap-2.5"
          >
            {[
              { value: h, label: 'Hrs' },
              { value: m, label: 'Min' },
              { value: s, label: 'Sec' },
            ].map((unit, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center font-extrabold text-xl md:text-2xl"
                  style={{ backgroundColor: '#fff', color: 'var(--color-coffee)' }}
                >
                  {String(unit.value).padStart(2, '0')}
                </div>
                <span className="text-[10px] tracking-[0.15em] uppercase mt-1.5" style={{ color: 'var(--color-gold-light)' }}>
                  {unit.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-7">
          {items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/offers"
            className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-full transition-colors"
            style={{ backgroundColor: 'var(--color-gold)', color: 'var(--color-coffee)' }}
          >
            See All Offers <FiArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}
