import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

export default function AnimatedCounter({ to, suffix = '', label }: { to: number; suffix?: string; label: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * to));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
      <div className="text-4xl md:text-5xl font-extrabold" style={{ color: 'var(--color-coffee)' }}>
        {value.toLocaleString('en-US')}{suffix}
      </div>
      <div className="mt-2 text-sm tracking-wide" style={{ color: 'var(--color-muted)' }}>{label}</div>
    </motion.div>
  );
}
