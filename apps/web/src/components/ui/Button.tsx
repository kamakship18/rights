'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { strings } from '@/lib/strings';

const s = strings.common;

const base =
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none';

const variants = {
  primary:
    'bg-ink text-canvas hover:opacity-90 focus-visible:outline-ink shadow-soft-xl',
  danger:
    'bg-sos-500 text-white hover:bg-sos-400 focus-visible:outline-sos-400 shadow-glow-sos/30',
  ghost:
    'bg-transparent text-ink-muted hover:bg-canvas-2 hover:text-ink',
  outline:
    'border border-line bg-card text-ink hover:bg-canvas-2 hover:border-line-strong',
  gold:
    'bg-saffron-500 text-white hover:bg-saffron-400 font-semibold focus-visible:outline-saffron-400 shadow-glow-saffron',
} as const;

const sizes = {
  sm: 'h-9 px-3 text-sm rounded-lg',
  md: 'h-10 px-5 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-xl',
  xl: 'h-14 px-8 text-lg rounded-2xl',
} as const;

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  /** Full width */
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      block = false,
      className = '',
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className={`${base} ${variants[variant]} ${sizes[size]} ${block ? 'w-full' : ''} ${className}`}
        disabled={disabled || loading}
        aria-busy={loading}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="opacity-25"
            />
            <path
              d="M4 12a8 8 0 018-8"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="opacity-75"
            />
          </svg>
        )}
        {loading ? s.loading : children}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
