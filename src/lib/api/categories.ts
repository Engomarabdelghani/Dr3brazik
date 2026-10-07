import { api } from '../../api/client';
import type { Category } from '../../data/taxonomy';

/**
 * Admin rows keep the snake_case field names the admin pages were written
 * against (Categories, ProductForm), mapped here from the API's camelCase.
 */
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

interface AdminCategoriesResponse {
  categories: { id: string; slug: string; name: string; nameAr: string | null; image: string | null; description: string | null; sortOrder: number }[];
  subcategories: { id: string; categoryId: string; slug: string; name: string; sortOrder: number }[];
}

const fetchAdminCategories = () => api.get<AdminCategoriesResponse>('/admin/categories');

export async function fetchCategoryRows(): Promise<CategoryRow[]> {
  const { categories } = await fetchAdminCategories();
  return categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    name_ar: c.nameAr,
    image: c.image,
    description: c.description,
    sort_order: c.sortOrder,
  }));
}

export async function fetchSubcategoryRows(): Promise<SubcategoryRow[]> {
  const { subcategories } = await fetchAdminCategories();
  return subcategories.map((s) => ({ id: s.id, category_id: s.categoryId, slug: s.slug, name: s.name, sort_order: s.sortOrder }));
}

/** Storefront tree: ids are slugs. */
export async function fetchCategories(): Promise<Category[]> {
  return api.get<Category[]>('/categories');
}

type CategoryInput = { slug: string; name: string; nameAr?: string; image?: string; description?: string };

export async function createCategory(input: CategoryInput) {
  await api.post('/admin/categories', input);
}

export async function updateCategory(id: string, input: CategoryInput) {
  await api.put(`/admin/categories/${id}`, input);
}

export async function deleteCategory(id: string) {
  await api.delete(`/admin/categories/${id}`);
}

export async function createSubcategory(categoryId: string, input: { slug: string; name: string }) {
  await api.post(`/admin/categories/${categoryId}/subcategories`, input);
}

export async function updateSubcategory(id: string, input: { slug: string; name: string }) {
  await api.put(`/admin/subcategories/${id}`, input);
}

export async function deleteSubcategory(id: string) {
  await api.delete(`/admin/subcategories/${id}`);
}
