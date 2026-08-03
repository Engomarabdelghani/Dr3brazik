import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

export default function RatingStars({ rating, size = 14, showValue = false, reviewCount }: {
  rating: number; size?: number; showValue?: boolean; reviewCount?: number;
}) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5 text-gold" style={{ color: 'var(--color-gold)' }}>
        {Array.from({ length: full }).map((_, i) => <FaStar key={`f${i}`} size={size} />)}
        {hasHalf && <FaStarHalfAlt size={size} />}
        {Array.from({ length: empty }).map((_, i) => <FaRegStar key={`e${i}`} size={size} />)}
      </div>
      {showValue && <span className="text-sm font-medium text-ink">{rating.toFixed(1)}</span>}
      {reviewCount !== undefined && <span className="text-sm" style={{ color: 'var(--color-muted)' }}>({reviewCount})</span>}
    </div>
  );
}
