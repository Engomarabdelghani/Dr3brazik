import { supabase } from '../supabase';
import type { Category, Subcategory } from '../../data/taxonomy';

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  name_ar: string | null;
  image: string | null;
  description: string | null;
  sort_order: number;
}

export interface SubcategoryRow {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  sort_order: number;
}

export async function fetchCategoryRows(): Promise<CategoryRow[]> {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function fetchSubcategoryRows(): Promise<SubcategoryRow[]> {
  const { data, error } = await supabase.from('subcategories').select('*').order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function fetchCategories(): Promise<Category[]> {
  const [cats, subs] = await Promise.all([fetchCategoryRows(), fetchSubcategoryRows()]);
  return cats.map((c) => ({
    id: c.slug,
    name: c.name,
    nameAr: c.name_ar ?? undefined,
    image: c.image ?? '',
    subcategories: subs
      .filter((s) => s.category_id === c.id)
      .map((s): Subcategory => ({ id: s.slug, name: s.name })),
  }));
}

export async function createCategory(input: { slug: string; name: string; nameAr?: string; image?: string; description?: string }) {
  const { error } = await supabase.from('categories').insert({
    slug: input.slug, name: input.name, name_ar: input.nameAr ?? null, image: input.image ?? null, description: input.description ?? null,
  });
  if (error) throw error;
}

export async function updateCategory(id: string, input: { slug: string; name: string; nameAr?: string; image?: string; description?: string }) {
  const { error } = await supabase.from('categories').update({
    slug: input.slug, name: input.name, name_ar: input.nameAr ?? null, image: input.image ?? null, description: input.description ?? null,
  }).eq('id', id);
  if (error) throw error;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function createSubcategory(categoryId: string, input: { slug: string; name: string }) {
  const { error } = await supabase.from('subcategories').insert({ category_id: categoryId, slug: input.slug, name: input.name });
  if (error) throw error;
}

export async function updateSubcategory(id: string, input: { slug: string; name: string }) {
  const { error } = await supabase.from('subcategories').update({ slug: input.slug, name: input.name }).eq('id', id);
  if (error) throw error;
}

export async function deleteSubcategory(id: string) {
  const { error } = await supabase.from('subcategories').delete().eq('id', id);
  if (error) throw error;
}
