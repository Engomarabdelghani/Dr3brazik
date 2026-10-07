import { motion } from 'framer-motion';
import { FiAward, FiFeather, FiHeart } from 'react-icons/fi';
import SectionHeading from '../components/common/SectionHeading';
import ScrollReveal from '../components/common/ScrollReveal';
import AnimatedCounter from '../components/common/AnimatedCounter';
import { useTranslation } from 'react-i18next';

const values = [
  { icon: FiAward, title: 'about.quality', desc: 'about.qualityDescription' },
  { icon: FiFeather, title: 'about.ingredients', desc: 'about.ingredientsDescription' },
  { icon: FiHeart, title: 'about.care', desc: 'about.careDescription' },
];

export default function About() {
  const { t } = useTranslation();
  return (
    <div>
      <section className="container-luxe pt-12 pb-20 grid lg:grid-cols-2 gap-14 items-center">
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <span className="eyebrow">{t('about.ourStory')}</span>
          <h1 className="section-title mt-3">{t('about.headline')}</h1>
          <p className="mt-6 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            {t('about.storyOne')}
          </p>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            {t('about.storyTwo')}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="rounded-[32px] overflow-hidden aspect-[4/5]">
          <img src="/images/hero-products.jpg" alt={t('about.studioAlt')} className="w-full h-full object-cover" />
        </motion.div>
      </section>

      <section className="container-luxe py-16 md:py-20">
        <SectionHeading eyebrow={t('about.whatWeStandFor')} title={t('about.ourValues')} align="center" />
        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {values.map((v, i) => (
            <ScrollReveal key={v.title} delay={i * 0.1}>
              <div className="card-luxe p-8 text-center h-full">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: 'rgba(201,162,39,0.1)' }}>
                  <v.icon size={24} style={{ color: 'var(--color-gold)' }} />
                </div>
                <h3 className="font-semibold mb-2">{t(v.title)}</h3>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{t(v.desc)}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'rgba(201,162,39,0.06)' }}>
        <div className="container-luxe grid grid-cols-2 md:grid-cols-4 gap-8">
          <AnimatedCounter to={2018} label={t('about.founded')} />
          <AnimatedCounter to={15000} suffix="+" label={t('about.happyClients')} />
          <AnimatedCounter to={2000} suffix="+" label={t('about.products')} />
          <AnimatedCounter to={100} suffix="+" label={t('about.citiesServed')} />
        </div>
      </section>
    </div>
  );
}
