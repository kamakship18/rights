'use client';

import type { StorageType } from '../types';

interface Props {
  storageType: StorageType;
  chainValid?: boolean | null;
  className?: string;
}

const LABELS: Record<StorageType, string> = {
  blockchain: '⛓ On-chain',
  mongodb:    '🗄 MongoDB fallback',
};

const TONES: Record<StorageType, string> = {
  blockchain: 'bg-leaf-50 text-leaf-700 ring-leaf-100 dark:bg-leaf-500/10 dark:text-leaf-300 dark:ring-leaf-500/20',
  mongodb:    'bg-saffron-50 text-saffron-700 ring-saffron-100 dark:bg-saffron-500/10 dark:text-saffron-300 dark:ring-saffron-500/20',
};

export function ChainStatusBadge({ storageType, chainValid, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${TONES[storageType]} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[storageType]}
      {storageType === 'blockchain' && chainValid === false && (
        <span className="ml-1 text-sos-600">⚠ chain tampered</span>
      )}
    </span>
  );
}
