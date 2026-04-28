'use client';

import { motion } from 'framer-motion';
import type { PerformanceSummary } from '../types';

interface Props { summary: PerformanceSummary; }

const TIER_COLOR = (rate: number) => {
  if (rate >= 75) return 'text-leaf-600   dark:text-leaf-400';
  if (rate >= 50) return 'text-saffron-600 dark:text-saffron-400';
  return               'text-sos-600     dark:text-sos-400';
};

export function SummaryCards({ summary }: Props) {
  const cards = [
    {
      label: 'Total grievances',
      value: summary.totalGrievances.toLocaleString('en-IN'),
      icon:  '📋',
      sub:   'Across all regions',
    },
    {
      label: 'Resolved',
      value: summary.totalResolved.toLocaleString('en-IN'),
      icon:  '✅',
      sub:   `${summary.overallSuccessRate}% success rate`,
      accent: TIER_COLOR(summary.overallSuccessRate),
    },
    {
      label: 'Pending / Active',
      value: (summary.totalPending + (summary.totalGrievances - summary.totalResolved - summary.totalPending)).toLocaleString('en-IN'),
      icon:  '⏳',
      sub:   'Awaiting resolution',
    },
    {
      label: 'Nodal officers',
      value: summary.totalOfficers.toLocaleString('en-IN'),
      icon:  '👮',
      sub:   'Across all regions',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="rounded-2xl border border-line bg-card p-5 shadow-card"
        >
          <div className="flex items-start justify-between mb-2">
            <span className="text-2xl" aria-hidden="true">{c.icon}</span>
          </div>
          <p className={`font-display text-3xl font-bold tracking-tight ${c.accent ?? 'text-ink'}`}>
            {c.value}
          </p>
          <p className="mt-0.5 text-xs font-medium text-ink">{c.label}</p>
          <p className="mt-1 text-[11px] text-ink-muted">{c.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}
