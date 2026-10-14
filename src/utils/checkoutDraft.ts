/**
 * What the customer has typed at checkout, kept for the life of the tab.
 * Paying by InstaPay means leaving for the banking app, and phones often reload
 * the page on the way back: without this the form would come back empty.
 */
export interface CheckoutDraft {
  form: { name: string; phone: string; address: string; governorateId: string; cityId: string; notes: string };
  payment: 'cod' | 'card' | 'instapay';
  payerNumber: string;
  /** The uploaded transfer screenshot (its picture is not kept, only that it was sent). */
  proof: { key: string; name: string } | null;
}

const KEY = 'dk-checkout-draft';

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

export function readCheckoutDraft(): CheckoutDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<CheckoutDraft> | null;
    const form: Partial<CheckoutDraft['form']> = saved?.form ?? {};
    const proof = saved?.proof;
    return {
      form: {
        name: text(form.name),
        phone: text(form.phone),
        address: text(form.address),
        governorateId: text(form.governorateId),
        cityId: text(form.cityId),
        notes: text(form.notes),
      },
      payment: saved?.payment === 'card' || saved?.payment === 'instapay' ? saved.payment : 'cod',
      payerNumber: text(saved?.payerNumber),
      proof: proof && typeof proof.key === 'string' ? { key: proof.key, name: text(proof.name) } : null,
    };
  } catch {
    return null;
  }
}

export function saveCheckoutDraft(draft: CheckoutDraft): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* private mode / storage full: the form still works, it just isn't remembered */
  }
}

export function clearCheckoutDraft(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}
