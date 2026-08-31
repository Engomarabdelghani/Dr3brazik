import { supabase, PRODUCT_IMAGES_BUCKET } from '../supabase';
import { mapProduct, type CategoryLookup } from '../mappers';
import { fetchCategoryRows, fetchSubcategoryRows } from './categories';
import type { Product, ProductImage } from '../../types';

const PRODUCT_VIEW = 'products_with_effective_price';

async function buildCategoryMaps() {
  const [cats, subs] = await Promise.all([fetchCategoryRows(), fetchSubcategoryRows()]);
  const categoriesById = new Map<string, CategoryLookup & { name: string }>(
    cats.map((c) => [c.id, { id: c.id, slug: c.slug, name: c.name }])
  );
  const subcategoriesById = new Map<string, { id: string; slug: string; name: string; categoryId: string }>(
    subs.map((s) => [s.id, { id: s.id, slug: s.slug, name: s.name, categoryId: s.category_id }])
  );
  return { categoriesById, subcategoriesById, cats, subs };
}

export async function fetchStorefrontProducts(): Promise<Product[]> {
  const [{ data, error }, { categoriesById, subcategoriesById }] = await Promise.all([
    supabase.from(PRODUCT_VIEW).select('*').eq('is_visible', true).order('created_at', { ascending: false }),
    buildCategoryMaps(),
  ]);
  if (error) throw error;
  return (data ?? []).map((row) => mapProduct(row, categoriesById, subcategoriesById));
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const [{ data, error }, { categoriesById, subcategoriesById }] = await Promise.all([
    supabase.from(PRODUCT_VIEW).select('*').eq('slug', slug).eq('is_visible', true).maybeSingle(),
    buildCategoryMaps(),
  ]);
  if (error) throw error;
  if (!data) return null;
  return mapProduct(data, categoriesById, subcategoriesById);
}

export interface AdminProductQuery {
  search?: string;
  categoryId?: string;
  status?: 'all' | 'visible' | 'hidden' | 'out-of-stock';
  featured?: boolean;
  sortBy?: 'created_at' | 'name' | 'price' | 'stock';
  sortDir?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface AdminProductPage {
  products: Product[];
  total: number;
}

export async function fetchAdminProducts(query: AdminProductQuery): Promise<AdminProductPage> {
  const { categoriesById, subcategoriesById } = await buildCategoryMaps();

  let q = supabase.from(PRODUCT_VIEW).select('*', { count: 'exact' });

  if (query.search?.trim()) {
    const term = query.search.trim().replace(/[%_]/g, '');
    q = q.or(`name.ilike.%${term}%,brand.ilike.%${term}%,sku.ilike.%${term}%`);
  }
  if (query.categoryId) q = q.eq('category_id', query.categoryId);
  if (query.status === 'visible') q = q.eq('is_visible', true);
  if (query.status === 'hidden') q = q.eq('is_visible', false);
  if (query.status === 'out-of-stock') q = q.eq('stock', 0);
  if (query.featured) q = q.eq('is_featured', true);

  const sortBy = query.sortBy ?? 'created_at';
  q = q.order(sortBy, { ascending: query.sortDir === 'asc' });

  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;
  q = q.range(from, to);

  const { data, error, count } = await q;
  if (error) throw error;

  return {
    products: (data ?? []).map((row) => mapProduct(row, categoriesById, subcategoriesById)),
    total: count ?? 0,
  };
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const [{ data, error }, { categoriesById, subcategoriesById }] = await Promise.all([
    supabase.from(PRODUCT_VIEW).select('*').eq('id', id).maybeSingle(),
    buildCategoryMaps(),
  ]);
  if (error) throw error;
  if (!data) return null;
  return mapProduct(data, categoriesById, subcategoriesById);
}

export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const [{ data, error }, { categoriesById, subcategoriesById }] = await Promise.all([
    supabase.from(PRODUCT_VIEW).select('*').in('id', ids),
    buildCategoryMaps(),
  ]);
  if (error) throw error;
  return (data ?? []).map((row) => mapProduct(row, categoriesById, subcategoriesById));
}
export interface ProductInput {
  name: string;
  nameAr?: string;
  slug: string;
  brand: string;
  categoryId: string;
  subcategoryId?: string;
  description?: string;
  shortDescription?: string;
  ingredients?: string[];
  howToUse?: string;
  warnings?: string;
  benefits?: string[];
  tags?: string[];
  price: number;
  oldPrice?: number;
  currency?: string;
  discountPercent?: number;
  stock: number;
  sku?: string;
  barcode?: string;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
  isVisible?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  images: ProductImage[];
  maxOrderQuantity?: number;
}

function toRow(input: ProductInput) {
  return {
    name: input.name,
    name_ar: input.nameAr || null,
    slug: input.slug,
    brand: input.brand,
    category_id: input.categoryId,
    subcategory_id: input.subcategoryId || null,
    description: input.description ?? '',
    short_description: input.shortDescription ?? '',
    ingredients: input.ingredients ?? [],
    how_to_use: input.howToUse ?? '',
    warnings: input.warnings ?? '',
    benefits: input.benefits ?? [],
    tags: input.tags ?? [],
    price: input.price,
    old_price: input.oldPrice ?? null,
    currency: input.currency ?? 'EGP',
    discount_percent: input.discountPercent ?? null,
    stock: input.stock,
    sku: input.sku || null,
    barcode: input.barcode || null,
    is_featured: input.isFeatured ?? false,
    is_best_seller: input.isBestSeller ?? false,
    is_new: input.isNew ?? false,
    is_visible: input.isVisible ?? true,
    meta_title: input.metaTitle || null,
    meta_description: input.metaDescription || null,
    images: input.images,
    max_order_quantity: input.maxOrderQuantity ?? null,
  };
}

export async function createProduct(input: ProductInput): Promise<string> {
  const { data, error } = await supabase.from('products').insert(toRow(input)).select('id').single();
  if (error) throw error;
  return data.id;
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  const { error } = await supabase.from('products').update(toRow(input)).eq('id', id);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function duplicateProduct(id: string): Promise<string> {
  const original = await fetchProductById(id);
  if (!original) throw new Error('Product not found');

  const slug = `${original.slug}-copy-${Date.now().toString(36)}`;
  return createProduct({
    name: `${original.name} (Copy)`,
    nameAr: original.nameAr,
    slug,
    brand: original.brand,
    categoryId: original.categoryId!,
    subcategoryId: original.subcategoryId,
    description: original.description,
    shortDescription: original.shortDescription,
    ingredients: original.ingredients,
    howToUse: original.howToUse,
    warnings: original.warnings,
    benefits: original.benefits,
    tags: original.tags,
    price: original.price,
    oldPrice: original.oldPrice,
    currency: original.currency,
    discountPercent: original.discountPercent,
    stock: original.stock ?? 0,
    sku: original.sku,
    barcode: original.barcode,
    isFeatured: false,
    isBestSeller: original.isBestSeller,
    isNew: original.isNew,
    isVisible: false,
    metaTitle: original.metaTitle,
    metaDescription: original.metaDescription,
    images: original.imageObjects ?? [],
    maxOrderQuantity: original.maxOrderQuantity,
  });
}

export async function setProductVisibility(id: string, isVisible: boolean): Promise<void> {
  const { error } = await supabase.from('products').update({ is_visible: isVisible }).eq('id', id);
  if (error) throw error;
}

export async function uploadProductImage(file: File, folder: string): Promise<ProductImage> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path, position: 0 };
}

export async function deleteProductImage(path: string | null): Promise<void> {
  if (!path) return;
  await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
}
