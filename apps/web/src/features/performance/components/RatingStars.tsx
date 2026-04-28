'use client';

import type { PerformanceTier } from '../types';

const TIER_COLOR: Record<PerformanceTier, string> = {
  excellent:     'text-leaf-600  dark:text-leaf-400',
  good:          'text-leaf-500  dark:text-leaf-400',
  average:       'text-saffron-600 dark:text-saffron-400',
  below_average: 'text-sos-500   dark:text-sos-400',
  poor:          'text-sos-600   dark:text-sos-400',
};

const TIER_LABEL: Record<PerformanceTier, string> = {
  excellent:     'Excellent',
  good:          'Good',
  average:       'Average',
  below_average: 'Below avg',
  poor:          'Poor',
};

interface Props {
  rating: number;       // 1–5
  tier:   PerformanceTier;
  label?: boolean;
  size?:  'sm' | 'md';
}

export function RatingStars({ rating, tier, label = false, size = 'md' }: Props) {
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const starSize = size === 'sm' ? 'text-sm'  : 'text-base';

  return (
    <span className={`inline-flex items-center gap-1.5 ${TIER_COLOR[tier]}`}>
      <span className={starSize} aria-label={`${rating} out of 5 stars`}>
        {'⭐'.repeat(rating)}{'☆'.repeat(5 - rating)}
      </span>
      {label && (
        <span className={`${textSize} font-medium`}>{TIER_LABEL[tier]}</span>
      )}
    </span>
  );
}
