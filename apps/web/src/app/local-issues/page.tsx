'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { ErrorBoundary, Card } from '@/components/ui';
import { createApiClient, type CommunityGrievance, type UserProfile } from '@/lib/api';

const CATEGORY_ICON: Record<string, string> = {
  noise: '🔊',
  harassment: '🚨',
  electricity: '⚡',
  consumer: '🧾',
  municipal: '🏗️',
  stalking: '👁️',
  default: '📌',
};

export default function LocalIssuesPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const api = useMemo(() => createApiClient(getToken), [getToken]);

  const [issues, setIssues] = useState<CommunityGrievance[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadedForRef = useRef<string | null>(null);
  useEffect(() => {
    const id = user?.id ?? null;
    if (loadedForRef.current !== null && loadedForRef.current !== id) {
      setIssues([]);
      setProfile(null);
      setError('');
    }
    loadedForRef.current = id;
  }, [user?.id]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    Promise.all([api.listCommunityIssues(), api.getProfile().catch(() => null)])
      .then(([data, prof]) => {
        setIssues(Array.isArray(data) ? data : []);
        if (prof) setProfile(prof);
      })
      .catch(() => {
        setError('Could not load local issues. Check that the API is running.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isLoaded, isSignedIn, api]);

  const hasNoPin =
    isSignedIn &&
    profile &&
    !profile.primaryPin;

  return (
    <ErrorBoundary>
      <Sidebar />
      <main className="flex min-h-[calc(100dvh-4rem)] flex-1 flex-col bg-canvas">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-8">
          <motion.header
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 shrink-0"
          >
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
              Community
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Local Issues
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Grouped issues when several people report the <strong>same type of problem</strong> in the
              same <strong>PIN</strong> within 72 hours. We match by PIN and category; your list uses your
              profile PIN and any PINs from complaints you have filed.
            </p>
          </motion.header>

          {/* Main column always reserves space so the page is never a blank void */}
          <div className="flex flex-1 flex-col">
            {loading && (
              <div className="shrink-0" aria-busy="true" aria-label="Loading">
                <SkeletonList />
              </div>
            )}

            {!loading && !isSignedIn && (
              <EmptyState
                title="Sign in to see local issues"
                body="We show community groupings for PIN codes that apply to you."
                href="/sign-in"
                cta="Sign in"
                variant="muted"
              />
            )}

            {!loading && isSignedIn && error && (
              <div
                className="rounded-2xl border border-sos-200/80 bg-sos-50/80 p-6 text-sm text-sos-700 dark:border-sos-500/20 dark:bg-sos-500/10 dark:text-sos-200"
                role="alert"
              >
                {error}
                <p className="mt-2 text-xs opacity-90">Tip: start the API on port 4000 and ensure you are signed in.</p>
              </div>
            )}

            {!loading && isSignedIn && !error && hasNoPin && issues.length === 0 && (
              <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100">
                <strong>Tip:</strong> add your home PIN in{' '}
                <Link href="/profile" className="font-medium underline underline-offset-2">
                  Profile
                </Link>
                . After you file a complaint, we also use that complaint&apos;s PIN to match local clusters.
              </div>
            )}

            {!loading && isSignedIn && !error && issues.length === 0 && (
              <EmptyState
                title="No common issues reported in your area yet"
                body="Once multiple people report similar problems for the same PIN and category, they will appear here. File two related complaints (same PIN and category) to test clustering locally."
                href="/chat"
                cta="Report an issue"
                variant="default"
              />
            )}

            {!loading && isSignedIn && !error && issues.length > 0 && (
              <ul className="space-y-4">
                {issues.map((issue, i) => {
                  const cat = (issue.category || 'default').toLowerCase();
                  return (
                    <motion.li
                      key={issue.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.4 }}
                    >
                      <Card className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl" aria-hidden>
                              {CATEGORY_ICON[cat] ?? CATEGORY_ICON.default}
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-700 ring-1 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/20">
                                  {issue.category}
                                </span>
                                <StatusBadge status={issue.status} />
                              </div>
                              <p className="mt-1.5 text-sm text-ink">
                                {issue.locality ? (
                                  <>
                                    <span className="font-medium">{issue.locality}</span>
                                    {', '}
                                  </>
                                ) : null}
                                PIN {issue.pin}
                              </p>
                              <p className="mt-1 text-xs text-ink-muted">
                                Group created{' '}
                                {new Date(issue.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                                {issue.emailSentAt && (
                                  <> · Community notice {new Date(issue.emailSentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-center rounded-2xl border border-line bg-canvas-2 px-4 py-2">
                            <span className="font-display text-2xl font-bold text-ink">{issue.count}</span>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                              linked
                            </span>
                          </div>
                        </div>
                      </Card>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
    </ErrorBoundary>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300',
    FILED: 'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-300',
    FOLLOWED_UP: 'bg-brand-50 text-brand-700 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-300',
    ESCALATED: 'bg-sos-50 text-sos-700 ring-sos-100 dark:bg-sos-500/10 dark:text-sos-300',
    RESOLVED: 'bg-leaf-50 text-leaf-700 ring-leaf-100 dark:bg-leaf-500/10 dark:text-leaf-300',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${
        map[status] ?? 'bg-canvas-2 text-ink ring-line'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-32" />
              <div className="skeleton h-4 w-48" />
              <div className="skeleton h-4 w-64" />
            </div>
            <div className="skeleton h-16 w-16 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  body,
  href,
  cta,
  variant = 'default',
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
  variant?: 'default' | 'muted';
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-12 text-center sm:py-16 ${
        variant === 'muted'
          ? 'border-line bg-card/40'
          : 'border-line bg-card/60'
      }`}
    >
      <div
        className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-300"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">{body}</p>
      <Link
        href={href}
        className="mt-6 inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
      >
        {cta}
      </Link>
    </div>
  );
}
