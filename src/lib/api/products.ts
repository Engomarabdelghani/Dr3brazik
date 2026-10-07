import { api, apiRequest, getOrNull } from '../../api/client';
import type { Product, ProductImage } from '../../types';
import { deleteUploadedImage, uploadImage } from './media';

export async function fetchStorefrontProducts(): Promise<Product[]> {
  return api.get<Product[]>('/products');
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  return getOrNull<Product>(`/products/${encodeURIComponent(slug)}`);
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
  const { data, meta } = await apiRequest<Product[]>('/admin/products', {
    query: {
      search: query.search?.trim(),
      categoryId: query.categoryId,
      status: query.status,
      featured: query.featured ? 'true' : undefined,
      sortBy: query.sortBy,
      sortDir: query.sortDir,
      page: query.page,
      pageSize: query.pageSize,
    },
  });
  return { products: data, total: meta?.total ?? data.length };
}

/** Admin read: hidden products included. */
export async function fetchProductById(id: string): Promise<Product | null> {
  return getOrNull<Product>(`/admin/products/${id}`);
}

export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  return api.get<Product[]>('/admin/products', { ids: ids.join(',') });
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

export async function createProduct(input: ProductInput): Promise<string> {
  return (await api.post<{ id: string }>('/admin/products', input)).id;
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  await api.put(`/admin/products/${id}`, input);
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/admin/products/${id}`);
}

/** Server copies it as "<name> (Copy)", hidden and not featured. */
export async function duplicateProduct(id: string): Promise<string> {
  return (await api.post<{ id: string }>(`/admin/products/${id}/duplicate`)).id;
}

export async function setProductVisibility(id: string, isVisible: boolean): Promise<void> {
  await api.patch(`/admin/products/${id}/visibility`, { isVisible });
}

/** `folder` is the product slug; files land in products/<slug>/ on Cloudinary. */
export async function uploadProductImage(file: File, folder: string): Promise<ProductImage> {
  const { url, key } = await uploadImage(file, `products/${folder}`);
  return { url, path: key, position: 0 };
}

export async function deleteProductImage(path: string | null): Promise<void> {
  if (path) await deleteUploadedImage({ key: path });
}
