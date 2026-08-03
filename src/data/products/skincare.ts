import type { Product } from '../../types';
import { placeholderImg } from './_placeholder';

/**
 * Skincare products. Copy an existing entry to add a new one — just paste
 * your Cloudinary image URLs straight into `images: [...]` (the cld() helper
 * used by the display components will auto-optimize them, no extra steps).
 */
export const skincareProducts: Product[] = [
  {
    id: 'p1', name: 'Golden Radiance Serum', slug: 'golden-radiance-serum', category: 'skincare',
    brand: 'Dr. Karam', price: 2450, oldPrice: 2950, currency: 'EGP', rating: 4.8, reviewCount: 214,
    images: [placeholderImg('serum1'), placeholderImg('serum1b'), placeholderImg('serum1c')],
    shortDescription: '24k gold-infused brightening serum for a luminous, even complexion.',
    description: 'A weightless, fast-absorbing serum formulated with 24k colloidal gold, vitamin C and hyaluronic acid to visibly brighten, firm and hydrate the skin. Dermatologist-developed for daily use, morning and night.',
    ingredients: ['24K Colloidal Gold', 'Vitamin C', 'Hyaluronic Acid', 'Niacinamide', 'Squalane'],
    benefits: ['Brightens complexion', 'Reduces fine lines', 'Deep hydration', 'Evens skin tone'],
    inStock: true, isNew: true, isFeatured: true, tags: ['bestseller', 'brightening'],
    attributes: { subType: ['Serums'], concern: ['Brightening', 'Hydration'] },
  },
  {
    id: 'p2', name: 'Velvet Rose Night Cream', slug: 'velvet-rose-night-cream', category: 'skincare',
    brand: 'Velvet Atelier', price: 1890, currency: 'EGP', rating: 4.6, reviewCount: 132,
    images: [placeholderImg('cream1'), placeholderImg('cream1b')],
    shortDescription: 'Rich, restorative overnight cream with Damascus rose and peptides.',
    description: 'Sink into overnight recovery with this luxuriously rich cream, blending Damascus rose extract, ceramides and peptides to restore skin barrier and reduce the appearance of fine lines by morning.',
    ingredients: ['Damascus Rose Extract', 'Ceramides', 'Peptide Complex', 'Shea Butter'],
    benefits: ['Deep overnight repair', 'Softens fine lines', 'Restores skin barrier'],
    inStock: true, isFeatured: true, tags: ['night-care'],
    attributes: { subType: ['Creams'], concern: ['Anti-Aging', 'Hydration'] },
  },
  {
    id: 'p7', name: 'Pearl Infusion Eye Cream', slug: 'pearl-infusion-eye-cream', category: 'skincare',
    brand: 'Dr. Karam', price: 1680, currency: 'EGP', rating: 4.6, reviewCount: 154,
    images: [placeholderImg('eye1'), placeholderImg('eye1b')],
    shortDescription: 'De-puffing eye cream with pearl extract and caffeine.',
    description: 'A cooling, lightweight eye cream that visibly reduces puffiness and dark circles with pearl extract, caffeine and peptides.',
    ingredients: ['Pearl Extract', 'Caffeine', 'Peptides', 'Cucumber Extract'],
    benefits: ['Reduces puffiness', 'Brightens dark circles', 'Cooling effect'],
    inStock: true, isFeatured: true, tags: ['eye-care'],
    attributes: { subType: ['Eye Care'], concern: ['Anti-Aging'] },
  },
  {
    id: 'p10', name: 'Retinol Renewal Complex', slug: 'retinol-renewal-complex', category: 'skincare',
    brand: 'Dr. Karam', price: 2150, oldPrice: 2600, currency: 'EGP', rating: 4.8, reviewCount: 176,
    images: [placeholderImg('retinol1'), placeholderImg('retinol1b')],
    shortDescription: 'Encapsulated retinol for smoother, firmer skin overnight.',
    description: 'A clinically-dosed, encapsulated retinol formula that minimizes irritation while delivering visible improvements in texture, tone and fine lines.',
    ingredients: ['Encapsulated Retinol', 'Bakuchiol', 'Ceramides'],
    benefits: ['Smooths texture', 'Reduces fine lines', 'Gentle on skin'],
    inStock: true, isFlashSale: true, discountPercent: 18, tags: ['anti-aging'],
    attributes: { subType: ['Serums'], concern: ['Anti-Aging'] },
  },
];
