'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { ErrorBoundary } from '@/components/ui';
import { createApiClient, type GrievanceListItem } from '@/lib/api';
import { strings } from '@/lib/strings';
import { PerformanceWidget } from '@/features/performance/components/PerformanceWidget';

const sg = strings.grievance;

const ACTIVE = ['PENDING', 'FILED', 'FOLLOWED_UP', 'ESCALATED'];
const RESOLVED = ['RESOLVED'];

type Filter = 'all' | 'active' | 'resolved';

export default function DashboardPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const [items, setItems] = useState<GrievanceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const api = useMemo(() => createApiClient(getToken), [getToken]);

  // Track the last user ID we loaded data for — wipe state immediately if it changes
  const loadedForRef = useRef<string | null>(null);
  useEffect(() => {
    const currentId = user?.id ?? null;
    if (loadedForRef.current !== null && loadedForRef.current !== currentId) {
      // User switched — clear stale data before the next fetch completes
      setItems([]);
      setError('');
      setFilter('all');
    }
    loadedForRef.current = currentId;
  }, [user?.id]);

  const fetchAll = useCallback(async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.listGrievances();
      setItems(data.items);
      setError('');
    } catch {
      setError('Could not load your grievances. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [api, isSignedIn]);

  useEffect(() => {
    if (isLoaded) fetchAll();
  }, [isLoaded, fetchAll]);

  const visible = useMemo(() => {
    if (filter === 'active') return items.filter((g) => ACTIVE.includes(g.status));
    if (filter === 'resolved') return items.filter((g) => RESOLVED.includes(g.status));
    return items;
  }, [items, filter]);

  const counts = useMemo(
    () => ({
      total: items.length,
      active: items.filter((g) => ACTIVE.includes(g.status)).length,
      resolved: items.filter((g) => RESOLVED.includes(g.status)).length,
    }),
    [items],
  );

  return (
    <ErrorBoundary>
      <Sidebar />
      <main className="flex-1 bg-canvas">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex flex-wrap items-end justify-between gap-4"
          >
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
                Dashboard
              </p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                {user?.firstName ? `Welcome back, ${user.firstName}.` : 'Your grievances'}
              </h1>
              <p className="mt-2 text-sm text-ink-muted">
                Every complaint you&apos;ve filed from this account, with live status from our system.
              </p>
            </div>
            <Link
              href="/chat"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-medium text-canvas shadow-soft-xl hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New grievance
            </Link>
          </motion.header>

          {/* KPI strip */}
          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            <Kpi
              label="Total filed"
              value={counts.total}
              tone="indigo"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M3 10h18" />
                </svg>
              }
            />
            <Kpi
              label="In progress"
              value={counts.active}
              tone="saffron"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15 14" />
                </svg>
              }
            />
            <Kpi
              label="Resolved"
              value={counts.resolved}
              tone="leaf"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                  <path d="m5 13 4 4L19 7" />
                </svg>
              }
            />
          </div>

          {/* Filter pills */}
          <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
            {([
              ['all', `All (${counts.total})`],
              ['active', `Active (${counts.active})`],
              ['resolved', `Resolved (${counts.resolved})`],
            ] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`inline-flex h-9 items-center rounded-full border px-4 text-xs font-medium transition-colors ${
                  filter === k
                    ? 'border-ink bg-ink text-canvas'
                    : 'border-line bg-card text-ink-muted hover:text-ink'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Body — grievance list + sidebar widget */}
          <div className="flex gap-6 items-start">
            <div className="min-w-0 flex-1">
          {!isLoaded || loading ? (
            <SkeletonList />
          ) : !isSignedIn ? (
            <EmptyState
              title="Sign in to see your grievances"
              body="Your dashboard only shows complaints you&apos;ve filed from your own account — never anyone else&apos;s."
              cta="Sign in"
              href="/sign-in"
            />
          ) : error ? (
            <ErrorState onRetry={fetchAll} />
          ) : visible.length === 0 ? (
            <EmptyState
              title={
                filter === 'all'
                  ? "You haven't filed anything yet."
                  : filter === 'active'
                    ? 'No active grievances right now.'
                    : 'No resolved grievances yet.'
              }
              body="When you file a grievance through Justice OS, it shows up here with a live timeline."
              cta="File your first grievance"
              href="/chat"
            />
          ) : (
            <ul className="space-y-3">
              {visible.map((g, i) => (
                <motion.li
                  key={g.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.4 }}
                >
                  <Link
                    href={`/grievance/${g.id}`}
                    className="group block overflow-hidden rounded-2xl border border-line bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <StatusPill status={g.status} />
                          <UrgencyPill urgency={g.urgency} />
                        </div>
                        <p className="line-clamp-2 text-sm text-ink">
                          {g.rawText}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                          <span className="inline-flex items-center gap-1">
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            {g.statute || 'Statute'} · §{g.section}
                          </span>
                          <span aria-hidden>·</span>
                          <span>{g._count.events} updates</span>
                          <span aria-hidden>·</span>
                          <time>
                            {new Date(g.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </time>
                          {g.officer?.name && (
                            <>
                              <span aria-hidden>·</span>
                              <span className="truncate">→ {g.officer.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Sparkline count={g._count.events} />
                        <span className="rounded-full bg-canvas-2 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                          {g.category}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}
            </div>

            {/* Performance widget — visible on xl screens */}
            <aside className="hidden xl:block w-72 shrink-0">
              <PerformanceWidget />
            </aside>
          </div>
        </div>
      </main>
    </ErrorBoundary>
  );
}

/* ── Helpers ────────────────────────────────────────────────────── */

function Kpi({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: 'indigo' | 'saffron' | 'leaf';
  icon: React.ReactNode;
}) {
  const tones = {
    indigo:
      'text-brand-600 bg-brand-50 ring-brand-100 dark:text-brand-300 dark:bg-brand-500/10 dark:ring-brand-500/20',
    saffron:
      'text-saffron-600 bg-saffron-50 ring-saffron-100 dark:text-saffron-300 dark:bg-saffron-500/10 dark:ring-saffron-500/20',
    leaf:
      'text-leaf-600 bg-leaf-50 ring-leaf-100 dark:text-leaf-300 dark:bg-leaf-500/10 dark:ring-leaf-500/20',
  } as const;
  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}>
          {icon}
        </span>
        <span className="text-xs uppercase tracking-wider text-ink-soft">
          {label}
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
        {value}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING:
      'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
    FILED:
      'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20',
    FOLLOWED_UP:
      'bg-brand-50 text-brand-700 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/20',
    ESCALATED:
      'bg-sos-50 text-sos-700 ring-sos-100 dark:bg-sos-500/10 dark:text-sos-300 dark:ring-sos-500/20',
    RESOLVED:
      'bg-leaf-50 text-leaf-700 ring-leaf-100 dark:bg-leaf-500/10 dark:text-leaf-300 dark:ring-leaf-500/20',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
        map[status] ?? 'bg-canvas-2 text-ink ring-line'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {sg.statusLabels[status] ?? status}
    </span>
  );
}

function UrgencyPill({ urgency }: { urgency: string }) {
  const map: Record<string, string> = {
    CRITICAL:
      'bg-sos-50 text-sos-700 ring-sos-100 dark:bg-sos-500/10 dark:text-sos-300 dark:ring-sos-500/20',
    HIGH:
      'bg-saffron-50 text-saffron-700 ring-saffron-100 dark:bg-saffron-500/10 dark:text-saffron-300 dark:ring-saffron-500/20',
    NORMAL:
      'bg-canvas-2 text-ink-muted ring-line',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
        map[urgency] ?? 'bg-canvas-2 text-ink ring-line'
      }`}
    >
      {urgency}
    </span>
  );
}

function Sparkline({ count }: { count: number }) {
  const bars = Array.from({ length: 5 }, (_, i) =>
    Math.min(100, i < count ? (i + 1) * 22 : 8),
  );
  return (
    <div className="flex h-6 items-end gap-0.5" aria-hidden="true">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-saffron-400/70"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-line bg-card p-5 shadow-card"
        >
          <div className="mb-3 flex gap-2">
            <div className="skeleton h-5 w-20" />
            <div className="skeleton h-5 w-16" />
          </div>
          <div className="skeleton mb-2 h-4 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  body,
  cta,
  href,
}: {
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-line bg-card/60 px-6 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-saffron-50 text-saffron-600 ring-1 ring-saffron-100 dark:bg-saffron-500/10 dark:text-saffron-300 dark:ring-saffron-500/20">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
        </svg>
      </div>
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">{body}</p>
      <Link
        href={href}
        className="mt-5 inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-medium text-canvas hover:opacity-90"
      >
        {cta}
      </Link>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-sos-200/80 bg-sos-50/80 px-6 py-16 text-center dark:border-sos-500/20 dark:bg-sos-500/10">
      <p className="font-display text-lg font-semibold text-sos-700 dark:text-sos-200">
        We couldn&apos;t load your grievances.
      </p>
      <p className="mt-2 max-w-sm text-sm text-sos-700/80 dark:text-sos-200/80">
        It&apos;s usually a network blip. Try once more.
      </p>
      <button
        onClick={onRetry}
        className="mt-5 inline-flex h-10 items-center rounded-full border border-sos-200 bg-white px-5 text-sm font-medium text-sos-700 hover:bg-sos-50 dark:border-sos-500/30 dark:bg-sos-500/15 dark:text-sos-200 dark:hover:bg-sos-500/20"
      >
        {strings.common.retry}
      </button>
    </div>
  );
}
