const items = [
  'Dermatologist Formulated',
  '24K Gold Infused',
  'Cruelty-Free',
  'Nationwide Delivery',
  'Clinically Tested',
  'Small-Batch Crafted',
];

export default function MarqueeStrip() {
  const loop = [...items, ...items];
  return (
    <div className="overflow-hidden py-3" style={{ backgroundColor: 'var(--color-coffee)' }}>
      <div className="marquee-track">
        {loop.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-6 shrink-0">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-white whitespace-nowrap">{item}</span>
            <span style={{ color: 'var(--color-gold)' }}>✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}
