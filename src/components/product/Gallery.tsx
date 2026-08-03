import { useState } from 'react';
import { motion } from 'framer-motion';
import { cld } from '../../utils/cloudinary';

export default function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [zooming, setZooming] = useState(false);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative rounded-3xl overflow-hidden aspect-[4/5] cursor-zoom-in"
        onMouseMove={onMouseMove}
        onMouseEnter={() => setZooming(true)}
        onMouseLeave={() => setZooming(false)}
      >
        <img
          src={cld(images[active], 1200)}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300"
          style={
            zooming
              ? { transform: 'scale(1.6)', transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
              : undefined
          }
        />
      </motion.div>
      <div className="flex gap-3 mt-4">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors"
            style={{ borderColor: active === i ? 'var(--color-gold)' : 'var(--color-border)' }}
          >
            <img src={cld(img, 160)} alt={`${name} thumbnail ${i + 1}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
