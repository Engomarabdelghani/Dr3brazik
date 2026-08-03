import { motion } from 'framer-motion';
import { brandSuggestions } from '../../data/taxonomy';

export default function BrandsSlider() {
  const loop = [...brandSuggestions, ...brandSuggestions];
  return (
    <section className="py-10 border-y overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
      <div className="flex">
        <motion.div
          className="flex gap-16 pr-16 shrink-0"
          animate={{ x: ['0%', '-100%'] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        >
          {loop.map((b, i) => (
            <span key={i} className="text-xl md:text-2xl font-semibold tracking-widest whitespace-nowrap" style={{ color: 'var(--color-muted)' }}>
              {b.toUpperCase()}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
