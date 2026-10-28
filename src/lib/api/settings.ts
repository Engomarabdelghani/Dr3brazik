import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { INSTAPAY_ADDRESS, INSTAPAY_LINK, VODAFONE_CASH_NUMBER } from '../../data/constants';

/** Where InstaPay and Vodafone Cash transfers go; edited on the admin Settings page. */
export interface PaymentSettings {
  instapayAddress: string;
  instapayLink: string;
  vodafoneCashNumber: string;
}

/** Used until the settings load, or if the API can't be reached. */
const FALLBACK: PaymentSettings = { instapayAddress: INSTAPAY_ADDRESS, instapayLink: INSTAPAY_LINK, vodafoneCashNumber: VODAFONE_CASH_NUMBER };

export const PAYMENT_SETTINGS_KEY = ['settings', 'payment'] as const;

export async function fetchPaymentSettings(): Promise<PaymentSettings> {
  return api.get<PaymentSettings>('/settings/payment');
}

/** Checkout: the shop's current payment details. */
export function usePaymentSettings(): PaymentSettings {
  const { data } = useQuery({ queryKey: PAYMENT_SETTINGS_KEY, queryFn: fetchPaymentSettings, staleTime: 5 * 60_000 });
  return data ?? FALLBACK;
}

export async function fetchAdminPaymentSettings(): Promise<PaymentSettings> {
  return api.get<PaymentSettings>('/admin/settings/payment');
}

export async function updatePaymentSettings(input: PaymentSettings): Promise<void> {
  await api.put('/admin/settings/payment', input);
}
