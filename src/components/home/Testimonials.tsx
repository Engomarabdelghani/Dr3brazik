import { motion } from 'framer-motion';
import SectionHeading from '../common/SectionHeading';
import { useTestimonials } from '../../hooks/useCatalog';

/**
 * Real customer testimonials — screenshots uploaded by the admin from
 * /admin/testimonials (WhatsApp messages, review sites, etc.) instead of
 * hardcoded placeholder text. Hidden entirely if none are enabled.
 */
export default function Testimonials() {
  const { data: testimonials = [], isLoading } = useTestimonials();
  const active = testimonials.filter((t) => t.isEnabled);

  if (!isLoading && active.length === 0) return null;

  return (
    <section className="container-luxe py-16 md:py-20">
      <SectionHeading eyebrow="Testimonials" title="Loved by Our Clients" align="center" />
      <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)
          : active.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="card-luxe overflow-hidden"
              >
                <img src={t.image} alt="Customer testimonial" loading="lazy" className="w-full h-auto object-cover" />
              </motion.div>
            ))}
      </div>
    </section>
  );
}
