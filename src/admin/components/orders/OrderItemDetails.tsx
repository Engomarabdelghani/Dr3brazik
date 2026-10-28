import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiEdit2, FiImage, FiX } from 'react-icons/fi';
import type { AdminOrder } from '../../../api/types';
import { fetchProductById } from '../../../lib/api/products';
import { money } from './orderUi';

export type OrderLine = AdminOrder['lines'][number];

/** Square product image, or a placeholder when the product has none. */
export function ItemThumb({ src, alt, size = 48 }: { src: string | null | undefined; alt: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className="shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
      style={{ width: size, height: size, backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
    >
      {src && !failed ? <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" onError={() => setFailed(true)} /> : <FiImage size={size / 3} />}
    </span>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span style={{ color: 'var(--color-muted)' }}>{label}</span>
      <span className="text-right font-medium min-w-0 break-words">{children}</span>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5" style={{ color: 'var(--color-muted)' }}>{title}</p>
      <div className="text-sm whitespace-pre-line">{children}</div>
    </div>
  );
}

const TYPE_LABELS: Record<OrderLine['itemType'], string> = { product: 'Product', deal: 'Banner deal', gift: 'Free gift' };

/**
 * One order line in full: what the order saved (name, price, quantity) and the product as it is
 * now in the catalogue (images, stock, description…). Deals have no product, only the line.
 */
export default function OrderItemDetails({ line, onClose }: { line: OrderLine; onClose: () => void }) {
  const { data: product, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'product', line.productId],
    queryFn: () => fetchProductById(line.productId!),
    enabled: line.productId !== null,
  });
  const images = product?.images.length ? product.images : line.image ? [line.image] : [];
  const [active, setActive] = useState(0);

  useEffect(() => {
    // Capture phase: Escape closes this panel only, not the order drawer underneath.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const net = line.lineTotal - line.promotionDiscount;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={line.name}
        className="w-full sm:max-w-2xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-bg)' }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b bg-white" style={{ borderColor: 'var(--color-border)' }}>
          <div className="min-w-0">
            <h4 className="text-lg font-extrabold break-words">{line.name}</h4>
            {product?.nameAr && <p className="text-sm" dir="rtl" style={{ color: 'var(--color-muted)' }}>{product.nameAr}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors">
            <FiX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
            {/* Images */}
            <div>
              <div className="aspect-square rounded-2xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--color-cream)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
                {isLoading && !line.image ? (
                  <div className="w-full h-full bg-black/5 animate-pulse" />
                ) : images[active] ? (
                  <a href={images[active]} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    <img src={images[active]} alt={line.name} className="w-full h-full object-contain" />
                  </a>
                ) : (
                  <FiImage size={36} />
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                  {images.map((src, i) => (
                    <button
                      key={src}
                      onClick={() => setActive(i)}
                      className="w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-colors"
                      style={{ borderColor: i === active ? 'var(--color-gold)' : 'transparent' }}
                      aria-label={`Image ${i + 1}`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* In this order */}
            <div className="rounded-2xl bg-white p-4 shadow-sm self-start" style={{ border: '1px solid var(--color-border)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-1" style={{ color: 'var(--color-muted)' }}>In this order</p>
              <Row label="Type">{TYPE_LABELS[line.itemType]}</Row>
              <Row label="Quantity">{line.quantity}</Row>
              <Row label="Unit price">
                {line.itemType === 'gift' ? 'Free' : money(line.unitPrice)}
                {line.unitPrice < line.unitBasePrice && <span className="line-through font-normal ml-1.5" style={{ color: 'var(--color-muted)' }}>{money(line.unitBasePrice)}</span>}
              </Row>
              {line.itemType === 'gift' && <Row label="Gift value">{money(line.unitBasePrice)}</Row>}
              <Row label="Line total">{money(line.lineTotal)}</Row>
              {line.promotionDiscount > 0 && <Row label="Promotion discount"><span style={{ color: '#16a34a' }}>-{money(line.promotionDiscount)}</span></Row>}
              {line.promotionDiscount > 0 && <Row label="Paid">{money(net)}</Row>}
              {line.sku && <Row label="SKU (at order)">{line.sku}</Row>}
              {line.stockShortfall > 0 && (
                <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>
                  <FiAlertTriangle size={10} /> {line.stockShortfall} beyond stock
                </p>
              )}
            </div>
          </div>

          {/* The product now */}
          {line.productId === null ? (
            line.itemType === 'deal' ? (
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>A deal from a promo banner: it has no product page of its own.</p>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>This product has since been deleted; only what the order saved is shown.</p>
            )
          ) : isError ? (
            <p className="text-sm p-3 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#dc2626' }}>
              Could not load the product. <button onClick={() => refetch()} className="underline font-semibold">Try again</button>
            </p>
          ) : isLoading ? (
            <div className="space-y-2 animate-pulse">{[1, 2, 3].map((k) => <div key={k} className="h-5 rounded bg-black/5" />)}</div>
          ) : !product ? (
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>This product has since been deleted; only what the order saved is shown.</p>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl bg-white p-4 shadow-sm" style={{ border: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--color-muted)' }}>Product now</p>
                  <Link to={`/admin/products/${product.id}/edit`} className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: 'var(--color-gold)' }}>
                    <FiEdit2 size={12} /> Edit product
                  </Link>
                </div>
                {product.brand && <Row label="Brand">{product.brand}</Row>}
                {product.category && <Row label="Category">{product.subcategory ? `${product.category} / ${product.subcategory}` : product.category}</Row>}
                <Row label="Price">
                  {money(product.price)}
                  {product.oldPrice !== undefined && <span className="line-through font-normal ml-1.5" style={{ color: 'var(--color-muted)' }}>{money(product.oldPrice)}</span>}
                </Row>
                {product.effectivePrice !== undefined && product.effectivePrice < product.price && <Row label="With promotions">{money(product.effectivePrice)}</Row>}
                <Row label="Stock">
                  <span style={{ color: product.inStock ? undefined : '#dc2626' }}>{product.stock ?? (product.inStock ? 'In stock' : 'Out of stock')}</span>
                </Row>
                {product.sku && <Row label="SKU">{product.sku}</Row>}
                {product.barcode && <Row label="Barcode">{product.barcode}</Row>}
                {product.maxOrderQuantity !== undefined && <Row label="Max per order">{product.maxOrderQuantity}</Row>}
                <Row label="Visible in shop">{product.isVisible === false ? 'Hidden' : 'Yes'}</Row>
                {product.variants && product.variants.length > 0 && (
                  <Row label="Colours">
                    <span className="inline-flex flex-wrap justify-end gap-1.5">
                      {product.variants.map((v) => (
                        <span key={v.id} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-cream)' }}>
                          {v.colorHex && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.colorHex }} />}
                          {v.colorName}
                        </span>
                      ))}
                    </span>
                  </Row>
                )}
                {product.attributes &&
                  Object.entries(product.attributes).map(([k, values]) => (
                    <Row key={k} label={k}>{values.join(', ')}</Row>
                  ))}
              </div>

              {product.shortDescription && <Block title="Short description">{product.shortDescription}</Block>}
              {product.description && <Block title="Description">{product.description}</Block>}
              {product.benefits.length > 0 && (
                <Block title="Benefits">
                  <ul className="list-disc pl-5 space-y-0.5">{product.benefits.map((b) => <li key={b}>{b}</li>)}</ul>
                </Block>
              )}
              {product.ingredients.length > 0 && <Block title="Ingredients">{product.ingredients.join(', ')}</Block>}
              {product.howToUse && <Block title="How to use">{product.howToUse}</Block>}
              {product.warnings && <Block title="Warnings">{product.warnings}</Block>}
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.map((t) => (
                    <span key={t} className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-cream)', color: 'var(--color-coffee)' }}>#{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
