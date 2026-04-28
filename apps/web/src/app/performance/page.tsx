'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { fetchPerformanceReport } from '@/features/performance/api';
import { SummaryCards }      from '@/features/performance/components/SummaryCards';
import { OfficerLeaderboard, LocalityLeaderboard } from '@/features/performance/components/Leaderboard';
import { OfficerTable }      from '@/features/performance/components/OfficerTable';
import { LocalityGrid }      from '@/features/performance/components/LocalityGrid';
import type { PerformanceReport } from '@/features/performance/types';

type ActiveTab = 'leaderboard' | 'officers' | 'localities';

export default function PerformanceDashboardPage() {
  const [report,    setReport]    = useState<PerformanceReport | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [tab,       setTab]       = useState<ActiveTab>('leaderboard');
  const [filterPin, setFilterPin] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (pin?: string, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const data = await fetchPerformanceReport(pin || undefined);
      setReport(data);
    } catch {
      setError('Could not load performance data. Make sure the API is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePinFilter = (pin: string) => {
    setFilterPin(pin);
    load(pin, true);
  };

  /* ── Loading skeleton ──────────────────────────────── */
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
        <div className="skeleton h-10 w-80 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-64 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  /* ── Error ─────────────────────────────────────────── */
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 text-center">
        <p className="text-4xl mb-4" aria-hidden="true">📡</p>
        <h2 className="font-display text-xl font-semibold text-ink">{error}</h2>
        <p className="mt-2 text-sm text-ink-muted">Run: <code className="bg-canvas-2 px-1.5 py-0.5 rounded text-xs">pnpm dev</code></p>
        <button
          onClick={() => load()}
          className="mt-6 inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm text-canvas hover:opacity-90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!report) return null;

  const tabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'leaderboard', label: 'Leaderboard',       icon: '🏆' },
    { id: 'officers',    label: 'Officer table',      icon: '👮' },
    { id: 'localities',  label: 'Locality insights',  icon: '📍' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">

      {/* Page header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1">
            Public Accountability
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Performance Dashboard
          </h1>
          <p className="mt-1 text-sm text-ink-muted max-w-xl">
            Officer and region rankings by grievance resolution rate. Fully transparent — updated in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {refreshing && (
            <span className="text-xs text-ink-muted">Refreshing…</span>
          )}
          <button
            onClick={() => load(filterPin, true)}
            disabled={refreshing}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-canvas px-4 text-xs font-medium text-ink-muted hover:text-ink disabled:opacity-50"
          >
            <svg className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-9-9" /><path d="M21 3v9h-9" />
            </svg>
            Refresh
          </button>
        </div>
      </motion.header>

      {/* Summary cards */}
      <SummaryCards summary={report.summary} />

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-line bg-canvas-2 p-1.5 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-card text-ink shadow-card'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <span aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tab === 'leaderboard' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <OfficerLeaderboard top={report.topOfficers} bottom={report.bottomOfficers} />
          <LocalityLeaderboard top={report.topLocalities} bottom={report.bottomLocalities} />
        </motion.div>
      )}

      {tab === 'officers' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <OfficerTable
            officers={report.officers}
            filterPin={filterPin}
            onFilterPin={handlePinFilter}
          />
        </motion.div>
      )}

      {tab === 'localities' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <LocalityGrid localities={report.localities} />
        </motion.div>
      )}

      {/* Footer note */}
      <p className="text-center text-[11px] text-ink-muted pb-4">
        Data sourced directly from the grievance database. Success rate = resolved ÷ total × 100.
        Officers with fewer than 3 cases are excluded from the &quot;needs attention&quot; list.
      </p>
    </div>
  );
}
