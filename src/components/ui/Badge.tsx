type BadgeTone = 'gold' | 'ink' | 'success' | 'muted' | 'bogo';

const toneStyles: Record<BadgeTone, { bg: string; color: string }> = {
  gold: { bg: 'rgba(201,162,39,0.12)', color: 'var(--color-gold)' },
  ink: { bg: 'var(--color-ink)', color: '#fff' },
  success: { bg: 'rgba(34,197,94,0.12)', color: '#16a34a' },
  muted: { bg: 'rgba(107,114,128,0.12)', color: 'var(--color-muted)' },
  bogo: { bg: 'var(--color-ink)', color: 'var(--color-gold-light)' },
};

export default function Badge({ children, tone = 'gold' }: { children: React.ReactNode; tone?: BadgeTone }) {
  const style = toneStyles[tone];
  return (
    <span className="badge-luxe" style={{ backgroundColor: style.bg, color: style.color }}>
      {children}
    </span>
  );
}
