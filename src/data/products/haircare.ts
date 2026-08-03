import type { Product } from '../../types';
import { placeholderImg } from './_placeholder';

export const haircareProducts: Product[] = [
  {
    id: 'p5', name: 'Argan Repair Hair Oil', slug: 'argan-repair-hair-oil', category: 'haircare',
    brand: 'Lumière', price: 980, currency: 'EGP', rating: 4.5, reviewCount: 98,
    images: [placeholderImg('hairoil1'), placeholderImg('hairoil1b')],
    shortDescription: 'Nourishing Moroccan argan oil for strength and shine.',
    description: 'Cold-pressed Moroccan argan oil blended with vitamin E to repair split ends, tame frizz and restore natural shine, without weighing hair down.',
    ingredients: ['Argan Oil', 'Vitamin E', 'Jojoba Oil'],
    benefits: ['Repairs split ends', 'Adds shine', 'Reduces frizz'],
    inStock: true, tags: ['haircare'],
    attributes: { subType: ['Oils'], concern: ['Repair', 'Shine'] },
  },
  {
    id: 'p12', name: 'Coconut Milk Hair Mask', slug: 'coconut-milk-hair-mask', category: 'haircare',
    brand: 'Noir Botanics', price: 760, currency: 'EGP', rating: 4.4, reviewCount: 61,
    images: [placeholderImg('hairmask1'), placeholderImg('hairmask1b')],
    shortDescription: 'Deep conditioning mask for dry, damaged hair.',
    description: 'A rich, weekly treatment mask infused with coconut milk and biotin that deeply conditions and rebuilds strength in dry or chemically treated hair.',
    ingredients: ['Coconut Milk', 'Biotin', 'Keratin'],
    benefits: ['Deep conditioning', 'Strengthens hair', 'Adds softness'],
    inStock: true, isNew: true, tags: ['haircare'],
    attributes: { subType: ['Masks'], concern: ['Repair'] },
  },
];
