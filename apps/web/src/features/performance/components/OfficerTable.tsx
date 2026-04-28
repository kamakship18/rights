'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RatingStars } from './RatingStars';
import { SuccessBar } from './SuccessBar';
import type { OfficerPerformance, PerformanceTier } from '../types';

type SortKey = 'successRate' | 'totalCases' | 'resolvedCases' | 'rating';
type SortDir = 'asc' | 'desc';

const TIER_BG: Record<PerformanceTier, string> = {
  excellent:     'bg-leaf-50/60   dark:bg-leaf-500/5',
  good:          'bg-leaf-50/30   dark:bg-leaf-500/3',
  average:       '',
  below_average: 'bg-orange-50/40 dark:bg-orange-500/5',
  poor:          'bg-sos-50/40    dark:bg-sos-500/5',
};

interface Props {
  officers:  OfficerPerformance[];
  filterPin: string;
  onFilterPin: (pin: string) => void;
}

export function OfficerTable({ officers, filterPin, onFilterPin }: Props) {
  const [sort,     setSort]     = useState<SortKey>('successRate');
  const [sortDir,  setSortDir]  = useState<SortDir>('desc');
  const [search,   setSearch]   = useState('');

  const pins = useMemo(() => ['', ...Array.from(new Set(officers.map(o => o.jurisdictionPin))).sort()], [officers]);

  const sorted = useMemo(() => {
    let list = [...officers];

    // Filter
    if (filterPin) list = list.filter(o => o.jurisdictionPin === filterPin);
    if (search)    list = list.filter(o =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.designation.toLowerCase().includes(search.toLowerCase()) ||
      o.jurisdictionPin.includes(search),
    );

    // Sort
    list.sort((a, b) => {
      const dir = sortDir === 'desc' ? -1 : 1;
      return dir * (a[sort] < b[sort] ? -1 : a[sort] > b[sort] ? 1 : 0);
    });

    return list;
  }, [officers, sort, sortDir, filterPin, search]);

  const toggleSort = (key: SortKey) => {
    if (sort === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSort(key); setSortDir('desc'); }
  };

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className="flex items-center gap-1 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-soft hover:text-ink"
    >
      {label}
      {sort === k && <span className="text-brand-500">{sortDir === 'desc' ? '↓' : '↑'}</span>}
    </button>
  );

  return (
    <div className="rounded-3xl border border-line bg-card shadow-card overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 p-5 border-b border-line">
        <h2 className="font-display text-base font-semibold text-ink mr-auto">Officer performance table</h2>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search officer or PIN…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 w-52 rounded-xl border border-line bg-canvas pl-8 pr-3 text-xs text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-ink/10"
          />
        </div>

        {/* PIN filter */}
        <select
          value={filterPin}
          onChange={e => onFilterPin(e.target.value)}
          className="h-8 rounded-xl border border-line bg-canvas px-3 text-xs text-ink focus:outline-none"
        >
          {pins.map(p => (
            <option key={p} value={p}>{p || 'All PINs'}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="px-5 py-3 text-left"><SortBtn k="successRate" label="Officer" /></th>
              <th className="px-4 py-3 text-left"><span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">PIN</span></th>
              <th className="px-4 py-3 text-right"><SortBtn k="totalCases" label="Total" /></th>
              <th className="px-4 py-3 text-right"><SortBtn k="resolvedCases" label="Resolved" /></th>
              <th className="px-4 py-3 text-right"><span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Pending</span></th>
              <th className="px-6 py-3"><SortBtn k="successRate" label="Success rate" /></th>
              <th className="px-4 py-3 text-center"><SortBtn k="rating" label="Rating" /></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-ink-muted">
                  No officers match your filter.
                </td>
              </tr>
            ) : sorted.map((o, i) => (
              <motion.tr
                key={o.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className={`border-b border-line/50 hover:bg-canvas-2 transition-colors ${TIER_BG[o.tier]}`}
              >
                <td className="px-5 py-3.5">
                  <p className="font-medium text-ink">{o.name}</p>
                  <p className="text-[11px] text-ink-muted">{o.designation}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className="rounded-lg bg-canvas-2 px-2 py-0.5 font-mono text-[11px] text-ink-muted ring-1 ring-line">
                    {o.jurisdictionPin}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums text-sm font-medium text-ink">
                  {o.totalCases}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums text-sm font-semibold text-leaf-600 dark:text-leaf-400">
                  {o.resolvedCases}
                </td>
                <td className="px-4 py-3.5 text-right tabular-nums text-sm text-ink-muted">
                  {o.pendingCases + o.activeCases}
                </td>
                <td className="px-6 py-3.5 w-40">
                  <SuccessBar rate={o.successRate} tier={o.tier} />
                </td>
                <td className="px-4 py-3.5 text-center">
                  <RatingStars rating={o.rating} tier={o.tier} size="sm" />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-line bg-canvas-2">
        <p className="text-[11px] text-ink-muted">
          Showing {sorted.length} of {officers.length} officer{officers.length !== 1 ? 's' : ''}
          {filterPin ? ` in PIN ${filterPin}` : ''}
        </p>
      </div>
    </div>
  );
}
