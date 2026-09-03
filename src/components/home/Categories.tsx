import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SectionHeading from '../common/SectionHeading';
import { useCategories } from '../../hooks/useCatalog';

export default function Categories() {
  const { data: categories = [], isLoading } = useCategories();

  if (!isLoading && categories.length === 0) return null;

  return (
    <section className="container-luxe py-16 md:py-28 px-4 md:px-0">
      <SectionHeading eyebrow="Shop by Category" title="Curated for Every Ritual" align="center" />
      
      {/* استخدام أعمدة CSS لعمل تأثير الزجزاج والسحب التلقائي للعناصر للأعلى (Masonry) */}
      <div className="mt-10 md:mt-14 columns-2 md:columns-3 gap-4 md:gap-6 space-y-4 md:space-y-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-56 rounded-[12px] break-inside-avoid" />
            ))
          : categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="break-inside-avoid"
              >
                <Link 
                  to={`/shop?category=${cat.id}`} 
                  className="group flex flex-col w-full overflow-hidden rounded-[12px] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)]"
                >
                  <div className="overflow-hidden relative w-full">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      // تخصيص نسب أطوال مختلفة للصور لتعطى شكل الزجزاج والتدرج الجذاب
                      className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      style={{ 
                        aspectRatio: i === 0 ? '4/5' : i === 2 ? '3/4' : '4/3' 
                      }}
                    />
                  </div>
                  <div
                    className="flex h-11 md:h-12 items-center justify-center px-3 text-xs md:text-sm font-medium text-white transition-colors duration-300 text-center tracking-wide"
                    style={{ backgroundColor: 'var(--color-coffee, #4A3525)' }}
                  >
                    {cat.name}
                  </div>
                </Link>
              </motion.div>
            ))}
      </div>
    </section>
  );
}