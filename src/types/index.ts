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
  maxOrderQuantity?: number; // admin-set cap on how many units of this product a customer can order at once
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

export type PromoBannerAction = 'link' | 'deal' | 'bundle';

export interface PromoBanner {
  id: string;
  title: string;
  image: string;
  link?: string;
  price?: number; // when actionType === 'deal', tapping the banner adds a single synthetic item at this flat price
  actionType: PromoBannerAction;
  productIds?: string[]; // when actionType === 'bundle' — the real products added to cart, each at its own real price
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

export interface Testimonial {
  id: string;
  image: string; // required — a real screenshot (WhatsApp message, review site, etc.), uploaded by the admin
  sortOrder: number;
  isEnabled: boolean;
}

export type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number; // price at the time the order was placed
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  governorate: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingPrice: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export type CouponDiscountType = 'percent' | 'fixed';
export type CouponTargetType = 'all' | 'products';

export interface Coupon {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  targetType: CouponTargetType;
  productIds?: string[]; // only when targetType === 'products'
  minOrderAmount?: number;
  startDate?: string;
  endDate?: string;
  isEnabled: boolean;
  isPublic: boolean; // when false, the coupon still works when typed manually, but never appears in the site-wide announcement bar
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
