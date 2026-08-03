import { FiMinus, FiPlus } from 'react-icons/fi';

export default function QuantityStepper({ value, onChange, min = 1, max = 99 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="inline-flex items-center rounded-full border" style={{ borderColor: 'var(--color-border)' }}>
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
      >
        <FiMinus size={14} />
      </button>
      <span className="w-8 text-center font-semibold text-sm">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
      >
        <FiPlus size={14} />
      </button>
    </div>
  );
}
