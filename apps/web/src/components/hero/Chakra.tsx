'use client';

/**
 * Decorative chakra-style medallion — green pie wedges around a saffron core,
 * with white pinwheel petals on top. Floats on the right side of the hero.
 */
export function Chakra({ className = '' }: { className?: string }) {
  const wedgeCount = 8;
  return (
    <svg
      viewBox="0 0 260 260"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="chakraDiskBg" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%"  stopColor="#fffaf0" />
          <stop offset="100%" stopColor="#f3eede" />
        </radialGradient>
        <radialGradient id="chakraGreen" cx="0.5" cy="0.4" r="0.8">
          <stop offset="0%"  stopColor="#a9e2b8" />
          <stop offset="60%" stopColor="#2f9e44" />
          <stop offset="100%" stopColor="#1c5d29" />
        </radialGradient>
        <radialGradient id="chakraSaffron" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0%"  stopColor="#ffd28a" />
          <stop offset="60%" stopColor="#f99935" />
          <stop offset="100%" stopColor="#b25400" />
        </radialGradient>
        <radialGradient id="petalWhite" cx="0.5" cy="0.3" r="0.8">
          <stop offset="0%"  stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e9e2cd" />
        </radialGradient>
        <filter id="chakraShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
          <feOffset dx="0" dy="10" />
          <feComponentTransfer><feFuncA type="linear" slope="0.4" /></feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g transform="translate(130 130)" filter="url(#chakraShadow)">
        {/* Outer disk */}
        <circle r="120" fill="url(#chakraDiskBg)" stroke="#dab36a" strokeWidth="3" />
        {/* Green pie wedges */}
        {Array.from({ length: wedgeCount }).map((_, i) => {
          const angle = (i * 360) / wedgeCount;
          return (
            <g key={`wedge-${i}`} transform={`rotate(${angle})`}>
              <path
                d="M 0 -118
                   A 118 118 0 0 1 83 -83
                   L 56 -56
                   A 80 80 0 0 0 0 -80 Z"
                fill="url(#chakraGreen)"
              />
            </g>
          );
        })}
        {/* Inner saffron disk */}
        <circle r="56" fill="url(#chakraSaffron)" stroke="#7a4d18" strokeWidth="2" />
        {/* White pinwheel petals on top of saffron */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 360) / 8;
          return (
            <g key={`petal-${i}`} transform={`rotate(${angle})`}>
              <path
                d="M 0 -50 C -16 -42, -16 -22, 0 -10 C 16 -22, 16 -42, 0 -50 Z"
                fill="url(#petalWhite)"
                stroke="#dab36a" strokeWidth="0.6"
              />
            </g>
          );
        })}
        {/* Hub */}
        <circle r="14" fill="url(#chakraSaffron)" stroke="#7a4d18" strokeWidth="2" />
        <circle r="5"  fill="#fffaf0" />
      </g>
    </svg>
  );
}
