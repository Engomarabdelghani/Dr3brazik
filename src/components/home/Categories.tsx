import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SectionHeading from '../common/SectionHeading';
import { useCategories } from '../../hooks/useCatalog';

// Bento layout spans — first category is the hero tile, rest fill around it
const spans = [
  'col-span-2 row-span-2',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
];

export default function Categories() {
  const { data: categories = [], isLoading } = useCategories();

  if (!isLoading && categories.length === 0) return null;

  return (
    <section className="container-luxe py-20 md:py-28">
      <SectionHeading eyebrow="Shop by Category" title="Curated for Every Ritual" align="center" />
      <div className="mt-14 grid grid-cols-2 md:grid-cols-3 auto-rows-[160px] md:auto-rows-[200px] gap-4 md:gap-5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`skeleton ${spans[i] ?? ''}`} />
            ))
          : categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className={spans[i] ?? ''}
          >
            <Link to={`/shop?category=${cat.id}`} className="group block relative rounded-3xl overflow-hidden h-full w-full">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-[var(--color-gold)] rounded-3xl transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5 flex items-end justify-between">
                <span className={`text-white font-semibold tracking-wide ${i === 0 ? 'text-xl md:text-2xl' : 'text-sm md:text-base'}`}>
                  {cat.name}
                </span>
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all"
                  style={{ backgroundColor: 'var(--color-gold)', color: '#fff' }}
                >
                  →
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
