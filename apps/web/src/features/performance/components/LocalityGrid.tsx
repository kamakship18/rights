'use client';

import { motion } from 'framer-motion';
import { RatingStars } from './RatingStars';
import { SuccessBar } from './SuccessBar';
import type { LocalityPerformance, PerformanceTier } from '../types';

const CITY_NAMES: Record<string, string> = {
  '110001': 'New Delhi',
  '400001': 'Mumbai',
  '560001': 'Bangalore',
  '600001': 'Chennai',
  '700001': 'Kolkata',
  '500001': 'Hyderabad',
  '302001': 'Jaipur',
};

const TIER_RING: Record<PerformanceTier, string> = {
  excellent:     'ring-leaf-200   dark:ring-leaf-500/30',
  good:          'ring-leaf-100   dark:ring-leaf-500/20',
  average:       'ring-saffron-100 dark:ring-saffron-500/20',
  below_average: 'ring-orange-100  dark:ring-orange-500/20',
  poor:          'ring-sos-100    dark:ring-sos-500/20',
};

const TIER_HEADER: Record<PerformanceTier, string> = {
  excellent:     'bg-leaf-500/10   text-leaf-700   dark:text-leaf-300',
  good:          'bg-leaf-500/8    text-leaf-600   dark:text-leaf-400',
  average:       'bg-saffron-500/10 text-saffron-700 dark:text-saffron-300',
  below_average: 'bg-orange-500/10  text-orange-700  dark:text-orange-300',
  poor:          'bg-sos-500/10    text-sos-700    dark:text-sos-300',
};

interface Props { localities: LocalityPerformance[]; }

export function LocalityGrid({ localities }: Props) {
  return (
    <div className="rounded-3xl border border-line bg-card p-6 shadow-card">
      <h2 className="font-display text-base font-semibold text-ink mb-5">
        Locality insights — all regions
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {localities.map((l, i) => (
          <motion.div
            key={l.pin}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-2xl border bg-canvas-2 p-4 ring-1 ${TIER_RING[l.tier]}`}
          >
            {/* Header */}
            <div className={`-mx-4 -mt-4 mb-4 rounded-t-2xl px-4 py-2 ${TIER_HEADER[l.tier]}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold truncate">
                  {CITY_NAMES[l.pin] ?? l.pin}
                </p>
                <RatingStars rating={l.rating} tier={l.tier} size="sm" />
              </div>
              <p className="text-[11px] opacity-75">PIN {l.pin}</p>
            </div>

            {/* Success bar */}
            <SuccessBar rate={l.successRate} tier={l.tier} />

            {/* Stats row */}
            <div className="mt-3 grid grid-cols-3 gap-1 text-center">
              <Stat label="Total"    value={l.totalCases}                    />
              <Stat label="Resolved" value={l.resolvedCases} accent="leaf"   />
              <Stat label="Pending"  value={l.pendingCases + l.activeCases} accent={l.tier === 'poor' ? 'sos' : undefined} />
            </div>

            {/* Top officer */}
            {l.topOfficer && (
              <div className="mt-3 rounded-xl border border-line bg-canvas px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-ink-soft mb-0.5">Top officer</p>
                <p className="text-xs font-medium text-ink truncate">{l.topOfficer.name}</p>
                <p className="text-[10px] text-ink-muted">{l.topOfficer.designation} · {l.topOfficer.successRate}%</p>
              </div>
            )}

            <p className="mt-2 text-[10px] text-ink-muted text-right">
              {l.officerCount} officer{l.officerCount !== 1 ? 's' : ''} assigned
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: 'leaf' | 'sos' }) {
  const color = accent === 'leaf' ? 'text-leaf-600 dark:text-leaf-400'
              : accent === 'sos'  ? 'text-sos-600 dark:text-sos-400'
              : 'text-ink';
  return (
    <div>
      <p className={`font-bold tabular-nums text-sm ${color}`}>{value}</p>
      <p className="text-[10px] text-ink-soft">{label}</p>
    </div>
  );
}
