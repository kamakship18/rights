'use client';

import type { PerformanceTier } from '../types';

const BAR_COLOR: Record<PerformanceTier, string> = {
  excellent:     'bg-leaf-500',
  good:          'bg-leaf-400',
  average:       'bg-saffron-400',
  below_average: 'bg-orange-400',
  poor:          'bg-sos-500',
};

const TEXT_COLOR: Record<PerformanceTier, string> = {
  excellent:     'text-leaf-700   dark:text-leaf-300',
  good:          'text-leaf-600   dark:text-leaf-400',
  average:       'text-saffron-700 dark:text-saffron-300',
  below_average: 'text-orange-700  dark:text-orange-300',
  poor:          'text-sos-700    dark:text-sos-300',
};

interface Props {
  rate: number;         // 0–100
  tier: PerformanceTier;
  showLabel?: boolean;
}

export function SuccessBar({ rate, tier, showLabel = true }: Props) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex-1 h-2 rounded-full bg-line overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${BAR_COLOR[tier]}`}
          style={{ width: `${rate}%` }}
          role="progressbar"
          aria-valuenow={rate}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span className={`shrink-0 text-xs font-semibold tabular-nums w-9 text-right ${TEXT_COLOR[tier]}`}>
          {rate}%
        </span>
      )}
    </div>
  );
}
