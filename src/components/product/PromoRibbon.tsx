import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import type { ProductPromotion } from '../../hooks/usePromotions';
import { useLocalized } from '../../hooks/usePromotions';
import { PROMO_ICONS } from './PromoBadge';
import { useTranslation } from 'react-i18next';

/** Scroll speed in px per second: slow enough to read without chasing the text. */
const SPEED = 32;

/**
 * A card's offers as a soft ribbon that drifts by slowly: every offer's sentence
 * in a row, repeated so the loop never shows a gap. Opens the offer details.
 */
export default function PromoRibbon({ promotions, onOpen }: { promotions: ProductPromotion[]; onOpen: () => void }) {
  const { t } = useTranslation();
  const text = useLocalized();
  const viewport = useRef<HTMLDivElement>(null);
  const unit = useRef<HTMLDivElement>(null);
  // How many times the offers are repeated in each half of the track, and how long one half takes to pass.
  const [loop, setLoop] = useState({ repeat: 1, seconds: 12 });

  const sentences = promotions.map((p) => text(p.summary));

  useLayoutEffect(() => {
    const measure = () => {
      if (!viewport.current || !unit.current) return;
      const unitWidth = unit.current.offsetWidth;
      if (!unitWidth) return;
      const repeat = Math.max(1, Math.ceil(viewport.current.offsetWidth / unitWidth));
      setLoop({ repeat, seconds: (unitWidth * repeat) / SPEED });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (viewport.current) observer.observe(viewport.current);
    return () => observer.disconnect();
  }, [sentences.join('|')]);

  const Icon = PROMO_ICONS[promotions[0].kind];
  const items = (copy: number) =>
    sentences.map((sentence, i) => (
      <Fragment key={`${copy}-${i}`}>
        <span className="promo-ribbon-text">{sentence}</span>
        <span className="promo-ribbon-sep" aria-hidden="true">✦</span>
      </Fragment>
    ));

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={`${t('promotions.viewDetails')}: ${sentences.join('. ')}`}
      className="promo-ribbon"
    >
      <span className="promo-ribbon-icon" aria-hidden="true">
        <Icon size={13} />
      </span>
      <div ref={viewport} className="promo-ribbon-viewport" aria-hidden="true">
        <div className="promo-ribbon-track" style={{ animationDuration: `${loop.seconds}s` }}>
          {[0, 1].map((half) => (
            <div key={half} className="flex shrink-0 items-center">
              {Array.from({ length: loop.repeat }, (_, r) => (
                <div key={r} ref={half === 0 && r === 0 ? unit : undefined} className="flex shrink-0 items-center">
                  {items(r)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}
