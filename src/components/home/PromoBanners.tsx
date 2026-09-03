import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiShoppingBag, FiPackage } from 'react-icons/fi';
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
 *
 * Each slide shows the FULL uploaded image, never cropped, regardless of its
 * aspect ratio — a blurred, scaled copy of the same image fills any leftover
 * space behind it (same technique as Instagram/Facebook story banners), so
 * admins never have to fight image dimensions to avoid an ugly crop.
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
      <section className="w-full">
        <div className="skeleton w-full h-[220px] sm:h-[320px] md:h-[420px] lg:h-[500px]" />
      </section>
    );
  }

  const current = active[index];
  const isDeal = current.actionType === 'deal' && Boolean(current.price && current.price > 0);
  const isBundle = current.actionType === 'bundle' && Boolean(current.productIds?.length);
  const isShoppable = isDeal; // only a flat-price deal adds straight to cart; a bundle navigates to a collection page

  const onTap = () => {
    if (draggedRef.current) return; // it was a swipe, not a tap — don't act
    if (isDeal) {
      addItem(bannerToDealProduct(current), 1); // addItem also opens the cart drawer
      return;
    }
    if (isBundle) {
      navigate(`/collection/${current.id}`);
      return;
    }
    if (!current.link) return;
    if (current.link.startsWith('http')) window.open(current.link, '_blank', 'noopener,noreferrer');
    else navigate(current.link);
  };

  return (
    <section className="w-full bg-[#f5e7e5]">
      <div className="relative w-full h-[240px] sm:h-[320px] md:h-[420px] lg:h-[560px] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.55),_rgba(245,231,229,0.7)_35%,_rgba(244,227,222,0.96)_100%)]" />
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={current.id}
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
              setTimeout(() => { draggedRef.current = false; }, 50);
            }}
            onClick={onTap}
            className={`absolute inset-0 ${active.length > 1 ? 'cursor-grab active:cursor-grabbing' : (current.link || isShoppable || isBundle) ? 'cursor-pointer' : ''}`}
          >
            <img
              src={current.image}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#f7e5e2]/30 via-transparent to-[#f6dfe7]/15" />
            <img
              src={current.image}
              alt={current.title}
              draggable={false}
              className="relative w-full h-full object-contain select-none scale-[1.03]"
            />
          </motion.div>
        </AnimatePresence>

        {isDeal && (
          <div
            className="absolute bottom-3 right-3 z-10 flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-full font-bold text-sm shadow-lg pointer-events-none"
            style={{ backgroundColor: 'var(--color-gold)', color: '#fff' }}
          >
            <span>{current.price!.toLocaleString('en-US')} EGP</span>
            <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center"><FiShoppingBag size={13} /></span>
          </div>
        )}
        {isBundle && (
          <div
            className="absolute bottom-3 right-3 z-10 flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-full font-bold text-sm shadow-lg pointer-events-none"
            style={{ backgroundColor: 'var(--color-gold)', color: '#fff' }}
          >
            <span>Shop {current.productIds!.length} Products</span>
            <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center"><FiPackage size={13} /></span>
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
