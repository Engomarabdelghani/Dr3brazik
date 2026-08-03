import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import HeroFeatureBar from './HeroFeatureBar';

export default function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 md:pb-20">
      <div className="relative w-full h-[360px] sm:h-[420px] md:h-[480px] lg:h-[540px]">
        <img
          src="/images/hero-banner.jpg"
          alt="Dr. Karam AbdelRazek luxury cosmetics campaign — perfume, serum, cream and lipstick staged on marble"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="relative h-full container-luxe flex items-center justify-end">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-md text-right lg:text-left lg:ml-auto"
          >
            <span className="text-xs font-bold tracking-[0.28em] uppercase" style={{ color: 'var(--color-gold)' }}>
              Beauty &middot; Skincare &middot; Makeup &middot; Fragrances
            </span>

            <h1
              className="font-display mt-4 italic"
              style={{
                fontSize: 'clamp(2rem, 4vw, 3.4rem)',
                fontWeight: 600,
                lineHeight: 1.08,
                letterSpacing: '-0.01em',
                color: 'var(--color-heading)',
              }}
            >
              Radiance,
              <br />
              redefined
              <br />
              by <span style={{ color: 'var(--color-gold)' }}>gold.</span>
            </h1>

            <p className="mt-3 text-sm" dir="rtl" style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
              كل اللي يكمل جمالك
            </p>

            <p className="mt-4 text-sm md:text-base" style={{ color: 'var(--color-heading)', opacity: 0.65 }}>
              Luxury cosmetics crafted to illuminate your natural beauty every day.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4 justify-end lg:justify-start">
              <Link to="/shop">
                <button
                  className="inline-flex items-center gap-2 rounded-full px-8 py-[0.9rem] text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-light))', boxShadow: 'var(--shadow-gold)' }}
                >
                  Shop Collection <FiArrowRight />
                </button>
              </Link>
              <Link to="/about">
                <button
                  className="inline-flex items-center gap-2 rounded-full px-8 py-[0.9rem] text-sm font-semibold border-[1.5px] transition-colors"
                  style={{ borderColor: 'var(--color-gold)', color: 'var(--color-heading)' }}
                >
                  Explore Now
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <HeroFeatureBar />
    </section>
  );
}
