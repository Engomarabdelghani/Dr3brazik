export interface Filters {
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  maxPrice: number;
  inStockOnly: boolean;
}

export default function RefinePanel({ filters, onChange, maxPriceLimit, brands }: {
  filters: Filters; onChange: (f: Filters) => void; maxPriceLimit: number; brands: string[];
}) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-semibold text-sm mb-4 tracking-wide">Brand</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onChange({ ...filters, brand: null })}
            className="text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors"
            style={{
              borderColor: !filters.brand ? 'var(--color-ink)' : 'var(--color-border)',
              backgroundColor: !filters.brand ? 'var(--color-ink)' : 'transparent',
              color: !filters.brand ? '#fff' : 'var(--color-ink)',
            }}
          >
            All Brands
          </button>
          {brands.map((b) => (
            <button
              key={b}
              onClick={() => onChange({ ...filters, brand: b })}
              className="text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors"
              style={{
                borderColor: filters.brand === b ? 'var(--color-ink)' : 'var(--color-border)',
                backgroundColor: filters.brand === b ? 'var(--color-ink)' : 'transparent',
                color: filters.brand === b ? '#fff' : 'var(--color-ink)',
              }}
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
        <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>Up to {filters.maxPrice.toLocaleString()} EGP</p>
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
    </div>
  );
}
