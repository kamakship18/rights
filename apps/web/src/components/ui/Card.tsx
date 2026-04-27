'use client';

import { type HTMLAttributes, forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

const variantStyles = {
  default:
    'border-line bg-card backdrop-blur-xl shadow-card',
  danger:
    'border-sos-200/80 bg-sos-50/90 dark:border-sos-500/30 dark:bg-sos-900/30 backdrop-blur-xl shadow-glow-sos/10',
  highlight:
    'border-saffron-200 bg-saffron-50/80 dark:border-saffron-500/20 dark:bg-saffron-500/5 backdrop-blur-xl',
  ghost:
    'border-transparent bg-transparent shadow-none',
} as const;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof variantStyles;
  /** Enable hover lift animation */
  hoverable?: boolean;
  /** Glow effect */
  glow?: boolean;
  /** Disable padding */
  noPadding?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      hoverable = false,
      glow = false,
      noPadding = false,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const glowClass =
      glow && variant === 'default'
        ? 'shadow-glow-brand'
        : glow && variant === 'danger'
          ? 'shadow-glow-sos'
          : '';

    if (hoverable) {
      return (
        <motion.div
          ref={ref}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className={`rounded-2xl border transition-all duration-300 hover:border-line-strong hover:shadow-card-hover ${variantStyles[variant]} ${glowClass} ${noPadding ? '' : 'p-5'} ${className}`}
          {...(props as HTMLMotionProps<'div'>)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={`rounded-2xl border ${variantStyles[variant]} ${glowClass} ${noPadding ? '' : 'p-5'} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';
