import { motion } from 'framer-motion';
import { FiAward, FiFeather, FiHeart } from 'react-icons/fi';
import SectionHeading from '../components/common/SectionHeading';
import ScrollReveal from '../components/common/ScrollReveal';
import AnimatedCounter from '../components/common/AnimatedCounter';

const values = [
  { icon: FiAward, title: 'Uncompromising Quality', desc: 'Every formula is developed with dermatologists and tested rigorously before it reaches you.' },
  { icon: FiFeather, title: 'Thoughtful Ingredients', desc: 'We source rare, effective actives — never filler, always intentional.' },
  { icon: FiHeart, title: 'Care Beyond the Product', desc: 'From packaging to support, every touchpoint is designed around you.' },
];

export default function About() {
  return (
    <div>
      <section className="container-luxe pt-12 pb-20 grid lg:grid-cols-2 gap-14 items-center">
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <span className="eyebrow">Our Story</span>
          <h1 className="section-title mt-3">Beauty, Backed by Science</h1>
          <p className="mt-6 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Dr. Karam AbdelRazek was founded on a simple belief: luxury skincare should be as effective as it is indulgent.
            What began as a dermatologist's personal formulations has grown into a full collection of skincare, makeup and fragrance —
            each product crafted with the same precision and care as the very first.
          </p>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            Today, we serve thousands of clients who trust us for formulas that deliver visible results, wrapped in an experience
            that feels as premium as the ingredients inside.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="rounded-[32px] overflow-hidden aspect-[4/5]">
          <img src="/images/hero-products.jpg" alt="Dr. Karam AbdelRazek studio" className="w-full h-full object-cover" />
        </motion.div>
      </section>

      <section className="container-luxe py-16 md:py-20">
        <SectionHeading eyebrow="What We Stand For" title="Our Values" align="center" />
        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {values.map((v, i) => (
            <ScrollReveal key={v.title} delay={i * 0.1}>
              <div className="card-luxe p-8 text-center h-full">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: 'rgba(201,162,39,0.1)' }}>
                  <v.icon size={24} style={{ color: 'var(--color-gold)' }} />
                </div>
                <h3 className="font-semibold mb-2">{v.title}</h3>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{v.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'rgba(201,162,39,0.06)' }}>
        <div className="container-luxe grid grid-cols-2 md:grid-cols-4 gap-8">
          <AnimatedCounter to={2018} label="Founded" />
          <AnimatedCounter to={15000} suffix="+" label="Happy Clients" />
          <AnimatedCounter to={2000} suffix="+" label="Products" />
          <AnimatedCounter to={100} suffix="+" label="Cities Served" />
        </div>
      </section>
    </div>
  );
}
