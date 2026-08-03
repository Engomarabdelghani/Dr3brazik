import { motion } from 'framer-motion';
import SectionHeading from '../common/SectionHeading';
import RatingStars from '../ui/RatingStars';

const testimonials = [
  { name: 'Nourhan S.', text: 'The Golden Radiance Serum completely transformed my skin in three weeks. It genuinely feels like a five-star spa in a bottle.', rating: 5 },
  { name: 'Mariam A.', text: 'Packaging alone feels luxurious, but the products deliver even more. My go-to gift for every occasion now.', rating: 5 },
  { name: 'Youssef K.', text: 'Ordered the Noir Oud fragrance for myself — the scent lasts all day and I constantly get compliments.', rating: 4.5 },
];

export default function Testimonials() {
  return (
    <section className="container-luxe py-16 md:py-20">
      <SectionHeading eyebrow="Testimonials" title="Loved by Our Clients" align="center" />
      <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="card-luxe p-8"
          >
            <RatingStars rating={t.rating} size={14} />
            <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>&ldquo;{t.text}&rdquo;</p>
            <p className="mt-5 font-semibold text-sm">{t.name}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
