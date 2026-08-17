export interface ProductImage {
  url: string;
  path: string | null;
  position: number;
}

export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  category: string; // category slug — used throughout the existing storefront
  categoryId?: string; // uuid — used by admin forms
  subcategory?: string; // subcategory slug
  subcategoryId?: string; // uuid
  brand: string;
  price: number;
  oldPrice?: number;
  effectivePrice?: number; // live price after any active offer (see products_with_effective_price view)
  currency: string;
  rating: number;
  reviewCount: number;
  images: string[]; // flattened, ordered URLs — existing components use this shape
  imageObjects?: ProductImage[]; // full objects (url/path/position) — used by the admin image manager
  shortDescription: string;
  description: string;
  ingredients: string[];
  benefits: string[];
  howToUse?: string;
  warnings?: string;
  inStock: boolean;
  stock?: number;
  sku?: string;
  barcode?: string;
  metaTitle?: string;
  metaDescription?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isVisible?: boolean;
  isFlashSale?: boolean;
  discountPercent?: number;
  tags: string[];
  attributes?: Record<string, string[]>;
  isDeal?: boolean; // true for synthetic "cart items" built from a shoppable promo banner — not a real catalog product
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest' | 'rating';

export type DiscountType = 'percent' | 'fixed' | 'bogo';
export type OfferTargetType = 'products' | 'category';

export interface Offer {
  id: string;
  title: string;
  discountType: DiscountType;
  discountValue: number;
  targetType: OfferTargetType;
  categoryId?: string;
  productIds?: string[];
  bannerImage?: string;
  startDate: string;
  endDate: string;
  isEnabled: boolean;
  // BOGO ("buy X get Y at Z% off") — only meaningful when discountType === 'bogo'
  bogoBuyQty: number;
  bogoGetQty: number;
  bogoGetDiscountPercent: number;
}

export interface PromoBanner {
  id: string;
  title: string;
  image: string;
  link?: string;
  price?: number; // when set, tapping the banner on the storefront adds it straight to cart instead of navigating to `link`
  sortOrder: number;
  isEnabled: boolean;
}

export interface ShippingZone {
  id: string;
  name: string;
  price: number;
  sortOrder: number;
  isEnabled: boolean;
}

export interface SocialPost {
  id: string;
  link: string;
  image: string; // required — a real screenshot/thumbnail from the video, uploaded by the admin
  isVideo: boolean;
  sortOrder: number;
  isEnabled: boolean;
}

export interface SiteSettings {
  siteName: string;
  logoUrl?: string;
  faviconUrl?: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  email?: string;
  address?: string;
  heroImages: string[];
  seoTitle?: string;
  seoDescription?: string;
}