import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/** Builds a compact page list like [1, 2, 3, '…', 14] instead of listing every page. */
function buildPageList(current: number, total: number): (number | '…')[] {
  const delta = 1; // how many neighbors to show around the current page
  const pages: (number | '…')[] = [];
  const range = new Set<number>([1, total, current, current - delta, current + delta, current - delta - 1, current + delta + 1]);

  let prev = 0;
  for (const p of Array.from(range).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)) {
    if (prev && p - prev > 1) pages.push('…');
    pages.push(p);
    prev = p;
  }
  return pages;
}

export default function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  const pages = buildPageList(page, totalPages);

  const pillStyle = (active: boolean) => ({
    backgroundColor: active ? 'var(--color-ink)' : 'transparent',
    color: active ? '#fff' : 'var(--color-ink)',
    border: active ? 'none' : '1px solid var(--color-border)',
  });

  return (
    <div className="flex items-center justify-center gap-1.5 mt-14 flex-wrap">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-40"
        style={pillStyle(false)}
      >
        <FiChevronLeft size={15} />
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-sm" style={{ color: 'var(--color-muted)' }}>
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-label={`Page ${p}`}
            aria-current={page === p ? 'page' : undefined}
            className="w-9 h-9 rounded-full text-sm font-semibold transition-colors"
            style={pillStyle(page === p)}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Next page"
        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-40"
        style={pillStyle(false)}
      >
        <FiChevronRight size={15} />
      </button>
    </div>
  );
}
