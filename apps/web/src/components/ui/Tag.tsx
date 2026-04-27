'use client';

import { type HTMLAttributes } from 'react';

const statusColors: Record<string, string> = {
  PENDING:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
  FILED:
    'bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:border-brand-500/20',
  FOLLOWED_UP:
    'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20',
  ESCALATED:
    'bg-sos-50 text-sos-700 border-sos-100 dark:bg-sos-500/10 dark:text-sos-300 dark:border-sos-500/20',
  RESOLVED:
    'bg-leaf-50 text-leaf-700 border-leaf-100 dark:bg-leaf-500/10 dark:text-leaf-300 dark:border-leaf-500/20',
};

const urgencyColors: Record<string, string> = {
  CRITICAL:
    'bg-sos-50 text-sos-700 border-sos-100 dark:bg-sos-500/10 dark:text-sos-300 dark:border-sos-500/20',
  HIGH:
    'bg-saffron-50 text-saffron-700 border-saffron-100 dark:bg-saffron-500/10 dark:text-saffron-300 dark:border-saffron-500/20',
  NORMAL:
    'bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:border-brand-500/20',
};

const channelColors: Record<string, string> = {
  EMAIL:
    'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20',
  SMS:
    'bg-leaf-50 text-leaf-700 border-leaf-100 dark:bg-leaf-500/10 dark:text-leaf-300 dark:border-leaf-500/20',
  WHATSAPP:
    'bg-leaf-50 text-leaf-700 border-leaf-100 dark:bg-leaf-500/10 dark:text-leaf-300 dark:border-leaf-500/20',
  SYSTEM:
    'bg-canvas-2 text-ink-muted border-line',
};

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  /** Value used to auto-pick color from status/urgency/channel maps */
  value?: string;
  /** Explicit color variant */
  colorScheme?: 'status' | 'urgency' | 'channel';
  /** Show animated dot */
  dot?: boolean;
  /** Small size */
  small?: boolean;
}

export function Tag({
  value = '',
  colorScheme = 'status',
  dot = false,
  small = false,
  children,
  className = '',
  ...props
}: TagProps) {
  const colorMap =
    colorScheme === 'urgency'
      ? urgencyColors
      : colorScheme === 'channel'
        ? channelColors
        : statusColors;

  const colorClass =
    colorMap[value] ??
    'bg-canvas-2 text-ink-muted border-line';
  const sizeClass = small
    ? 'text-[10px] px-2 py-0.5'
    : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${colorClass} ${sizeClass} ${className}`}
      {...props}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-50" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children ?? value}
    </span>
  );
}
