'use client';

import Link from 'next/link';

export function Logo({
  size = 'md',
  href = '/',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  /** Merged on the root link; use for nav alignment (e.g. pl-0). */
  className?: string;
}) {
  const dim = size === 'sm' ? 26 : size === 'lg' ? 36 : 30;
  const textClass =
    size === 'sm'
      ? 'text-sm font-medium'
      : size === 'lg'
        ? 'text-base font-semibold sm:text-lg'
        : 'text-[15px] font-semibold';
  return (
    <Link
      href={href}
      className={`group inline-flex min-w-0 items-center gap-2.5 font-display text-ink transition-opacity hover:opacity-90 sm:gap-3 ${className}`}
      aria-label="Justice OS — Home"
    >
      <span
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: dim, height: dim }}
      >
        {/* Tricolor pinwheel mark — first (left) in reading order */}
        <svg viewBox="0 0 32 32" width={dim} height={dim} aria-hidden="true">
          <defs>
            <radialGradient id="logoCore" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#fbf7f2" />
            </radialGradient>
          </defs>
          <circle cx="16" cy="16" r="15.5" fill="url(#logoCore)" stroke="rgb(var(--c-line-strong))" strokeWidth="0.5" />
          <path d="M16 4 L20 14 L16 16 Z" fill="#f57c00" />
          <path d="M28 16 L18 20 L16 16 Z" fill="#2f9e44" />
          <path d="M16 28 L12 18 L16 16 Z" fill="#3b6def" />
          <path d="M4 16 L14 12 L16 16 Z" fill="#1c233c" className="dark:fill-white" />
          <circle cx="16" cy="16" r="2.4" fill="#1c233c" className="dark:fill-white" />
        </svg>
      </span>
      <span className={`min-w-0 tracking-tight ${textClass}`}>
        Justice<span className="text-saffron-500">OS</span>
      </span>
    </Link>
  );
}
