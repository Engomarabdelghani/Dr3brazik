export const SITE_NAME = 'Dr. Karam AbdelRazek';
export const SITE_URL = 'https://dr3brazik.com';
export const WHATSAPP_NUMBER = '2001061959922'; // TODO: replace with real business number
export const CURRENCY = 'EGP';

export const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Shop', path: '/shop' },
  { label: 'Offers', path: '/offers' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

export const SOCIAL_LINKS = [
  { label: 'Instagram', url: 'https://www.instagram.com/dr_3brazik/' },
  { label: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61589185443012' },
  { label: 'TikTok', url: 'https://www.tiktok.com/@dr_3brazik?is_from_webapp=1&sender_device=pc' },
  { label: 'WhatsApp', url: `https://wa.me/${WHATSAPP_NUMBER}` },
];

export function buildWhatsAppOrderMessage(params: {
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  discount?: number;
  shippingPrice: number;
  total: number;
  customerName: string;
  customerPhone: string;
  address: string;
  governorate: string;
  notes?: string;
}) {
  const lines = [
    `Hello ${SITE_NAME}, I'd like to place an order:`,
    '',
    'Order Details:',
    ...params.items.map((i) => `• ${i.name} x${i.quantity} — ${i.price * i.quantity} EGP`),
    '',
    `Subtotal: ${params.subtotal} EGP`,
  ];
  if (params.discount) lines.push(`Discount: -${params.discount} EGP`);
  lines.push(
    `Shipping (${params.governorate}): ${params.shippingPrice} EGP`,
    `Total: ${params.total} EGP`,
    '',
    'Customer Details:',
    `Name: ${params.customerName}`,
    `Phone: ${params.customerPhone}`,
    `Governorate: ${params.governorate}`,
    `Address: ${params.address}`,
  );
  if (params.notes) lines.push(`Notes: ${params.notes}`);
  return encodeURIComponent(lines.join('\n'));
}

/** Lightweight "I'm interested in this product" message — used on the Product Details page (outside Checkout). */
export function buildWhatsAppProductInquiryMessage(params: { name: string; quantity: number; price: number }) {
  const lines = [
    `Hello ${SITE_NAME}, I'm interested in this product:`,
    '',
    `• ${params.name} x${params.quantity} — ${params.price * params.quantity} EGP`,
  ];
  return encodeURIComponent(lines.join('\n'));
}
