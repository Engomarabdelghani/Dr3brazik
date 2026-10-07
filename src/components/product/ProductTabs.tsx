import { useState } from 'react';
import { FiCheck } from 'react-icons/fi';
import type { Product } from '../../types';
import { useTranslation } from 'react-i18next';

const sampleFaqs = ['faqUse', 'faqSensitive', 'faqReturn'] as const;

// Reviews are switched off until the feature is rebuilt on the new API (owner decision, 4 Oct 2026).
const tabs = ['Description', 'Ingredients', 'Benefits', 'FAQ'] as const;
type Tab = typeof tabs[number];

interface ProductTabsProps {
  product: Product;
}

export default function ProductTabs({ product }: ProductTabsProps) {
  const { t } = useTranslation();
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
            {t(`productDetails.${tab.toLowerCase()}Tab`)}
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
            {sampleFaqs.map((faq) => (
              <div key={faq}>
                <p className="font-semibold text-sm mb-1.5">{t(`productDetails.${faq}Question`)}</p>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{t(`productDetails.${faq}Answer`)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
