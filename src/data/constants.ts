export const SITE_NAME = 'Dr. Karam AbdelRazek';
export const WHATSAPP_NUMBER = '2001063919780'; // TODO: replace with real business number
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
  total: number;
  customerName?: string;
}) {
  const lines = [
    `Hello ${SITE_NAME}, I'd like to place an order:`,
    '',
    ...params.items.map((i) => `• ${i.name} x${i.quantity} — ${i.price * i.quantity} EGP`),
    '',
    `Total: ${params.total} EGP`,
  ];
  if (params.customerName) lines.push('', `Name: ${params.customerName}`);
  return encodeURIComponent(lines.join('\n'));
}
