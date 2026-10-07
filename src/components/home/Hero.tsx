import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

/**
 * Compact brand strip — intentionally text-only (no competing photo) since the
 * promo slider above already carries the page's main visual moment. Keeps the
 * "overlapping feature bar" treatment via the gradient block below.
 */
export default function Hero() {
  const { t, i18n } = useTranslation();
  return (
    <section className="relative overflow-hidden pb-16 md:pb-20">
      <div
        className="relative w-full py-14 md:py-20"
        style={{ background: 'linear-gradient(135deg, var(--color-cream), var(--color-blush))' }}
      >
        <div className="container-luxe flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl"
          >
          

            <h1
              className="font-display mt-4 italic"
              style={{
                fontSize: 'clamp(1.9rem, 4vw, 2.9rem)',
                fontWeight: 600,
                lineHeight: 1.15,
                letterSpacing: '-0.01em',
                color: 'var(--color-heading)',
              }}
            >
              {t('home.heroTitle')} <span style={{ color: 'var(--color-gold)' }}>{t('home.heroGold')}</span>
            </h1>

            <p className="mt-3 text-sm" dir={i18n.language.startsWith('ar') ? 'rtl' : 'ltr'} style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
              {t('home.tagline')}
            </p>

            <p className="mt-4 text-sm md:text-base max-w-md mx-auto" style={{ color: 'var(--color-heading)', opacity: 0.65 }}>
              {t('home.heroDescription')}
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
              <Link to="/shop">
                <button
                  className="inline-flex items-center gap-2 rounded-full px-8 py-[0.9rem] text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-light))', boxShadow: 'var(--shadow-gold)' }}
                >
                  {t('home.shopCollection')} <FiArrowRight className="rtl-flip" />
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      
    </section>
  );
}