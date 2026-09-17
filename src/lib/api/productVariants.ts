import { supabase } from '../supabase';
import type { ProductVariant } from '../../types';

interface ProductVariantRow {
  id: string;
  product_id: string;
  color_name: string;
  color_hex: string | null;
  image: string;
  sort_order: number;
}

function mapVariant(row: ProductVariantRow): ProductVariant {
  return {
    id: row.id,
    colorName: row.color_name,
    colorHex: row.color_hex ?? undefined,
    image: row.image,
    sortOrder: row.sort_order,
  };
}

export async function fetchVariantsForProduct(productId: string): Promise<ProductVariant[]> {
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order');

  if (error) throw error;
  return (data ?? []).map(mapVariant);
}
