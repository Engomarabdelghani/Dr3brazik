export default function PriceTag({ price, oldPrice, currency = 'EGP', size = 'md' }: {
  price: number; oldPrice?: number; currency?: string; size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-3xl',
  };
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={`font-bold whitespace-nowrap ${sizes[size]}`} style={{ color: 'var(--color-ink)' }}>
        {price.toLocaleString('en-US')} {currency}
      </span>
      {oldPrice && (
        <span className="text-xs whitespace-nowrap line-through" style={{ color: 'var(--color-muted)' }}>
          {oldPrice.toLocaleString('en-US')} {currency}
        </span>
      )}
    </div>
  );
}
