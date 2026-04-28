'use client';

import { motion } from 'framer-motion';
import { RatingStars } from './RatingStars';
import { SuccessBar } from './SuccessBar';
import type { OfficerPerformance, LocalityPerformance } from '../types';

/* ── Officer leaderboard ─────────────────────────────────── */

interface OfficerLeaderboardProps {
  top:    OfficerPerformance[];
  bottom: OfficerPerformance[];
}

const MEDAL = ['🥇', '🥈', '🥉'];

const TIER_BADGE: Record<string, string> = {
  excellent:     'bg-leaf-50 text-leaf-700 ring-leaf-100 dark:bg-leaf-500/10 dark:text-leaf-300',
  good:          'bg-leaf-50/60 text-leaf-600 ring-leaf-100 dark:bg-leaf-500/8 dark:text-leaf-400',
  average:       'bg-saffron-50 text-saffron-700 ring-saffron-100 dark:bg-saffron-500/10 dark:text-saffron-300',
  below_average: 'bg-orange-50 text-orange-700 ring-orange-100 dark:bg-orange-500/10 dark:text-orange-300',
  poor:          'bg-sos-50 text-sos-700 ring-sos-100 dark:bg-sos-500/10 dark:text-sos-300',
};

export function OfficerLeaderboard({ top, bottom }: OfficerLeaderboardProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Top performers */}
      <div className="rounded-3xl border border-line bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl" aria-hidden="true">🏆</span>
          <h2 className="font-display text-base font-semibold text-ink">Top performers</h2>
        </div>
        <ol className="space-y-3">
          {top.map((o, i) => (
            <motion.li
              key={o.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 rounded-2xl border border-line bg-canvas-2 p-3"
            >
              <span className="text-xl shrink-0 w-7 text-center" aria-hidden="true">
                {MEDAL[i] ?? `#${i + 1}`}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-ink truncate">{o.name}</p>
                  {i === 0 && (
                    <span className="inline-flex items-center rounded-full bg-saffron-100 px-2 py-0.5 text-[10px] font-semibold text-saffron-700 ring-1 ring-saffron-200 dark:bg-saffron-500/15 dark:text-saffron-300">
                      Top Performer
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-ink-muted truncate">{o.designation} · PIN {o.jurisdictionPin}</p>
                <div className="mt-2">
                  <SuccessBar rate={o.successRate} tier={o.tier} />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <RatingStars rating={o.rating} tier={o.tier} size="sm" />
                <p className="mt-1 text-[10px] text-ink-muted">{o.resolvedCases}/{o.totalCases}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>

      {/* Needs attention */}
      <div className="rounded-3xl border border-line bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl" aria-hidden="true">⚠️</span>
          <h2 className="font-display text-base font-semibold text-ink">Needs attention</h2>
        </div>
        <ol className="space-y-3">
          {bottom.map((o, i) => (
            <motion.li
              key={o.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 rounded-2xl border border-sos-100/60 bg-sos-50/30 p-3 dark:border-sos-500/10 dark:bg-sos-500/5"
            >
              <span className="shrink-0 w-7 text-center text-sm font-bold text-sos-400 dark:text-sos-500">
                #{i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink truncate">{o.name}</p>
                <p className="text-[11px] text-ink-muted truncate">{o.designation} · PIN {o.jurisdictionPin}</p>
                <div className="mt-2">
                  <SuccessBar rate={o.successRate} tier={o.tier} />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${TIER_BADGE[o.tier]}`}>
                  {o.tier.replace('_', ' ')}
                </span>
                <p className="mt-1 text-[10px] text-ink-muted">{o.resolvedCases}/{o.totalCases}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ── Locality leaderboard ────────────────────────────────── */

interface LocalityLeaderboardProps {
  top:    LocalityPerformance[];
  bottom: LocalityPerformance[];
}

const CITY_NAMES: Record<string, string> = {
  '110001': 'New Delhi',
  '400001': 'Mumbai',
  '560001': 'Bangalore',
  '600001': 'Chennai',
  '700001': 'Kolkata',
  '500001': 'Hyderabad',
  '302001': 'Jaipur',
};

export function LocalityLeaderboard({ top, bottom }: LocalityLeaderboardProps) {
  const cityName = (pin: string) => CITY_NAMES[pin] ?? pin;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Top localities */}
      <div className="rounded-3xl border border-line bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl" aria-hidden="true">📍</span>
          <h2 className="font-display text-base font-semibold text-ink">Best performing regions</h2>
        </div>
        <ol className="space-y-3">
          {top.map((l, i) => (
            <motion.li
              key={l.pin}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border border-line bg-canvas-2 p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true">{MEDAL[i] ?? '🏅'}</span>
                    <p className="font-semibold text-sm text-ink">{cityName(l.pin)}</p>
                    {i === 0 && (
                      <span className="inline-flex items-center rounded-full bg-leaf-50 px-1.5 py-0.5 text-[9px] font-bold text-leaf-700 ring-1 ring-leaf-100 dark:bg-leaf-500/10 dark:text-leaf-300">
                        BEST REGION
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-ink-muted mt-0.5">PIN {l.pin} · {l.officerCount} officer{l.officerCount !== 1 ? 's' : ''}</p>
                </div>
                <RatingStars rating={l.rating} tier={l.tier} size="sm" />
              </div>
              <SuccessBar rate={l.successRate} tier={l.tier} />
              <div className="mt-2 flex gap-4 text-[10px] text-ink-muted">
                <span>✅ {l.resolvedCases} resolved</span>
                <span>⏳ {l.pendingCases + l.activeCases} active</span>
                <span>📋 {l.totalCases} total</span>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>

      {/* Low localities */}
      <div className="rounded-3xl border border-line bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl" aria-hidden="true">🔴</span>
          <h2 className="font-display text-base font-semibold text-ink">Regions needing focus</h2>
        </div>
        <ol className="space-y-3">
          {bottom.map((l, i) => (
            <motion.li
              key={l.pin}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border border-sos-100/60 bg-sos-50/30 p-4 dark:border-sos-500/10 dark:bg-sos-500/5"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-semibold text-sm text-ink">{cityName(l.pin)}</p>
                  <p className="text-[11px] text-ink-muted">PIN {l.pin} · {l.officerCount} officer{l.officerCount !== 1 ? 's' : ''}</p>
                </div>
                <RatingStars rating={l.rating} tier={l.tier} size="sm" />
              </div>
              <SuccessBar rate={l.successRate} tier={l.tier} />
              <div className="mt-2 flex gap-4 text-[10px] text-ink-muted">
                <span>✅ {l.resolvedCases} resolved</span>
                <span>⏳ {l.pendingCases + l.activeCases} active</span>
                <span>📋 {l.totalCases} total</span>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  );
}
