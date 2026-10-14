import { useId, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { FiAlertCircle, FiCheck, FiCopy, FiExternalLink, FiImage, FiInfo, FiTrash2, FiUploadCloud } from 'react-icons/fi';
import { isApiError } from '../../api/client';
import { INSTAPAY_ADDRESS, INSTAPAY_LINK } from '../../data/constants';
import { uploadPaymentProof } from '../../lib/api/orders';
import { compressImage } from '../../utils/imageCompression';

/** The uploaded transfer screenshot. `previewUrl` is missing after a page reload (only the key is remembered). */
export interface PaymentProof {
  key: string;
  name: string;
  previewUrl?: string;
}

export interface InstapayErrors {
  payerNumber?: string;
  proof?: string;
}

/** Same rule as the server: digits with an optional leading +, spaces or dashes. */
export const isPayerNumber = (value: string) => /^\+?[0-9][0-9\s-]{6,24}$/.test(value.trim());

const SEND_AS_IS_BYTES = 700 * 1024;

/** Phones set to Arabic type ٠١٢…; the number is stored in Latin digits. */
const toLatinDigits = (value: string) => value.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0));

function CopyButton({ value }: { value: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the value is on screen anyway */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0"
      style={{ backgroundColor: copied ? 'rgba(34,197,94,0.12)' : '#fff', color: copied ? '#16a34a' : 'var(--color-coffee)', border: '1px solid var(--color-border)' }}
    >
      {copied ? <FiCheck size={13} /> : <FiCopy size={13} />}
      <span aria-live="polite">{copied ? t('checkout.copied') : t('checkout.copy')}</span>
    </button>
  );
}

function Step({ index, title, done, last, children }: { index: number; title: string; done: boolean; last?: boolean; children: ReactNode }) {
  return (
    <li className="flex gap-3.5">
      <div className="flex flex-col items-center">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors"
          style={{ backgroundColor: done ? 'var(--color-gold)' : 'var(--color-cream)', color: done ? '#fff' : 'var(--color-coffee)' }}
          aria-hidden="true"
        >
          {done ? <FiCheck size={14} /> : index}
        </span>
        {!last && <span className="flex-1 w-px mt-2" style={{ backgroundColor: 'var(--color-border)' }} />}
      </div>
      <div className={`flex-1 min-w-0 ${last ? '' : 'pb-6'}`}>
        <p className="font-semibold text-sm leading-7">{title}</p>
        <div className="mt-2.5">{children}</div>
      </div>
    </li>
  );
}

const FieldError = ({ id, message }: { id?: string; message?: string }) =>
  message ? (
    <p id={id} role="alert" className="flex items-center gap-1.5 text-xs mt-2" style={{ color: '#dc2626' }}>
      <FiAlertCircle size={13} className="shrink-0" /> {message}
    </p>
  ) : null;

/**
 * The three things an InstaPay order needs, in the order the customer does them:
 * transfer the total, say which number it came from, attach the screenshot.
 * The screenshot is uploaded as soon as it is picked, so placing the order stays instant.
 */
export default function InstapayPanel({
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
  const ids = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [opened, setOpened] = useState(false);
  const [uploading, setUploading] = useState<{ name: string; previewUrl: string } | null>(null);
  const [uploadError, setUploadError] = useState('');

  const phone = customerPhone.trim();
  const canReusePhone = isPayerNumber(phone) && payerNumber.trim() !== phone;
  const proofError = uploadError || errors.proof;
  const shown = uploading ?? proof;

  const replaceProof = (next: PaymentProof | null) => {
    if (proof?.previewUrl) URL.revokeObjectURL(proof.previewUrl);
    onProofChange(next);
  };

  const onPick = async (file: File | undefined) => {
    if (!file || uploading) return;
    if (file.type && !file.type.startsWith('image/')) {
      setUploadError(t('checkout.instapayNotImage'));
      return;
    }
    setUploadError('');
    const previewUrl = URL.createObjectURL(file);
    setUploading({ name: file.name, previewUrl });
    onUploadingChange(true);
    try {
      // Big screenshots (1–5 MB) are downscaled so they upload in a moment on mobile data;
      // small ones go as they are, so the amount and the names stay as sharp as they were.
      const image = file.size > SEND_AS_IS_BYTES ? await compressImage(file, 2600, 0.85).catch(() => file) : file;
      const key = await uploadPaymentProof(image);
      replaceProof({ key, name: file.name, previewUrl });
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      setUploadError(isApiError(err, 'UNSUPPORTED_FILE') ? t('checkout.instapayNotImage') : isApiError(err, 'RATE_LIMITED') ? err.message : t('checkout.instapayUploadError'));
    } finally {
      setUploading(null);
      onUploadingChange(false);
    }
  };

  return (
    <div className="px-4 pb-5 pt-1 md:px-5">
      <div className="h-px mb-5" style={{ backgroundColor: 'var(--color-border)' }} />
      <ol>
        <Step index={1} title={t('checkout.instapayStepPay')} done={opened}>
          <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: 'var(--color-cream)' }}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{t('checkout.instapayAmount')}</p>
                <p className="text-xl font-extrabold tabular-nums" style={{ color: 'var(--color-heading)', opacity: pricing ? 0.5 : 1 }} aria-busy={pricing}>
                  {amountReady ? `${amount.toLocaleString('en-US')} EGP` : '—'}
                </p>
              </div>
              {amountReady && <CopyButton value={String(amount)} />}
            </div>
            <div className="h-px" style={{ backgroundColor: 'var(--color-border)' }} />
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{t('checkout.instapayTo')}</p>
                <p className="font-semibold text-sm truncate" dir="ltr">{INSTAPAY_ADDRESS}</p>
              </div>
              <CopyButton value={INSTAPAY_ADDRESS} />
            </div>
          </div>

          {/* Opens the InstaPay app (or its web page) straight on the shop's account. */}
          <a href={INSTAPAY_LINK} target="_blank" rel="noopener noreferrer" onClick={() => setOpened(true)} className="instapay-pay mt-3">
            <img src="/images/instapay.png" alt="" width={52} height={52} className="w-13 h-13 rounded-xl bg-white shrink-0" />
            <span className="flex-1 min-w-0 text-start">
              <span className="block font-bold text-base">{t('checkout.instapayOpen')}</span>
              <span className="block text-xs opacity-80">{t('checkout.instapayOpenHint')}</span>
            </span>
            <FiExternalLink size={18} className="rtl-flip shrink-0" />
          </a>
          {!amountReady && (
            <p className="offer-note offer-note-hint text-xs mt-3">
              <FiInfo size={14} className="shrink-0 mt-0.5" /> {t('checkout.instapayAmountPending')}
            </p>
          )}
        </Step>

        <Step index={2} title={t('checkout.instapayStepNumber')} done={isPayerNumber(payerNumber)}>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            value={payerNumber}
            onChange={(e) => onPayerNumberChange(toLatinDigits(e.target.value))}
            placeholder={t('checkout.instapayNumberPlaceholder')}
            aria-label={t('checkout.instapayStepNumber')}
            aria-invalid={Boolean(errors.payerNumber)}
            aria-describedby={errors.payerNumber ? `${ids}-number-error` : undefined}
            className="input-luxe text-start"
            style={errors.payerNumber ? { borderColor: '#dc2626' } : undefined}
          />
          {canReusePhone && (
            <button
              type="button"
              onClick={() => onPayerNumberChange(toLatinDigits(phone))}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: 'var(--color-cream)', color: 'var(--color-coffee)' }}
            >
              {t('checkout.instapaySamePhone')} · <span dir="ltr">{phone}</span>
            </button>
          )}
          <FieldError id={`${ids}-number-error`} message={errors.payerNumber} />
        </Step>

        <Step index={3} title={t('checkout.instapayStepProof')} done={Boolean(proof) && !uploading} last>
          {/* Kept mounted so "Change" can reopen the picker; reset after each pick so the same file can be chosen again. */}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            disabled={Boolean(uploading)}
            onChange={(e) => {
              void onPick(e.target.files?.[0]);
              e.target.value = '';
            }}
          />

          {shown ? (
            // On a phone the two actions sit on their own line instead of squeezing the text.
            <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 rounded-2xl p-3" style={{ border: '1.5px solid var(--color-border)', backgroundColor: '#fff' }}>
              {shown.previewUrl ? (
                <img src={shown.previewUrl} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" style={{ opacity: uploading ? 0.5 : 1 }} />
              ) : (
                <span className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-cream)', color: 'var(--color-gold)' }}>
                  <FiImage size={20} />
                </span>
              )}
              <div className="min-w-0" aria-live="polite">
                <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: uploading ? 'var(--color-coffee)' : '#16a34a' }}>
                  {uploading ? (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" aria-hidden="true" />
                  ) : (
                    <FiCheck size={15} className="shrink-0" />
                  )}
                  {t(uploading ? 'checkout.instapayUploading' : 'checkout.instapayUploaded')}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}><bdi>{shown.name}</bdi></p>
              </div>
              {!uploading && (
                <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-1">
                  <button type="button" onClick={() => fileInput.current?.click()} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--color-cream)', color: 'var(--color-coffee)' }}>
                    {t('checkout.instapayChange')}
                  </button>
                  <button
                    type="button"
                    onClick={() => replaceProof(null)}
                    aria-label={t('checkout.remove')}
                    title={t('checkout.remove')}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-red-50"
                    style={{ color: '#dc2626' }}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              aria-describedby={proofError ? `${ids}-proof-error` : undefined}
              className="w-full flex flex-col items-center gap-1.5 rounded-2xl px-4 py-6 text-center cursor-pointer transition-colors hover:bg-[var(--color-cream)]"
              style={{ border: `1.5px dashed ${proofError ? '#dc2626' : 'var(--color-gold)'}` }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void onPick(e.dataTransfer.files?.[0]);
              }}
            >
              <FiUploadCloud size={24} style={{ color: 'var(--color-gold)' }} />
              <span className="font-semibold text-sm">{t('checkout.instapayChoose')}</span>
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{t('checkout.instapayChooseHint')}</span>
            </button>
          )}
          <FieldError id={`${ids}-proof-error`} message={proofError} />

          <p className="flex items-center gap-1.5 text-xs mt-4" style={{ color: 'var(--color-muted)' }}>
            <FiInfo size={13} className="shrink-0" /> {t('checkout.instapayReview')}
          </p>
        </Step>
      </ol>
    </div>
  );
}
