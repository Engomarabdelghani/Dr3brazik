export interface FilterGroup {
  key: string;
  label: string;
  options: string[];
}

/**
 * Extra "Refine {category}" facet filters shown on the Shop page underneath
 * the subcategory pills (e.g. "Finish: Matte/Dewy/Natural" for makeup).
 * "Product Type" is no longer defined here — that's now the subcategory
 * system in data/taxonomy.ts. Each option here should match a value inside
 * a product's `attributes[key]` array (the `concern` column in products.csv).
 */
export const categoryFilterConfig: Record<string, FilterGroup[]> = {
  // skincare: [
  //   { key: 'concern', label: 'Concern', options: ['Brightening', 'Anti-Aging', 'Hydration'] },
  // ],
  // makeup: [
  //   { key: 'finish', label: 'Finish', options: ['Matte', 'Dewy', 'Natural'] },
  // ],
  // haircare: [
  //   { key: 'concern', label: 'Concern', options: ['Repair', 'Shine', 'Frizz Control'] },
  // ],
};
