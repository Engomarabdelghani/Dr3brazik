import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ShopBanner({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <section className="relative h-[220px] md:h-[260px] overflow-hidden">
      <img
        src="/images/hero-banner.jpg"
        alt="Dr. Karam AbdelRazek collection"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(58,38,42,0.45) 0%, rgba(58,38,42,0.55) 100%)' }}
      />
      <div className="grain-overlay" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative h-full flex flex-col items-center justify-center text-center px-6"
      >
        <span className="text-xs font-bold tracking-[0.28em] uppercase" style={{ color: 'var(--color-gold-light)' }}>
          {eyebrow}
        </span>
        <h1 className="mt-3 text-2xl md:text-4xl font-extrabold text-white tracking-tight">{title}</h1>
        <p className="mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
          <Link to="/" className="hover:text-white transition-colors">Home</Link> / <span className="text-white">Shop</span>
        </p>
      </motion.div>
    </section>
  );
}
