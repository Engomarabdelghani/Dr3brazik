// Categories and subcategories are now managed live in Supabase (Categories
// page in the admin dashboard) instead of being hard-coded here. This file
// only keeps the shared TypeScript shapes that the storefront components use.

export interface Subcategory {
  id: string; // slug
  name: string;
}

export interface Category {
  id: string; // slug
  name: string;
  nameAr?: string;
  image: string;
  subcategories: Subcategory[];
}

/** Optional suggestions shown in the admin "Brand" field — not enforced. */
export const brandSuggestions = ['Dr. Karam', 'Lumière', 'Velvet Atelier', 'Noir Botanics', 'Maison Élan'];
