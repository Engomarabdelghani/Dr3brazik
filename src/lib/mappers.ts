import type { Product, ProductImage } from '../types';

export interface CategoryLookup {
  id: string;
  slug: string;
}

export function mapProduct(
  row: any,
  categoriesById: Map<string, CategoryLookup & { name: string }>,
  subcategoriesById: Map<string, { id: string; slug: string; name: string; categoryId: string }>
): Product {
  const images: ProductImage[] = ((row.images ?? []) as ProductImage[])
    .slice()
    .sort((a, b) => a.position - b.position);

  const category = row.category_id ? categoriesById.get(row.category_id) : undefined;
  const subcategory = row.subcategory_id ? subcategoriesById.get(row.subcategory_id) : undefined;

  const price = Number(row.price ?? 0);
  const effectivePrice = row.effective_price != null ? Number(row.effective_price) : undefined;

  return {
    id: row.id,
    name: row.name,
    nameAr: row.name_ar ?? undefined,
    slug: row.slug,
    category: category?.slug ?? '',
    categoryId: row.category_id ?? undefined,
    subcategory: subcategory?.slug,
    subcategoryId: row.subcategory_id ?? undefined,
    brand: row.brand ?? '',
    price,
    oldPrice: row.old_price != null ? Number(row.old_price) : undefined,
    effectivePrice,
    currency: row.currency ?? 'EGP',
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    images: images.map((i) => i.url),
    imageObjects: images,
    shortDescription: row.short_description ?? '',
    description: row.description ?? '',
    ingredients: row.ingredients ?? [],
    benefits: row.benefits ?? [],
    howToUse: row.how_to_use ?? undefined,
    warnings: row.warnings ?? undefined,
    inStock: (row.stock ?? 0) > 0,
    stock: row.stock ?? 0,
    sku: row.sku ?? undefined,
    barcode: row.barcode ?? undefined,
    metaTitle: row.meta_title ?? undefined,
    metaDescription: row.meta_description ?? undefined,
    isNew: Boolean(row.is_new),
    isFeatured: Boolean(row.is_featured),
    isBestSeller: Boolean(row.is_best_seller),
    isVisible: row.is_visible ?? true,
    isFlashSale: effectivePrice != null && effectivePrice < price,
    discountPercent: row.discount_percent != null ? Number(row.discount_percent) : undefined,
    tags: row.tags ?? [],
    attributes: Object.keys(row.attributes ?? {}).length ? row.attributes : undefined,
  };
}
