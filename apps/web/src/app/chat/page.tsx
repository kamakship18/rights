'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Button,
  Card,
  Textarea,
  Input,
  Tag,
  BottomSheet,
  ErrorBoundary,
  SkeletonCard,
} from '@/components/ui';
import { createApiClient, type ApiError } from '@/lib/api';
import { strings } from '@/lib/strings';
import type { IntentPreview } from '@repo/shared';

const s = strings.chat;

/* ── Chat state machine ───────────────────────────────────── */

type Phase = 'input' | 'loading' | 'preview' | 'confirming' | 'error';

export default function ChatPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const api = createApiClient(getToken);

  const [phase, setPhase] = useState<Phase>('input');
  const [text, setText] = useState('');
  const [pin, setPin] = useState('');
  const [locality, setLocality] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<IntentPreview | null>(null);
  const [sosSheet, setSosSheet] = useState(false);

  /* ── Submit grievance for analysis ─────────────────────── */
  const handleAnalyse = useCallback(async () => {
    if (text.trim().length < 5) {
      setError('Please describe your issue in more detail.');
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setError('Enter a valid 6-digit PIN code.');
      return;
    }

    setError('');
    setPhase('loading');

    try {
      const result = await api.intentPreview({ text, pin, locality: locality || undefined });
      setPreview(result);
      setPhase('preview');

      if (result.sosRecommended) {
        setTimeout(() => setSosSheet(true), 600);
      }
    } catch (err) {
      const msg =
        (err as ApiError)?.body &&
        typeof (err as ApiError).body === 'object' &&
        'message' in ((err as ApiError).body as Record<string, unknown>)
          ? String(((err as ApiError).body as Record<string, string>).message)
          : 'Analysis failed. Please try again.';
      setError(msg);
      setPhase('error');
    }
  }, [text, pin, locality, api]);

  /* ── Confirm & file ────────────────────────────────────── */
  const handleConfirm = useCallback(async () => {
    if (!preview) return;
    setPhase('confirming');

    try {
      const grievance = await api.createGrievance({
        text,
        pin,
        locality: locality || undefined,
        isAnonymous,
        confirmedStatute: preview.statute,
        confirmedSection: preview.section,
        confirmedOfficerId: preview.officer.id,
        confirmedCategory: preview.category,
        confirmedUrgency: preview.urgency as 'CRITICAL' | 'HIGH' | 'NORMAL',
      });

      router.push(`/grievance/${grievance.id}`);
    } catch (err) {
      const msg =
        (err as ApiError)?.body &&
        typeof (err as ApiError).body === 'object' &&
        'message' in ((err as ApiError).body as Record<string, unknown>)
          ? String(((err as ApiError).body as Record<string, string>).message)
          : 'Filing failed. Please try again.';
      setError(msg);
      setPhase('error');
    }
  }, [preview, text, pin, api, router]);

  return (
    <ErrorBoundary>
      <main className="relative min-h-dvh bg-canvas px-4 py-10">
        <div className="pointer-events-none absolute inset-0 india-canvas opacity-60" />
        <div className="pointer-events-none absolute inset-0 grid-overlay opacity-40" />

        <div className="relative z-10 mx-auto max-w-2xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
              File a grievance
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {s.title}
            </h1>
          </motion.div>

          {/* Input phase */}
          <AnimatePresence mode="wait">
            {(phase === 'input' || phase === 'error') && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-5"
              >
                <Card>
                  <Textarea
                    id="grievance-text"
                    placeholder={s.placeholder}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-[140px]"
                    aria-label={s.title}
                  />

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Input
                      id="pin-code"
                      label={s.pinLabel}
                      placeholder={s.pinPlaceholder}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      inputMode="numeric"
                    />
                    <Input
                      id="locality"
                      label="Locality / area"
                      placeholder="e.g. Chandni Chowk"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                    />
                  </div>

                  {/* Anonymous toggle */}
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-line bg-canvas-2 p-4">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isAnonymous}
                      onClick={() => setIsAnonymous((v) => !v)}
                      className={`relative mt-0.5 inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${isAnonymous ? 'bg-brand-600' : 'bg-line'}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${isAnonymous ? 'translate-x-4' : 'translate-x-0'}`}
                      />
                    </button>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">File anonymously</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        Your name, phone, and email will NOT appear in the notice to authorities. Your identity is stored securely for internal tracking only.
                      </p>
                      {isAnonymous && (
                        <p className="mt-2 text-xs font-medium text-saffron-700 dark:text-saffron-300">
                          ⚠ Anonymous complaints may have limited follow-up capability.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Voice button placeholder */}
                  <div className="mt-3 flex justify-end">
                    <button
                      className="flex h-9 items-center gap-2 rounded-xl border border-line bg-canvas px-3 text-xs text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
                      aria-label={s.voiceBtn}
                      title={s.voicePlaceholder}
                      type="button"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                      Voice input coming soon
                    </button>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-3 text-sm text-sos-600 dark:text-sos-300"
                      role="alert"
                    >
                      {error}
                    </motion.p>
                  )}
                </Card>

                <Button
                  variant="gold"
                  size="lg"
                  block
                  onClick={handleAnalyse}
                  disabled={text.trim().length < 5}
                >
                  {s.submitBtn}
                </Button>
              </motion.div>
            )}

            {/* Loading */}
            {phase === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <SkeletonCard />
                <SkeletonCard />
              </motion.div>
            )}

            {/* Preview */}
            {(phase === 'preview' || phase === 'confirming') && preview && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <Card variant={preview.sosRecommended ? 'danger' : 'default'}>
                  <h2 className="mb-4 font-display text-lg font-semibold text-ink">
                    {s.previewTitle}
                  </h2>

                  {/* Tags */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Tag value={preview.urgency} colorScheme="urgency" dot>
                      {s.urgencyLabel}: {preview.urgency}
                    </Tag>
                    <Tag value="FILED">
                      {s.categoryLabel}: {preview.category}
                    </Tag>
                  </div>

                  {/* Statute */}
                  <div className="space-y-2">
                    <div className="rounded-xl bg-canvas-2 p-4 ring-1 ring-line">
                      <p className="mb-1 text-xs text-ink-soft">{s.statuteLabel}</p>
                      <p className="text-sm font-medium text-ink">
                        {preview.statute}
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">
                        {s.sectionLabel}: {preview.section}
                      </p>
                    </div>

                    {/* Citations */}
                    {preview.citations.length > 0 && (
                      <div className="rounded-xl bg-canvas-2 p-4 ring-1 ring-line">
                        <p className="mb-2 text-xs text-ink-soft">{s.citationsLabel}</p>
                        <ul className="space-y-1.5">
                          {preview.citations.map((cite, i) => (
                            <li key={i} className="text-xs text-ink-muted">
                              <span className="text-brand-600 dark:text-brand-300">{cite.source}</span>
                              {' — '}
                              {cite.snippet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Officer */}
                    <div className="rounded-xl bg-canvas-2 p-4 ring-1 ring-line">
                      <p className="mb-1 text-xs text-ink-soft">{s.officerLabel}</p>
                      <p className="text-sm font-medium text-ink">
                        {preview.officer.name}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {preview.officer.designation} · {preview.officer.department}
                      </p>
                    </div>
                  </div>

                  {/* Lawyer review warning */}
                  {preview.needs_lawyer_review && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-saffron-200 bg-saffron-50 px-3 py-2 dark:border-saffron-500/20 dark:bg-saffron-500/10">
                      <span aria-hidden="true">⚖️</span>
                      <p className="text-xs text-saffron-700 dark:text-saffron-200">{s.needsLawyer}</p>
                    </div>
                  )}
                </Card>

                {/* Reasoning */}
                {preview.reasoning && (
                  <Card variant="ghost" className="px-0">
                    <p className="text-xs italic text-ink-muted">
                      &quot;{preview.reasoning}&quot;
                    </p>
                  </Card>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setPhase('input');
                      setPreview(null);
                    }}
                  >
                    {strings.common.back}
                  </Button>
                  <Button
                    variant="gold"
                    className="flex-1"
                    loading={phase === 'confirming'}
                    onClick={handleConfirm}
                  >
                    {phase === 'confirming' ? s.confirmingBtn : s.confirmBtn}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SOS Bottom Sheet */}
        <BottomSheet
          open={sosSheet}
          onClose={() => setSosSheet(false)}
          danger
        >
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
              <span className="text-3xl" aria-hidden="true">🚨</span>
            </div>
            <h3 className="font-display text-xl font-semibold text-white">
              {s.sosWarning}
            </h3>
            <p className="text-sm text-white/80">{s.sosMessage}</p>
            <Button
              variant="danger"
              size="lg"
              block
              onClick={() => {
                router.push(`/sos?message=${encodeURIComponent(text)}`);
              }}
            >
              {s.sosAction}
            </Button>
          </div>
        </BottomSheet>
      </main>
    </ErrorBoundary>
  );
}
