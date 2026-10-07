import { useState } from 'react';
import { FiCheck } from 'react-icons/fi';
import type { Product, FAQ } from '../../types';

const sampleFaqs: FAQ[] = [
  { question: 'How often should I use this product?', answer: 'For best results, use as directed in the description — typically once or twice daily as part of your skincare routine.' },
  { question: 'Is this suitable for sensitive skin?', answer: 'Our formulas are dermatologically tested, but we always recommend a patch test 24 hours before first use.' },
  { question: 'What is your return policy?', answer: 'Unopened products can be returned within 14 days of delivery. Contact us via WhatsApp to start a return.' },
];

// Reviews are switched off until the feature is rebuilt on the new API (owner decision, 4 Oct 2026).
const tabs = ['Description', 'Ingredients', 'Benefits', 'FAQ'] as const;
type Tab = typeof tabs[number];

interface ProductTabsProps {
  product: Product;
}

export default function ProductTabs({ product }: ProductTabsProps) {
  const [active, setActive] = useState<Tab>('Description');

  return (
    <div className="mt-20 relative">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide border-b" style={{ borderColor: 'var(--color-border)' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className="px-5 py-3 text-sm font-semibold whitespace-nowrap relative"
            style={{ color: active === tab ? 'var(--color-coffee)' : 'var(--color-muted)' }}
          >
            {tab}
            {active === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: 'var(--color-gold)' }} />
            )}
          </button>
        ))}
      </div>

      <div className="py-8 max-w-3xl">
        {active === 'Description' && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{product.description}</p>
        )}

        {active === 'Ingredients' && (
          <ul className="grid grid-cols-2 gap-3">
            {product.ingredients?.map((ing) => (
              <li key={ing} className="flex items-center gap-2 text-sm">
                <FiCheck style={{ color: 'var(--color-gold)' }} /> {ing}
              </li>
            ))}
          </ul>
        )}

        {active === 'Benefits' && (
          <ul className="grid grid-cols-2 gap-3">
            {product.benefits?.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm">
                <FiCheck style={{ color: 'var(--color-gold)' }} /> {b}
              </li>
            ))}
          </ul>
        )}

        {active === 'FAQ' && (
          <div className="space-y-5">
            {sampleFaqs.map((f) => (
              <div key={f.question}>
                <p className="font-semibold text-sm mb-1.5">{f.question}</p>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{f.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
