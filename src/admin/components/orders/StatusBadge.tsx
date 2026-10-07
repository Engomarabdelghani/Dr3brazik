import type { OrderStatus } from '../../../types';
import { STATUS_META } from './orderUi';

export default function StatusBadge({ status, size = 'sm' }: { status: OrderStatus; size?: 'sm' | 'md' }) {
  const s = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full whitespace-nowrap ${size === 'md' ? 'text-sm px-3 py-1.5' : 'text-xs px-2.5 py-1'}`}
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      <s.icon size={size === 'md' ? 14 : 12} /> {s.label}
    </span>
  );
}
