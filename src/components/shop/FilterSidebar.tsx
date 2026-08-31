// import { categories, brands } from '../../data/products';

export interface Filters {
  category: string | null;
  brand: string | null;
  maxPrice: number;
  inStockOnly: boolean;
}

interface FilterSidebarProps {
  filters: Filters;
  onChange: (f: Filters) => void;
  maxPriceLimit: number;
  categories: { id: string; name: string }[];
  brands: string[];
}

export default function FilterSidebar({ filters, onChange, maxPriceLimit, categories, brands }: FilterSidebarProps) {
  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-8">
      <div>
        <h3 className="font-semibold text-sm mb-4 tracking-wide">Category</h3>
        <div className="space-y-2.5">
          <button
            onClick={() => onChange({ ...filters, category: null })}
            className={`block text-sm ${!filters.category ? 'font-semibold' : ''}`}
            style={{ color: !filters.category ? 'var(--color-gold)' : 'var(--color-muted)' }}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => onChange({ ...filters, category: c.id })}
              className={`block text-sm ${filters.category === c.id ? 'font-semibold' : ''}`}
              style={{ color: filters.category === c.id ? 'var(--color-gold)' : 'var(--color-muted)' }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />

      <div>
        <h3 className="font-semibold text-sm mb-4 tracking-wide">Brand</h3>
        <div className="space-y-2.5">
          <button
            onClick={() => onChange({ ...filters, brand: null })}
            className={`block text-sm ${!filters.brand ? 'font-semibold' : ''}`}
            style={{ color: !filters.brand ? 'var(--color-gold)' : 'var(--color-muted)' }}
          >
            All Brands
          </button>
          {brands.map((b) => (
            <button
              key={b}
              onClick={() => onChange({ ...filters, brand: b })}
              className={`block text-sm ${filters.brand === b ? 'font-semibold' : ''}`}
              style={{ color: filters.brand === b ? 'var(--color-gold)' : 'var(--color-muted)' }}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />

      <div>
        <h3 className="font-semibold text-sm mb-4 tracking-wide">Max Price</h3>
        <input
          type="range"
          min={0}
          max={maxPriceLimit}
          step={50}
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-[var(--color-gold)]"
        />
        <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>Up to {filters.maxPrice.toLocaleString('en-US')} EGP</p>
      </div>

      <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.inStockOnly}
          onChange={(e) => onChange({ ...filters, inStockOnly: e.target.checked })}
          className="w-4 h-4 accent-[var(--color-gold)]"
        />
        <span className="text-sm">In Stock Only</span>
      </label>
    </aside>
  );
}
