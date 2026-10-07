/**
 * The order just placed, handed from Checkout to the confirmation page.
 * Kept in sessionStorage too, so a refresh of the confirmation page still
 * shows it (it disappears when the tab is closed).
 */
export interface ConfirmedOrder {
  orderNumber: number;
  /** e.g. S-0513. Missing on orders saved by an older version of the page. */
  orderCode?: string;
  createdAt: string;
  customerName: string;
  phone: string;
  address: string;
  delivery: string;
  paymentMethod: 'cod' | 'card';
  items: { name: string; quantity: number; price: number; lineTotal: number; image?: string }[];
  subtotal: number;
  discount: number;
  shippingPrice: number;
  total: number;
  /** Only while the WhatsApp hand-off is enabled (it is switched off for now). */
  whatsappUrl?: string;
}

const KEY = 'dk-last-order';

export function saveLastOrder(order: ConfirmedOrder): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(order));
  } catch {
    /* private mode / storage full: the router state still carries it */
  }
}

export function readLastOrder(): ConfirmedOrder | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ConfirmedOrder) : null;
  } catch {
    return null;
  }
}
