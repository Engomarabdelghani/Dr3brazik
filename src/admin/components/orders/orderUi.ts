import type { IconType } from 'react-icons';
import { FiInbox, FiCheckCircle, FiTruck, FiPackage, FiXCircle } from 'react-icons/fi';
import type { OrderStatus } from '../../../types';

export interface StatusMeta {
  value: OrderStatus;
  label: string;
  color: string;
  bg: string;
  icon: IconType;
}

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  new: { value: 'new', label: 'New', color: '#2563eb', bg: 'rgba(37,99,235,0.1)', icon: FiInbox },
  confirmed: { value: 'confirmed', label: 'Confirmed', color: '#b7791f', bg: 'rgba(192,138,99,0.16)', icon: FiCheckCircle },
  shipped: { value: 'shipped', label: 'Shipped', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', icon: FiTruck },
  delivered: { value: 'delivered', label: 'Delivered', color: '#16a34a', bg: 'rgba(34,197,94,0.12)', icon: FiPackage },
  cancelled: { value: 'cancelled', label: 'Cancelled', color: '#dc2626', bg: 'rgba(239,68,68,0.1)', icon: FiXCircle },
};

export const STATUS_ORDER: OrderStatus[] = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'];

/** The normal path an order moves along; cancelled sits outside it. */
export const FLOW: OrderStatus[] = ['new', 'confirmed', 'shipped', 'delivered'];

/** The one obvious next step for an order, if any. */
export function nextStep(status: OrderStatus): { to: OrderStatus; label: string } | null {
  if (status === 'new') return { to: 'confirmed', label: 'Confirm order' };
  if (status === 'confirmed') return { to: 'shipped', label: 'Mark as shipped' };
  if (status === 'shipped') return { to: 'delivered', label: 'Mark as delivered' };
  return null;
}

export const money = (n: number) => `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} EGP`;

export const fullDate = (iso: string) => new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const paymentLabel = (m: 'cod' | 'wallet' | null) => (m === 'wallet' ? 'Instapay / Wallet' : m === 'cod' ? 'Cash on delivery' : '—');

/** Egyptian numbers as typed at checkout (01…, +20…, 0020…) → wa.me format (201…). */
export function whatsappNumber(phone: string): string | null {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) digits = `2${digits}`;
  return digits.length >= 10 ? digits : null;
}

/** "S-0513", or "#13" for an order the server sent without a code (an older API version). */
export function orderLabel(order: { orderCode?: string | null; orderNumber: number }): string {
  return order.orderCode || `#${order.orderNumber}`;
}

export function whatsappLink(phone: string, name: string, orderCode: string): string | null {
  const number = whatsappNumber(phone);
  if (!number) return null;
  const text = `Hello ${name.split(' ')[0]}, this is Dr3brazik about your order ${orderCode}.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
