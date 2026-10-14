/** Small form pieces shared by the Promotion Builder's steps. */
import { useEffect, useId, useState, type ReactNode } from 'react';
import { FiInfo } from 'react-icons/fi';

export function Section({ title, description, children, aside }: { title: string; description?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="card-luxe p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="text-xs mt-1 leading-relaxed max-w-2xl" style={{ color: 'var(--color-muted)' }}>{description}</p>}
        </div>
        {aside}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="text-xs font-semibold mb-1.5 block">{label}</label>
      {children}
      {hint && <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: 'var(--color-muted)' }}>{hint}</p>}
    </div>
  );
}

export function TextField({ label, hint, value, onChange, placeholder, maxLength, dir }: {
  label: string; hint?: string; value: string | null; onChange: (v: string) => void; placeholder?: string; maxLength?: number; dir?: 'rtl' | 'ltr';
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <input id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} dir={dir} className="input-luxe" />
    </Field>
  );
}

/**
 * A number input that can be empty while typing. Optional fields report null;
 * required ones report NaN, which the builder's checks turn into "enter a value".
 */
export function NumberField({ label, hint, value, onChange, min = 0, max, step = 1, suffix, optional = false, placeholder }: {
  label: string; hint?: string; value: number | null; onChange: (v: number | null) => void; min?: number; max?: number; step?: number; suffix?: string; optional?: boolean; placeholder?: string;
}) {
  const id = useId();
  const shown = value === null || Number.isNaN(value) ? '' : String(value);
  const [text, setText] = useState(shown);
  // Follow outside changes (a template, a reset) without fighting the user's typing.
  useEffect(() => {
    const empty = value === null || Number.isNaN(value);
    if (text === '' ? !empty : Number(text) !== value) setText(shown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={text}
          placeholder={placeholder ?? (optional ? 'No limit' : undefined)}
          onChange={(e) => {
            setText(e.target.value);
            onChange(e.target.value === '' ? (optional ? null : Number.NaN) : Number(e.target.value));
          }}
          className={`input-luxe ${suffix ? 'input-with-suffix' : ''}`}
        />
        {suffix && <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none" style={{ color: 'var(--color-muted)' }}>{suffix}</span>}
      </div>
    </Field>
  );
}

export function SelectField<T extends string>({ label, hint, value, onChange, options }: {
  label: string; hint?: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[];
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className="input-luxe">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

/** Two or three mutually exclusive choices, each with a line saying what it means. */
export function Choice<T extends string>({ legend, value, onChange, options }: {
  legend: string; value: T; onChange: (v: T) => void; options: { value: T; label: string; help?: string }[];
}) {
  const name = useId();
  return (
    <fieldset className="min-w-0">
      <legend className="text-xs font-semibold mb-1.5">{legend}</legend>
      <div className={`grid gap-2 ${options.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <label
              key={o.value}
              className="flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--color-gold)]"
              style={{ borderColor: selected ? 'var(--color-coffee)' : 'var(--color-border)', backgroundColor: selected ? 'var(--color-cream)' : '#fff' }}
            >
              <input type="radio" name={name} checked={selected} onChange={() => onChange(o.value)} className="mt-0.5 accent-[var(--color-coffee)]" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{o.label}</span>
                {o.help && <span className="block text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--color-muted)' }}>{o.help}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Toggle({ label, help, checked, onChange, disabled }: { label: string; help?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 mt-0.5 shrink-0 accent-[var(--color-coffee)]" />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {help && <span className="block text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--color-muted)' }}>{help}</span>}
      </span>
    </label>
  );
}

export function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' | 'error' | 'success' }) {
  const styles = {
    info: { backgroundColor: 'var(--color-cream)', color: 'var(--color-plum)' },
    warn: { backgroundColor: 'rgba(234,179,8,0.14)', color: '#713f12' },
    error: { backgroundColor: 'rgba(220,38,38,0.08)', color: '#b91c1c' },
    success: { backgroundColor: 'rgba(34,197,94,0.12)', color: '#166534' },
  }[tone];
  return (
    <div className="flex gap-2.5 text-xs leading-relaxed p-3 rounded-xl" style={styles} role={tone === 'error' ? 'alert' : undefined}>
      <FiInfo className="shrink-0 mt-0.5" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function StatusPill({ status }: { status: { label: string; bg: string; color: string } }) {
  return (
    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: status.bg, color: status.color }}>
      {status.label}
    </span>
  );
}
