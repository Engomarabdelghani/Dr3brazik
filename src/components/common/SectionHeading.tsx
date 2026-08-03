import { motion } from 'framer-motion';

export default function SectionHeading({ eyebrow, title, description, align = 'left' }: {
  eyebrow: string; title: string; description?: string; align?: 'left' | 'center';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={align === 'center' ? 'text-center mx-auto max-w-2xl' : ''}
    >
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="section-title mt-3">{title}</h2>
      <div className={`divider-gold mt-5 mb-5 ${align === 'center' ? 'mx-auto' : ''}`} />
      {description && <p className="text-base" style={{ color: 'var(--color-muted)' }}>{description}</p>}
    </motion.div>
  );
}
