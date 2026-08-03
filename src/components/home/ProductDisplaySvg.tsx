export default function ProductDisplaySvg() {
  return (
    <svg viewBox="0 0 480 620" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" role="img" aria-label="Staged display of Dr. Karam AbdelRazek cosmetics products">
      <defs>
        <linearGradient id="pd-amber" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E9C97A" />
          <stop offset="100%" stopColor="#B9862F" />
        </linearGradient>
        <linearGradient id="pd-serum" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F3E3B8" />
          <stop offset="100%" stopColor="#D8B96A" />
        </linearGradient>
        <linearGradient id="pd-blush" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F1D9C8" />
          <stop offset="100%" stopColor="#E3BFA6" />
        </linearGradient>
        <linearGradient id="pd-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E4C868" />
          <stop offset="100%" stopColor="#B9862F" />
        </linearGradient>
        <linearGradient id="pd-cream" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7EEE1" />
          <stop offset="100%" stopColor="#E7D4B8" />
        </linearGradient>
        <linearGradient id="pd-mauve" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B5717B" />
          <stop offset="100%" stopColor="#8C4B57" />
        </linearGradient>
        <radialGradient id="pd-stone" cx="50%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#F1E4D0" />
          <stop offset="100%" stopColor="#D9C6A6" />
        </radialGradient>
        <filter id="pd-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#3A262A" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Backdrop arch */}
      <circle cx="270" cy="260" r="210" fill="none" stroke="#C9A227" strokeOpacity="0.3" strokeWidth="1.5" />
      <circle cx="270" cy="260" r="150" fill="#FFFFFF" fillOpacity="0.35" />

      {/* Pedestal */}
      <ellipse cx="240" cy="585" rx="185" ry="16" fill="#00000010" />
      <rect x="60" y="540" width="360" height="46" rx="10" fill="url(#pd-stone)" filter="url(#pd-shadow)" />
      <rect x="170" y="500" width="150" height="46" rx="12" fill="url(#pd-stone)" />

      {/* Perfume bottle - back left */}
      <g filter="url(#pd-shadow)">
        <rect x="70" y="300" width="76" height="150" rx="10" fill="url(#pd-amber)" />
        <rect x="70" y="300" width="76" height="150" rx="10" fill="#ffffff" fillOpacity="0.08" />
        <rect x="88" y="258" width="40" height="44" rx="8" fill="#F7EEE1" stroke="#C9A227" strokeWidth="1.5" />
        <rect x="102" y="242" width="12" height="18" rx="3" fill="#B9862F" />
        <text x="108" y="380" textAnchor="middle" fontFamily="Georgia, serif" fontSize="10" fill="#3A262A" fillOpacity="0.55" transform="rotate(0)">EAU DE</text>
        <text x="108" y="394" textAnchor="middle" fontFamily="Georgia, serif" fontSize="10" fill="#3A262A" fillOpacity="0.55">PARFUM</text>
      </g>

      {/* Serum bottle - tallest, center */}
      <g filter="url(#pd-shadow)">
        <rect x="178" y="270" width="58" height="180" rx="12" fill="url(#pd-serum)" />
        <rect x="178" y="270" width="58" height="180" rx="12" fill="#ffffff" fillOpacity="0.1" />
        <rect x="193" y="206" width="28" height="68" rx="7" fill="#3A262A" />
        <rect x="203" y="184" width="8" height="26" rx="3" fill="#3A262A" />
        <text x="207" y="330" textAnchor="middle" fontFamily="Georgia, serif" fontSize="9" fill="#3A262A" fillOpacity="0.55">LUXE</text>
        <text x="207" y="343" textAnchor="middle" fontFamily="Georgia, serif" fontSize="8" fill="#3A262A" fillOpacity="0.5">SERUM</text>
      </g>

      {/* Cream jar - front center */}
      <g filter="url(#pd-shadow)">
        <rect x="255" y="392" width="104" height="78" rx="18" fill="url(#pd-blush)" />
        <rect x="255" y="376" width="104" height="26" rx="12" fill="url(#pd-gold)" />
        <text x="307" y="432" textAnchor="middle" fontFamily="Georgia, serif" fontSize="9" fill="#5c3a30" fillOpacity="0.6">HYDRA</text>
        <text x="307" y="444" textAnchor="middle" fontFamily="Georgia, serif" fontSize="7.5" fill="#5c3a30" fillOpacity="0.5">GLOW</text>
      </g>

      {/* Tube - back right */}
      <g filter="url(#pd-shadow)">
        <rect x="345" y="298" width="52" height="150" rx="10" fill="url(#pd-cream)" />
        <path d="M345 448 q26 18 52 0 v14 q-26 14 -52 0 z" fill="url(#pd-cream)" />
        <rect x="353" y="276" width="36" height="26" rx="6" fill="url(#pd-gold)" />
        <text x="371" y="360" textAnchor="middle" fontFamily="Georgia, serif" fontSize="8" fill="#3A262A" fillOpacity="0.5">SUN</text>
        <text x="371" y="372" textAnchor="middle" fontFamily="Georgia, serif" fontSize="7" fill="#3A262A" fillOpacity="0.45">PERFECT</text>
      </g>

      {/* Lipstick - front right */}
      <g filter="url(#pd-shadow)">
        <rect x="392" y="410" width="26" height="80" rx="6" fill="url(#pd-gold)" />
        <rect x="396" y="378" width="18" height="36" rx="4" fill="url(#pd-mauve)" />
      </g>

      {/* Gold sphere accent */}
      <circle cx="150" cy="500" r="10" fill="url(#pd-gold)" filter="url(#pd-shadow)" />
    </svg>
  );
}
