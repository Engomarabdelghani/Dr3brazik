export default function PriceTag({ price, oldPrice, currency = 'EGP', size = 'md' }: {
  price: number; oldPrice?: number; currency?: string; size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-3xl',
  };
  return (
    <div className="flex items-baseline gap-2">
      <span className={`font-bold ${sizes[size]}`} style={{ color: 'var(--color-ink)' }}>
        {price.toLocaleString()} {currency}
      </span>
      {oldPrice && (
        <span className="text-sm line-through" style={{ color: 'var(--color-muted)' }}>
          {oldPrice.toLocaleString()} {currency}
        </span>
      )}
    </div>
  );
}
