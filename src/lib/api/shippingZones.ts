import { supabase } from '../supabase';
import type { ShippingZone, ShippingCity } from '../../types';

interface ShippingCityRow {
  id: string;
  zone_id: string;
  name: string;
  price: number;
  sort_order: number;
  is_enabled: boolean;
}

interface ShippingZoneRow {
  id: string;
  name: string;
  price: number;
  sort_order: number;
  is_enabled: boolean;
  shipping_cities?: ShippingCityRow[];
}

function mapCity(row: ShippingCityRow): ShippingCity {
  return {
    id: row.id, zoneId: row.zone_id, name: row.name, price: Number(row.price),
    sortOrder: row.sort_order, isEnabled: row.is_enabled,
  };
}

function mapZone(row: ShippingZoneRow): ShippingZone {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    sortOrder: row.sort_order,
    isEnabled: row.is_enabled,
    cities: (row.shipping_cities ?? []).map(mapCity).sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export async function fetchShippingZones(): Promise<ShippingZone[]> {
  const { data, error } = await supabase
    .from('shipping_zones')
    .select('*, shipping_cities(*)')
    .order('sort_order');
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

export interface ShippingCityInput {
  zoneId: string;
  name: string;
  price: number;
  sortOrder: number;
  isEnabled: boolean;
}

export async function createShippingCity(input: ShippingCityInput): Promise<void> {
  const { error } = await supabase.from('shipping_cities').insert({
    zone_id: input.zoneId, name: input.name, price: input.price,
    sort_order: input.sortOrder, is_enabled: input.isEnabled,
  });
  if (error) throw error;
}

export async function updateShippingCity(id: string, input: ShippingCityInput): Promise<void> {
  const { error } = await supabase.from('shipping_cities').update({
    zone_id: input.zoneId, name: input.name, price: input.price,
    sort_order: input.sortOrder, is_enabled: input.isEnabled,
  }).eq('id', id);
  if (error) throw error;
}

export async function deleteShippingCity(id: string): Promise<void> {
  const { error } = await supabase.from('shipping_cities').delete().eq('id', id);
  if (error) throw error;
}
