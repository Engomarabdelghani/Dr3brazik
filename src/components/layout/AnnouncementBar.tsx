import { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';
import type { Coupon } from '../../types';

export const ANNOUNCEMENT_BAR_HEIGHT = 36; // px — kept in sync with Navbar's top offset and Layout's main padding

/**
 * Fixed strip above the Navbar advertising an active, storewide coupon code.
 * Only ever shows a coupon whose targetType is 'all' — a product-restricted
 * code would be misleading shown on every page regardless of what's in view.
 */
export default function AnnouncementBar({ coupon }: { coupon: Coupon }) {
  const [copied, setCopied] = useState(false);


  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard API unavailable — ignore, the code is still visible to copy manually
    }
  };

  return (
    <div
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 text-white text-xs md:text-sm font-medium px-4"
      style={{ height: ANNOUNCEMENT_BAR_HEIGHT, backgroundColor: 'var(--color-coffee)' }}
    >
      <span className="truncate">
        Use code <strong style={{ color: 'var(--color-gold-light)' }}>{coupon.code}</strong> at checkout
      </span>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shrink-0"
        style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
      >
        {copied ? <FiCheck size={11} /> : <FiCopy size={11} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
