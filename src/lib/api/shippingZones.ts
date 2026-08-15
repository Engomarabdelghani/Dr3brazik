import { supabase } from '../supabase';
import type { ShippingZone } from '../../types';

interface ShippingZoneRow {
  id: string;
  name: string;
  price: number;
  sort_order: number;
  is_enabled: boolean;
}

function mapZone(row: ShippingZoneRow): ShippingZone {
  return { id: row.id, name: row.name, price: Number(row.price), sortOrder: row.sort_order, isEnabled: row.is_enabled };
}

export async function fetchShippingZones(): Promise<ShippingZone[]> {
  const { data, error } = await supabase.from('shipping_zones').select('*').order('sort_order');
  if (error) throw error;
  return (data ?? []).map(mapZone);
}

export interface ShippingZoneInput {
  name: string;
  price: number;
  sortOrder: number;
  isEnabled: boolean;
}

export async function createShippingZone(input: ShippingZoneInput): Promise<void> {
  const { error } = await supabase.from('shipping_zones').insert({
    name: input.name, price: input.price, sort_order: input.sortOrder, is_enabled: input.isEnabled,
  });
  if (error) throw error;
}

export async function updateShippingZone(id: string, input: ShippingZoneInput): Promise<void> {
  const { error } = await supabase.from('shipping_zones').update({
    name: input.name, price: input.price, sort_order: input.sortOrder, is_enabled: input.isEnabled,
  }).eq('id', id);
  if (error) throw error;
}

export async function deleteShippingZone(id: string): Promise<void> {
  const { error } = await supabase.from('shipping_zones').delete().eq('id', id);
  if (error) throw error;
}
