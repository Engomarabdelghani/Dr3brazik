import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import type { Product } from '../../types';
import ProductCard from '../product/ProductCard';
import SectionHeading from '../common/SectionHeading';

export default function ProductSection({ eyebrow, title, description, items, viewAllHref }: {
  eyebrow: string; title: string; description?: string; items: Product[]; viewAllHref: string;
}) {
  return (
    <section className="container-luxe py-16 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        <Link to={viewAllHref} className="hidden md:flex items-center gap-2 text-sm font-semibold hover:text-[var(--color-gold)] transition-colors">
          View All <FiArrowRight />
        </Link>
      </div>
      <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
        {items.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
      <Link to={viewAllHref} className="md:hidden mt-8 flex items-center justify-center gap-2 text-sm font-semibold">
        View All <FiArrowRight />
      </Link>
    </section>
  );
}
