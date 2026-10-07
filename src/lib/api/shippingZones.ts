import { api } from '../../api/client';
import type { ShippingZone } from '../../types';

/** Storefront: enabled governorates with their enabled cities. */
export async function fetchShippingZones(): Promise<ShippingZone[]> {
  return api.get<ShippingZone[]>('/shipping-zones');
}

/** Admin: every governorate and city. */
export async function fetchAdminShippingZones(): Promise<ShippingZone[]> {
  return api.get<ShippingZone[]>('/admin/shipping-zones');
}

export interface ShippingZoneInput {
  name: string;
  price: number;
  sortOrder: number;
  isEnabled: boolean;
}

export async function createShippingZone(input: ShippingZoneInput): Promise<void> {
  await api.post('/admin/shipping-zones', input);
}

export async function updateShippingZone(id: string, input: ShippingZoneInput): Promise<void> {
  await api.put(`/admin/shipping-zones/${id}`, input);
}

export async function deleteShippingZone(id: string): Promise<void> {
  await api.delete(`/admin/shipping-zones/${id}`);
}

export interface ShippingCityInput {
  zoneId: string;
  name: string;
  price: number;
  sortOrder: number;
  isEnabled: boolean;
}

export async function createShippingCity(input: ShippingCityInput): Promise<void> {
  await api.post('/admin/shipping-cities', input);
}

export async function updateShippingCity(id: string, input: ShippingCityInput): Promise<void> {
  await api.put(`/admin/shipping-cities/${id}`, input);
}

export async function deleteShippingCity(id: string): Promise<void> {
  await api.delete(`/admin/shipping-cities/${id}`);
}
