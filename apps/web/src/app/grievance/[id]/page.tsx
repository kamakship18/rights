'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Card,
  Tag,
  Timeline,
  Button,
  ErrorBoundary,
  SkeletonTimeline,
  SkeletonCard,
} from '@/components/ui';
import { createApiClient, type GrievanceWithEvents } from '@/lib/api';
import { strings } from '@/lib/strings';

const s = strings.grievance;
const sc = strings.common;

const REFRESH_INTERVAL = 10_000; // 10 s

export default function GrievancePage() {
  const params = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const api = useMemo(() => createApiClient(getToken), [getToken]);

  const [grievance, setGrievance] = useState<GrievanceWithEvents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  const fetchGrievance = useCallback(async () => {
    try {
      const data = await api.getGrievance(params.id);
      setGrievance(data);
      setError('');
    } catch {
      setError('Could not load grievance.');
    } finally {
      setLoading(false);
    }
  }, [params.id, api]);

  /* Initial load + auto-refresh */
  useEffect(() => {
    fetchGrievance();
    const interval = setInterval(fetchGrievance, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchGrievance]);

  if (loading) {
    return (
      <main className="min-h-dvh bg-canvas px-4 py-10">
        <div className="mx-auto max-w-2xl space-y-6">
          <SkeletonCard />
          <SkeletonTimeline />
        </div>
      </main>
    );
  }

  if (error || !grievance) {
    return (
      <main className="min-h-dvh bg-canvas px-4 py-10">
        <div className="mx-auto max-w-2xl py-20 text-center">
          <p className="mb-4 text-ink-muted">{error || sc.error}</p>
          <Button variant="outline" onClick={fetchGrievance}>
            {sc.retry}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <ErrorBoundary>
      <main className="relative min-h-dvh bg-canvas px-4 py-10">
        <div className="pointer-events-none absolute inset-0 grid-overlay opacity-40" />

        <div className="relative z-10 mx-auto max-w-2xl space-y-6">
          {/* Navigation */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                ← {sc.back}
              </Button>
            </Link>
          </div>

          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Tag value={grievance.status} dot>
                  {s.statusLabels[grievance.status] ?? grievance.status}
                </Tag>
                <Tag value={grievance.urgency} colorScheme="urgency">
                  {grievance.urgency}
                </Tag>
              </div>

              <p className="text-sm leading-relaxed text-ink">
                {grievance.rawText}
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Statute */}
                <div className="rounded-xl bg-canvas-2 p-3 ring-1 ring-line">
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-ink-soft">
                    {s.statuteCard}
                  </p>
                  <p className="text-sm font-medium text-ink">
                    {grievance.statute}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Section {grievance.section}
                  </p>
                </div>

                {/* Officer */}
                <div className="rounded-xl bg-canvas-2 p-3 ring-1 ring-line">
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-ink-soft">
                    {s.officerCard}
                  </p>
                  <p className="text-sm font-medium text-ink">
                    {grievance.officer.name}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {grievance.officer.designation}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-ink">
                {s.timelineTitle}
              </h2>
              <span className="flex items-center gap-1.5 text-[10px] text-ink-soft">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf-400 opacity-50" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-leaf-500" />
                </span>
                {s.refreshHint}
              </span>
            </div>
            <Timeline events={grievance.events} />

            {/* Add user note */}
            <div className="mt-4 rounded-2xl border border-line bg-card p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Add a note
              </p>
              <textarea
                className="h-20 w-full resize-none rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-soft focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="Add an update, new information, or context for authorities…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  disabled={!noteText.trim() || noteSaving}
                  onClick={async () => {
                    if (!noteText.trim()) return;
                    setNoteSaving(true);
                    try {
                      await api.addGrievanceUpdate(params.id, noteText.trim());
                      setNoteText('');
                      await fetchGrievance();
                    } finally {
                      setNoteSaving(false);
                    }
                  }}
                  className="inline-flex h-9 items-center rounded-xl bg-ink px-4 text-xs font-medium text-canvas hover:opacity-90 disabled:opacity-50"
                >
                  {noteSaving ? 'Saving…' : 'Add note'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </ErrorBoundary>
  );
}
