'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { listChainGrievances, getChainStatus } from '../api';
import { ChainStatusBadge } from './ChainStatusBadge';
import type { GrievanceChainRecord, ChainStatus } from '../types';

export function GrievanceChainList() {
  const [items,   setItems]   = useState<GrievanceChainRecord[]>([]);
  const [chain,   setChain]   = useState<ChainStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [page,    setPage]    = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [total,   setTotal]   = useState(0);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const [listRes, statusRes] = await Promise.allSettled([
        listChainGrievances(p, 10),
        getChainStatus(),
      ]);

      if (listRes.status === 'fulfilled') {
        setItems(listRes.value.items);
        setHasNext(listRes.value.hasNext);
        setTotal(listRes.value.total);
        setPage(p);
      } else {
        setError('Could not load grievances. Is the chain service running?');
      }

      if (statusRes.status === 'fulfilled') {
        setChain(statusRes.value.chain);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="space-y-6">

      {/* Chain status strip */}
      {chain && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-card px-5 py-4 shadow-card"
        >
          <StatPill label="Total blocks" value={chain.blocks} />
          <StatPill label="Grievances"   value={chain.grievances} />
          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
            chain.valid
              ? 'bg-leaf-50 text-leaf-700 ring-leaf-100 dark:bg-leaf-500/10 dark:text-leaf-300 dark:ring-leaf-500/20'
              : 'bg-sos-50 text-sos-700 ring-sos-100 dark:bg-sos-500/10 dark:text-sos-300 dark:ring-sos-500/20'
          }`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            Chain: {chain.valid ? 'Valid ✓' : 'TAMPERED ✗'}
          </div>
          {chain.latestHash && (
            <p className="truncate font-mono text-[10px] text-ink-soft max-w-[200px]">
              latest: {chain.latestHash.slice(0, 20)}…
            </p>
          )}
        </motion.div>
      )}

      {/* Loading */}
      {loading && <SkeletonList />}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-sos-200/80 bg-sos-50/80 px-5 py-4 text-sm text-sos-700 dark:border-sos-500/20 dark:bg-sos-500/10 dark:text-sos-200">
          {error}
          <p className="mt-1 text-xs opacity-80">Run: <code className="bg-canvas-2 px-1 rounded">cd apps/chain && npm run dev</code></p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-line bg-card/60 px-6 py-16 text-center">
          <span className="text-4xl mb-4" aria-hidden="true">⛓</span>
          <h3 className="font-display text-lg font-semibold text-ink">No blockchain grievances yet</h3>
          <p className="mt-2 text-sm text-ink-muted">Be the first to file an immutable grievance record.</p>
          <Link
            href="/blockchain/new"
            className="mt-5 inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-medium text-canvas hover:opacity-90"
          >
            File first grievance
          </Link>
        </div>
      )}

      {/* List */}
      {!loading && items.length > 0 && (
        <>
          <p className="text-xs text-ink-muted">{total} grievance{total !== 1 ? 's' : ''} on record</p>
          <ul className="space-y-3">
            {items.map((item, i) => (
              <motion.li
                key={item.grievanceId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/blockchain/${item.grievanceId}`}
                  className="group block rounded-2xl border border-line bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <ChainStatusBadge storageType={item.storageType} />
                        {item.blockIndex !== null && (
                          <span className="rounded-full bg-canvas-2 px-2 py-0.5 text-[10px] font-mono text-ink-soft ring-1 ring-line">
                            Block #{item.blockIndex}
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-sm text-ink line-clamp-1">
                        {item.metadata.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                        {item.metadata.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink-muted">
                        <span>PIN {item.metadata.pin}</span>
                        {item.metadata.location && <><span>·</span><span>{item.metadata.location}</span></>}
                        <span>·</span>
                        <time>{new Date(item.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</time>
                        {item.files.length > 0 && <><span>·</span><span>{item.files.length} file{item.files.length !== 1 ? 's' : ''}</span></>}
                      </div>
                    </div>
                    {/* Hash preview */}
                    {item.blockchainHash && (
                      <p className="shrink-0 font-mono text-[9px] text-ink-soft hidden sm:block">
                        {item.blockchainHash.slice(0, 8)}…
                      </p>
                    )}
                  </div>
                </Link>
              </motion.li>
            ))}
          </ul>

          {/* Pagination */}
          <div className="flex justify-between">
            <button
              onClick={() => load(page - 1)}
              disabled={page <= 1}
              className="h-9 rounded-xl border border-line px-4 text-xs text-ink-muted hover:text-ink disabled:opacity-40"
            >
              ← Newer
            </button>
            <span className="text-xs text-ink-muted self-center">Page {page}</span>
            <button
              onClick={() => load(page + 1)}
              disabled={!hasNext}
              className="h-9 rounded-xl border border-line px-4 text-xs text-ink-muted hover:text-ink disabled:opacity-40"
            >
              Older →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="font-display text-xl font-bold text-ink">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-ink-muted">{label}</p>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-line bg-card p-5">
          <div className="skeleton mb-3 h-4 w-24" />
          <div className="skeleton mb-2 h-5 w-2/3" />
          <div className="skeleton h-4 w-full" />
        </div>
      ))}
    </div>
  );
}
