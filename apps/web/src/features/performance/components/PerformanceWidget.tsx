'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchPerformanceReport } from '../api';
import { SuccessBar } from './SuccessBar';
import type { OfficerPerformance, LocalityPerformance } from '../types';

export function PerformanceWidget() {
  const [top,   setTop]   = useState<OfficerPerformance[]>([]);
  const [low,   setLow]   = useState<LocalityPerformance[]>([]);
  const [rate,  setRate]  = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceReport()
      .then(r => {
        setTop(r.topOfficers.slice(0, 3));
        setLow(r.bottomLocalities.slice(0, 3));
        setRate(r.summary.overallSuccessRate);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
        <div className="skeleton mb-3 h-4 w-40" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-8 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const CITY_NAMES: Record<string, string> = {
    '110001': 'New Delhi', '400001': 'Mumbai', '560001': 'Bangalore',
    '600001': 'Chennai',   '700001': 'Kolkata', '500001': 'Hyderabad', '302001': 'Jaipur',
  };

  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Accountability</p>
          <p className="font-display text-sm font-semibold text-ink mt-0.5">Performance overview</p>
        </div>
        {rate !== null && (
          <div className="text-right">
            <p className="font-display text-2xl font-bold text-ink">{rate}%</p>
            <p className="text-[10px] text-ink-muted">overall resolution</p>
          </div>
        )}
      </div>

      {/* Top officers */}
      {top.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-leaf-600 mb-2">🏆 Top performers</p>
          <ul className="space-y-1.5">
            {top.map((o, i) => (
              <li key={o.id} className="flex items-center gap-2">
                <span className="text-xs text-ink-soft w-4">{['🥇','🥈','🥉'][i]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-ink truncate">{o.name}</p>
                </div>
                <span className="text-xs font-semibold text-leaf-600 dark:text-leaf-400 tabular-nums shrink-0">
                  {o.successRate}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Low localities */}
      {low.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sos-600 mb-2">🔴 Needs focus</p>
          <ul className="space-y-2">
            {low.map(l => (
              <li key={l.pin}>
                <div className="flex justify-between mb-0.5">
                  <p className="text-xs text-ink-muted">{CITY_NAMES[l.pin] ?? l.pin}</p>
                  <p className="text-xs font-semibold text-sos-600 dark:text-sos-400 tabular-nums">{l.successRate}%</p>
                </div>
                <SuccessBar rate={l.successRate} tier={l.tier} showLabel={false} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href="/performance"
        className="flex h-8 w-full items-center justify-center rounded-xl border border-line bg-canvas text-xs font-medium text-ink-muted hover:text-ink transition-colors"
      >
        View full dashboard →
      </Link>
    </div>
  );
}
