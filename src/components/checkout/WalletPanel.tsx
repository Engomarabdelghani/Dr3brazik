import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiCopy, FiInfo } from 'react-icons/fi';
import { usePaymentSettings } from '../../lib/api/settings';
import { CopyButton, PayerNumberStep, ProofStep, Step, useCopy, type InstapayErrors, type PaymentProof } from './InstapayPanel';

/** 01063919780 → "010 6391 9780", the way Egyptian numbers are read out. */
const spaced = (number: string) => number.replace(/^(\d{3})(\d{4})(\d+)$/, '$1 $2 $3');

/**
 * Vodafone Cash, step by step like InstaPay: transfer the total to the shop's number
 * (it copies with one tap), say which number it came from, attach the transfer SMS
 * or a screenshot of it. Same fields and same rules as InstaPay.
 */
export default function WalletPanel({
  amount,
  amountReady,
  pricing,
  customerPhone,
  payerNumber,
  onPayerNumberChange,
  proof,
  onProofChange,
  onUploadingChange,
  errors,
}: {
  /** The order total, delivery included. */
  amount: number;
  /** False until delivery is known: the customer is told to choose it first, so the total they transfer is final. */
  amountReady: boolean;
  pricing: boolean;
  customerPhone: string;
  payerNumber: string;
  onPayerNumberChange: (value: string) => void;
  proof: PaymentProof | null;
  onProofChange: (proof: PaymentProof | null) => void;
  onUploadingChange: (uploading: boolean) => void;
  errors: InstapayErrors;
}) {
  const { t } = useTranslation();
  const { vodafoneCashNumber } = usePaymentSettings();
  const { copied, copy } = useCopy(vodafoneCashNumber);
  const [numberCopied, setNumberCopied] = useState(false);

  return (
    <div className="px-4 pb-5 pt-1 md:px-5">
      <div className="h-px mb-5" style={{ backgroundColor: 'var(--color-border)' }} />
      <ol>
        <Step index={1} title={t('checkout.instapayStepPay')} done={numberCopied}>
          <div className="rounded-2xl p-4 flex items-center justify-between gap-3" style={{ backgroundColor: 'var(--color-cream)' }}>
            <div className="min-w-0">
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{t('checkout.instapayAmount')}</p>
              <p className="text-xl font-extrabold tabular-nums" style={{ color: 'var(--color-heading)', opacity: pricing ? 0.5 : 1 }} aria-busy={pricing}>
                {amountReady ? `${amount.toLocaleString('en-US')} EGP` : '—'}
              </p>
            </div>
            {amountReady && <CopyButton value={String(amount)} />}
          </div>

          <button
            type="button"
            onClick={() => {
              setNumberCopied(true);
              void copy();
            }}
            className="instapay-pay mt-3"
            aria-label={`${t('checkout.walletNumber')} ${vodafoneCashNumber}`}
          >
            <span className="w-13 h-13 rounded-xl bg-white shrink-0 flex items-center justify-center" style={{ color: copied ? '#16a34a' : '#e60000' }}>
              {copied ? <FiCheck size={22} /> : <FiCopy size={22} />}
            </span>
            <span className="flex-1 min-w-0 text-start">
              <span className="block text-xs opacity-80">{t('checkout.walletNumber')}</span>
              <span className="block font-bold text-lg tabular-nums whitespace-nowrap" dir="ltr" style={{ textAlign: 'inherit' }}>{spaced(vodafoneCashNumber)}</span>
            </span>
            <span className="text-xs font-semibold shrink-0 whitespace-nowrap" aria-live="polite">{copied ? t('checkout.copied') : t('checkout.walletTapToCopy')}</span>
          </button>

          {!amountReady && (
            <p className="offer-note offer-note-hint text-xs mt-3">
              <FiInfo size={14} className="shrink-0 mt-0.5" /> {t('checkout.instapayAmountPending')}
            </p>
          )}
        </Step>

        <PayerNumberStep index={2} customerPhone={customerPhone} payerNumber={payerNumber} onPayerNumberChange={onPayerNumberChange} error={errors.payerNumber} />
        <ProofStep
          index={3}
          title={t('checkout.walletStepProof')}
          chooseHint={t('checkout.walletChooseHint')}
          proof={proof}
          onProofChange={onProofChange}
          onUploadingChange={onUploadingChange}
          error={errors.proof}
        />
      </ol>
    </div>
  );
}
