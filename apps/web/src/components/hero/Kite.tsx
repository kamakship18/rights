'use client';

/**
 * Stylised tricolor kite with leaf decoration & string —
 * sits to the left of the hero composition.
 */
export function Kite({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 360"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="kiteSaffron" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="#fbb15c" />
          <stop offset="100%" stopColor="#dd6900" />
        </linearGradient>
        <linearGradient id="kiteWhite" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f3eede" />
        </linearGradient>
        <linearGradient id="kiteGreen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#79cf91" />
          <stop offset="100%" stopColor="#1c5d29" />
        </linearGradient>
        <radialGradient id="leafG" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0%"  stopColor="#a9e2b8" />
          <stop offset="100%" stopColor="#247a35" />
        </radialGradient>
        <filter id="kiteShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
          <feOffset dx="3" dy="8" />
          <feComponentTransfer><feFuncA type="linear" slope="0.4" /></feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#kiteShadow)">
        {/* Main diamond body */}
        {/* Saffron triangle (top) */}
        <path d="M 120 14 L 218 110 L 22 110 Z" fill="url(#kiteSaffron)" />
        {/* White band (middle) */}
        <path d="M 22 110 L 218 110 L 120 235 Z" fill="url(#kiteWhite)" />
        {/* Green diamond bottom — overlay */}
        <path d="M 50 175 L 120 235 L 190 175 L 120 235 Z" fill="url(#kiteGreen)" opacity="0" />
        {/* Slight green tip overlay for tri-band feel */}
        <path d="M 70 200 L 120 235 L 170 200 Q 145 220 120 235 Q 95 220 70 200 Z" fill="url(#kiteGreen)" />

        {/* Gloss highlight on saffron */}
        <path d="M 120 14 L 80 70 L 120 50 Z" fill="#fff" opacity="0.35" />
        {/* Subtle highlight on white */}
        <path d="M 120 110 L 100 160 L 120 175 Z" fill="#fff" opacity="0.5" />

        {/* Cross spars */}
        <line x1="120" y1="14" x2="120" y2="235" stroke="#5b3712" strokeWidth="2.5" opacity="0.55" />
        <line x1="22"  y1="110" x2="218" y2="110" stroke="#5b3712" strokeWidth="2.5" opacity="0.55" />
        {/* Center bobble */}
        <circle cx="120" cy="110" r="7" fill="#fff5eb" stroke="#5b3712" strokeWidth="1.6" />
      </g>

      {/* String + small bows + leaf */}
      <path
        d="M 120 235 C 100 270, 140 290, 110 320 C 95 335, 120 345, 110 360"
        stroke="#7a4d18" strokeWidth="2" fill="none" opacity="0.7"
      />
      <ellipse cx="118" cy="258" rx="11" ry="5" fill="url(#kiteSaffron)" transform="rotate(-12 118 258)" />
      <ellipse cx="106" cy="284" rx="11" ry="5" fill="url(#kiteWhite)"   transform="rotate(10 106 284)" />
      {/* Leaf at bottom */}
      <g transform="translate(110 340) rotate(-18)">
        <path
          d="M 0 0 C -18 -8, -20 -38, 0 -50 C 20 -38, 18 -8, 0 0 Z"
          fill="url(#leafG)"
        />
        <path d="M 0 -2 L 0 -48" stroke="#1c5d29" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
