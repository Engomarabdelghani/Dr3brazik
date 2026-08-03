import type { Product } from '../../types';
import { placeholderImg } from './_placeholder';

export const bodycareProducts: Product[] = [
  {
    id: 'p6', name: 'Champagne Body Butter', slug: 'champagne-body-butter', category: 'bodycare',
    brand: 'Velvet Atelier', price: 1120, currency: 'EGP', rating: 4.4, reviewCount: 76,
    images: [placeholderImg('body1'), placeholderImg('body1b')],
    shortDescription: 'Whipped shea body butter with a subtle champagne shimmer.',
    description: 'An indulgent whipped body butter that melts into skin, leaving a subtly luminous champagne shimmer and 48-hour hydration.',
    ingredients: ['Shea Butter', 'Cocoa Butter', 'Mica Shimmer'],
    benefits: ['48h hydration', 'Subtle shimmer finish', 'Fast-absorbing'],
    inStock: true, isNew: true, tags: ['body'],
    attributes: { subType: ['Body Butter'] },
  },
];
