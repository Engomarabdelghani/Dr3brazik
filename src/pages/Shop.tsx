import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSliders, FiX, FiSearch, FiChevronDown } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import { useProducts, useCategories } from '../hooks/useCatalog';
import { categoryFilterConfig } from '../data/categoryFilters';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import RefinePanel, { type Filters } from '../components/shop/RefinePanel';
import ShopBanner from '../components/shop/ShopBanner';
import ShopSubFilters, { type SubFilterState } from '../components/shop/ShopSubFilters';
import Pagination from '../components/shop/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { useSeo } from '../hooks/useSeo';
import type { SortOption } from '../types';

const PAGE_SIZE = 9;

const sortLabels: Record<SortOption, string> = {
  featured: 'Featured',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
  newest: 'Newest',
  rating: 'Top Rated',
};

export default function Shop() {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  useSeo({ title: 'Shop All Products', description: 'Browse the full collection of luxury skincare, makeup, and fragrance.', path: '/shop' });

  const MAX_PRICE = useMemo(() => Math.max(0, ...products.map((p) => p.price)), [products]);
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand).filter(Boolean))].sort(), [products]);

  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const [filters, setFilters] = useState<Filters>({
    category: searchParams.get('category'),
    subcategory: null,
    brand: null,
    maxPrice: Infinity,
    inStockOnly: false,
  });
  const [sort, setSort] = useState<SortOption>('featured');
  const [sortOpen, setSortOpen] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [subFilters, setSubFilters] = useState<SubFilterState>({});
  const [page, setPage] = useState(1);

  const effectiveMaxPrice = filters.maxPrice === Infinity ? MAX_PRICE : filters.maxPrice;

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (filters.category && p.category !== filters.category) return false;
      if (filters.subcategory && p.subcategory !== filters.subcategory) return false;
      if (filters.brand && p.brand !== filters.brand) return false;
      if (p.price > effectiveMaxPrice) return false;
      if (filters.inStockOnly && !p.inStock) return false;
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
      for (const [groupKey, selectedOptions] of Object.entries(subFilters)) {
        if (selectedOptions.length === 0) continue;
        const productValues = p.attributes?.[groupKey] ?? [];
        if (!selectedOptions.some((opt) => productValues.includes(opt))) return false;
      }
      return true;
    });

    switch (sort) {
      case 'price-asc': list = [...list].sort((a, b) => (a.effectivePrice ?? a.price) - (b.effectivePrice ?? b.price)); break;
      case 'price-desc': list = [...list].sort((a, b) => (b.effectivePrice ?? b.price) - (a.effectivePrice ?? a.price)); break;
      case 'newest': list = [...list].sort((a, b) => Number(b.isNew) - Number(a.isNew)); break;
      case 'rating': list = [...list].sort((a, b) => b.rating - a.rating); break;
      default: list = [...list].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
    }
    return list;
  }, [products, filters, sort, query, subFilters, effectiveMaxPrice]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clearSearch = () => {
    searchParams.delete('q');
    setSearchParams(searchParams);
  };

  const setCategory = (cat: string | null) => {
    setFilters((f) => ({ ...f, category: cat, subcategory: null }));
    setSubFilters({});
    setPage(1);
  };

  const setSubcategory = (subcat: string | null) => {
    setFilters((f) => ({ ...f, subcategory: subcat }));
    setPage(1);
  };

  const toggleSubFilter = (groupKey: string, option: string) => {
    setSubFilters((prev) => {
      const current = prev[groupKey] ?? [];
      const next = current.includes(option) ? current.filter((o) => o !== option) : [...current, option];
      return { ...prev, [groupKey]: next };
    });
    setPage(1);
  };

  const clearSubFilters = () => {
    setSubFilters({});
    setPage(1);
  };

  const activeCategory = filters.category ? categories.find((c) => c.id === filters.category) : null;
  const activeSubFilterGroups = filters.category ? categoryFilterConfig[filters.category] : undefined;

  const activeRefineCount =
    (filters.brand ? 1 : 0) + (filters.maxPrice < MAX_PRICE ? 1 : 0) + (filters.inStockOnly ? 1 : 0);

  return (
    <div style={{ backgroundColor: 'var(--color-surface)' }}>
      <ShopBanner eyebrow="Full Collection" title="Shop All Products" />

      <div className="container-luxe py-12">
        {query && (
          <div className="mb-8 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(201,162,39,0.1)' }}>
            <FiSearch size={14} /> Results for "{query}"
            <button onClick={clearSearch} aria-label="Clear search"><FiX size={14} /></button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCategory(null)}
              className="text-xs font-semibold px-4 py-2.5 rounded-full border transition-all duration-200"
              style={{
                borderColor: !filters.category ? 'var(--color-ink)' : 'var(--color-border)',
                backgroundColor: !filters.category ? 'var(--color-ink)' : 'transparent',
                color: !filters.category ? '#fff' : 'var(--color-ink)',
              }}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className="text-xs font-semibold px-4 py-2.5 rounded-full border transition-all duration-200"
                style={{
                  borderColor: filters.category === c.id ? 'var(--color-ink)' : 'var(--color-border)',
                  backgroundColor: filters.category === c.id ? 'var(--color-ink)' : 'transparent',
                  color: filters.category === c.id ? '#fff' : 'var(--color-ink)',
                }}
              >
                {c.name}
              </button>
            ))}
            <button
              onClick={() => setRefineOpen(true)}
              className="text-xs font-semibold px-4 py-2.5 rounded-full border flex items-center gap-1.5 transition-all duration-200"
              style={{
                borderColor: activeRefineCount > 0 ? 'var(--color-gold)' : 'var(--color-border)',
                color: activeRefineCount > 0 ? 'var(--color-gold)' : 'var(--color-ink)',
              }}
            >
              <FiSliders size={12} /> Filters
              {activeRefineCount > 0 && (
                <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: 'var(--color-gold)' }}>
                  {activeRefineCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <p className="text-xs hidden sm:block" style={{ color: 'var(--color-muted)' }}>{filtered.length} products</p>
            <div className="relative">
              <button
                onClick={() => setSortOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold border rounded-full px-4 py-2.5"
                style={{ borderColor: 'var(--color-border)' }}
              >
                Sort: {sortLabels[sort]} <FiChevronDown size={13} />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 mt-3 w-48 card-luxe p-2 z-20"
                  >
                    {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => { setSort(key); setSortOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-black/5 transition-colors"
                        style={{ color: sort === key ? 'var(--color-gold)' : 'var(--color-ink)', fontWeight: sort === key ? 600 : 400 }}
                      >
                        {sortLabels[key]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {activeCategory && activeCategory.subcategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide mb-8 pb-1">
            <button
              onClick={() => setSubcategory(null)}
              className="text-xs font-medium px-3.5 py-2 rounded-full border whitespace-nowrap transition-all duration-200"
              style={{
                borderColor: !filters.subcategory ? 'var(--color-gold)' : 'var(--color-border)',
                color: !filters.subcategory ? 'var(--color-gold)' : 'var(--color-muted)',
              }}
            >
              All {activeCategory.name}
            </button>
            {activeCategory.subcategories.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setSubcategory(sc.id)}
                className="text-xs font-medium px-3.5 py-2 rounded-full border whitespace-nowrap transition-all duration-200"
                style={{
                  borderColor: filters.subcategory === sc.id ? 'var(--color-gold)' : 'var(--color-border)',
                  color: filters.subcategory === sc.id ? 'var(--color-gold)' : 'var(--color-muted)',
                }}
              >
                {sc.name}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence>
          {activeCategory && activeSubFilterGroups && activeSubFilterGroups.length > 0 && (
            <ShopSubFilters
              categoryLabel={activeCategory.name}
              groups={activeSubFilterGroups}
              selected={subFilters}
              onToggle={toggleSubFilter}
              onClear={clearSubFilters}
            />
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-7">
            {Array.from({ length: 9 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : paginated.length === 0 ? (
          <EmptyState
            icon={FiSearch}
            title="No products found"
            description="Try adjusting your filters or search term to find what you're looking for."
            actionLabel="Reset Filters"
            actionTo="/shop"
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-7">
            {paginated.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        )}
      </div>

      <AnimatePresence>
        {refineOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50" onClick={() => setRefineOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 bottom-0 w-[86%] max-w-sm bg-white z-50 p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-lg">Filters</h3>
                <button onClick={() => setRefineOpen(false)} aria-label="Close filters panel"><FiX size={20} /></button>
              </div>
              <RefinePanel filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} maxPriceLimit={MAX_PRICE} brands={brands} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
