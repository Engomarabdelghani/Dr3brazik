import { api } from '../../api/client';
import type { Product } from '../../types';

export interface DashboardStats {
  productCount: number;
  visibleProductCount: number;
  outOfStockCount: number;
  categoryCount: number;
  promotionCount: number;
  activePromotionCount: number;
  totalImages: number;
  newOrderCount: number;
  recentProducts: Product[];
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return api.get<DashboardStats>('/admin/dashboard');
}
