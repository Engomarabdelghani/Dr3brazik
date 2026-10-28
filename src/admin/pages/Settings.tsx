import { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Display only: the switch is not saved anywhere and changes nothing; it is back on every
 * time the page opens. Order item images always show.
 */
export default function Settings() {
  const [showOrderImages, setShowOrderImages] = useState(true);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>How the admin dashboard looks and behaves.</p>
      </div>

      <div className="card-luxe divide-y" style={{ borderColor: 'var(--color-border)' }}>
        <div className="p-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold">Show images on the Orders page</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>Show each item's product image in the order details.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showOrderImages}
            aria-label="Show images on the Orders page"
            onClick={() => setShowOrderImages((v) => !v)}
            className="relative w-12 h-7 shrink-0 rounded-full transition-colors"
            style={{ backgroundColor: showOrderImages ? 'var(--color-gold)' : 'var(--color-border)' }}
          >
            <motion.span
              className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow"
              initial={false}
              animate={{ x: showOrderImages ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
