import { useTranslation } from 'react-i18next';
import { FiCheck, FiCopy, FiInfo } from 'react-icons/fi';
import { VODAFONE_CASH_NUMBER } from '../../data/constants';
import { CopyButton, useCopy } from './InstapayPanel';

/** 01063919780 → "010 6391 9780", the way Egyptian numbers are read out. */
const spaced = (number: string) => number.replace(/^(\d{3})(\d{4})(\d+)$/, '$1 $2 $3');

/** Vodafone Cash: the amount and the shop's number, which copies with one tap. */
export default function WalletPanel({ amount, amountReady, pricing }: { amount: number; amountReady: boolean; pricing: boolean }) {
  const { t } = useTranslation();
  const { copied, copy } = useCopy(VODAFONE_CASH_NUMBER);

  return (
    <div className="px-4 pb-5 pt-1 md:px-5">
      <div className="h-px mb-5" style={{ backgroundColor: 'var(--color-border)' }} />
      <div className="rounded-2xl p-4 flex items-center justify-between gap-3" style={{ backgroundColor: 'var(--color-cream)' }}>
        <div className="min-w-0">
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{t('checkout.instapayAmount')}</p>
          <p className="text-xl font-extrabold tabular-nums" style={{ color: 'var(--color-heading)', opacity: pricing ? 0.5 : 1 }} aria-busy={pricing}>
            {amountReady ? `${amount.toLocaleString('en-US')} EGP` : '—'}
          </p>
        </div>
        {amountReady && <CopyButton value={String(amount)} />}
      </div>

      <button type="button" onClick={copy} className="instapay-pay mt-3" aria-label={`${t('checkout.walletNumber')} ${VODAFONE_CASH_NUMBER}`}>
        <span className="w-13 h-13 rounded-xl bg-white shrink-0 flex items-center justify-center" style={{ color: copied ? '#16a34a' : '#e60000' }}>
          {copied ? <FiCheck size={22} /> : <FiCopy size={22} />}
        </span>
        <span className="flex-1 min-w-0 text-start">
          <span className="block text-xs opacity-80">{t('checkout.walletNumber')}</span>
          <span className="block font-bold text-lg tabular-nums whitespace-nowrap" dir="ltr" style={{ textAlign: 'inherit' }}>{spaced(VODAFONE_CASH_NUMBER)}</span>
        </span>
        <span className="text-xs font-semibold shrink-0 whitespace-nowrap" aria-live="polite">{copied ? t('checkout.copied') : t('checkout.walletTapToCopy')}</span>
      </button>

      {!amountReady && (
        <p className="offer-note offer-note-hint text-xs mt-3">
          <FiInfo size={14} className="shrink-0 mt-0.5" /> {t('checkout.instapayAmountPending')}
        </p>
      )}
      <p className="flex items-center gap-1.5 text-xs mt-4" style={{ color: 'var(--color-muted)' }}>
        <FiInfo size={13} className="shrink-0" /> {t('checkout.walletAfterTransfer')}
      </p>
    </div>
  );
}
