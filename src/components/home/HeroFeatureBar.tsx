import { motion } from 'framer-motion';
import { FiGift, FiShield, FiHeadphones, FiFeather } from 'react-icons/fi';

const features = [
  { icon: FiGift, title: 'Free Shipping', desc: 'On orders over 1500 EGP' },
  { icon: FiShield, title: '100% Original', desc: 'Authentic products only' },
  { icon: FiHeadphones, title: '24/7 Support', desc: "We're here for you" },
  { icon: FiFeather, title: 'Luxury Ingredients', desc: 'Carefully selected' },
];

export default function HeroFeatureBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 mx-auto max-w-5xl -mt-8 md:-mt-9 px-4"
    >
      <div
        className="rounded-[28px] px-6 md:px-10 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 shadow-xl"
        style={{ backgroundColor: 'var(--color-plum)' }}
      >
        {features.map((f) => (
          <div key={f.title} className="flex items-center gap-3 md:border-l md:first:border-l-0 md:pl-4 first:pl-0" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(201,162,39,0.16)' }}
            >
              <f.icon size={16} style={{ color: 'var(--color-gold-light)' }} />
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-wide">{f.title}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
