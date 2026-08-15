import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiShoppingBag } from 'react-icons/fi';
import { usePromoBanners } from '../../hooks/useCatalog';
import { bannerToDealProduct } from '../../lib/api/promoBanners';
import { useCart } from '../../context/CartContext';

const AUTOPLAY_MS = 5000;
const DRAG_THRESHOLD = 60; // px of horizontal drag before it counts as a swipe (not a tap)

/**
 * Full-width promo slider at the top of the Home page — e.g. "1+1", "30% Off"
 * campaign banners. Fully admin-managed from /admin/promo-banners. Auto-rotates
 * and supports swipe/drag on touch devices; tapping (without dragging) opens
 * the slide's link.
 */
export default function PromoBanners() {
  const { data: banners = [], isLoading } = usePromoBanners();
  const active = banners.filter((b) => b.isEnabled);
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const draggedRef = useRef(false);

  const goTo = useCallback((i: number) => {
    setDirection(i > index ? 1 : -1);
    setIndex(((i % active.length) + active.length) % active.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, active.length]);

  useEffect(() => {
    if (active.length < 2) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % active.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [active.length]);

  if (!isLoading && active.length === 0) return null;

  if (isLoading) {
    return (
      <section className="container-luxe pt-6 md:pt-8">
        <div className="skeleton w-full h-[180px] sm:h-[260px] md:h-[340px] rounded-3xl" />
      </section>
    );
  }

  const current = active[index];
  const isShoppable = Boolean(current.price && current.price > 0);

  const onTap = () => {
    if (draggedRef.current) return; // it was a swipe, not a tap — don't act
    if (isShoppable) {
      addItem(bannerToDealProduct(current), 1); // addItem also opens the cart drawer
      return;
    }
    if (!current.link) return;
    if (current.link.startsWith('http')) window.open(current.link, '_blank', 'noopener,noreferrer');
    else navigate(current.link);
  };

  return (
    <section className="container-luxe pt-6 md:pt-8">
      <div className="relative w-full h-[180px] sm:h-[260px] md:h-[340px] lg:h-[400px] overflow-hidden rounded-3xl">
        <AnimatePresence initial={false} mode="wait">
          <motion.img
            key={current.id}
            src={current.image}
            alt={current.title}
            initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            drag={active.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={() => { draggedRef.current = false; }}
            onDrag={(_, info) => {
              if (Math.abs(info.offset.x) > 10) draggedRef.current = true;
            }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -DRAG_THRESHOLD) goTo(index + 1);
              else if (info.offset.x > DRAG_THRESHOLD) goTo(index - 1);
              // Reset shortly after so a genuine tap right after still works next time.
              setTimeout(() => { draggedRef.current = false; }, 50);
            }}
            onClick={onTap}
            className={`absolute inset-0 w-full h-full object-cover ${active.length > 1 ? 'cursor-grab active:cursor-grabbing' : (current.link || isShoppable) ? 'cursor-pointer' : ''}`}
          />
        </AnimatePresence>

        {isShoppable && (
          <div
            className="absolute bottom-3 right-3 z-10 flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-full font-bold text-sm shadow-lg pointer-events-none"
            style={{ backgroundColor: 'var(--color-gold)', color: '#fff' }}
          >
            <span>{current.price!.toLocaleString()} EGP</span>
            <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center"><FiShoppingBag size={13} /></span>
          </div>
        )}

        {active.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous"
              onClick={() => goTo(index - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-lg z-10"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => goTo(index + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-lg z-10"
            >
              ›
            </button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10">
              {active.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => goTo(i)}
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: i === index ? 22 : 8, backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.55)' }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
