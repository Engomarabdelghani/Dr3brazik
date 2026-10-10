export default function MaintenancePage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 py-16 text-center"
      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-coffee)' }}
      aria-labelledby="maintenance-title"
    >
      <div className="w-full max-w-xl">
        <img
          src="/images/logo.png"
          alt="Dr. Karam AbdelRazek"
          className="h-14 w-auto object-contain mx-auto mb-12"
        />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-4" style={{ color: 'var(--color-gold)' }}>
          Store maintenance
        </p>
        <h1 id="maintenance-title" className="text-4xl md:text-5xl font-semibold leading-tight mb-5">
          We’ll be back soon
        </h1>
        <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          Our online store is temporarily unavailable while we make improvements. Please check back shortly.
        </p>
      </div>
    </main>
  );
}