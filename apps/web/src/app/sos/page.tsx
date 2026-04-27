'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Pulse,
  Button,
  Card,
  Tag,
  ErrorBoundary,
} from '@/components/ui';
import { createApiClient, type NearestPlace, type SosTriggerResponse } from '@/lib/api';
import {
  createSosSocket,
  disconnectSosSocket,
  onSosEvent,
  type SosDeliveryPayload,
} from '@/lib/socket';
import { strings } from '@/lib/strings';

const s = strings.sos;

/* ── Delivery card per contact ────────────────────────────── */

function DeliveryCard({ d }: { d: SosDeliveryPayload }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-xl border border-white/10 bg-white/[0.05] p-3"
    >
      <p className="text-xs text-white/60 mb-2">
        Contact: {d.contactId.slice(0, 8)}…
      </p>
      <div className="flex gap-4">
        <StatusPill
          label={s.smsLabel}
          ok={d.delivery.sms.ok}
          error={d.delivery.sms.error}
        />
        <StatusPill
          label={s.whatsappLabel}
          ok={d.delivery.whatsapp.ok}
          error={d.delivery.whatsapp.error}
        />
      </div>
    </motion.div>
  );
}

function StatusPill({
  label,
  ok,
  error,
}: {
  label: string;
  ok: boolean;
  error?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        ok ? 'text-emerald-400' : 'text-sos-400'
      }`}
      title={error}
    >
      {ok ? '✓' : '✗'} {label}
    </span>
  );
}

/* ── Place card ───────────────────────────────────────────── */

function PlaceCard({ place, icon }: { place: NearestPlace; icon: string }) {
  const mapUrl = `https://maps.google.com/?q=${place.lat},${place.lng}`;
  return (
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-white/10 bg-white/[0.05] p-3 transition-colors hover:border-white/20 hover:bg-white/[0.08]"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl" aria-hidden="true">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {place.name}
          </p>
          <p className="text-xs text-white/50 truncate mt-0.5">
            {place.address}
          </p>
          <p className="text-[10px] text-white/40 mt-1">
            {place.distance_km?.toFixed(1)} km away · {s.openMap} →
          </p>
        </div>
      </div>
    </a>
  );
}

/* ── Default export wraps in Suspense ─────────────────────── */

export default function SosPage() {
  return (
    <Suspense
      fallback={
        <main className="sos-bg flex min-h-dvh items-center justify-center">
          <p className="text-lg text-white/60 animate-pulse">Loading SOS…</p>
        </main>
      }
    >
      <SosContent />
    </Suspense>
  );
}

/* ── Main SOS Content ─────────────────────────────────────── */

function SosContent() {
  const searchParams = useSearchParams();
  const prefillMessage = searchParams.get('message') ?? '';
  const { getToken } = useAuth();
  const api = createApiClient(getToken);

  const [phase, setPhase] = useState<'ready' | 'triggering' | 'triggered' | 'error'>('ready');
  const [result, setResult] = useState<SosTriggerResponse | null>(null);
  const [deliveries, setDeliveries] = useState<SosDeliveryPayload[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const socketCleanup = useRef<(() => void) | null>(null);

  /* Cleanup socket on unmount */
  useEffect(() => {
    return () => {
      socketCleanup.current?.();
      disconnectSosSocket();
    };
  }, []);

  /* ── Trigger SOS ────────────────────────────────────────── */
  const handleTrigger = useCallback(async () => {
    setPhase('triggering');
    setDeliveries([]);
    setErrorMsg('');

    /* 1. Request geolocation */
    let lat: number;
    let lng: number;

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
        });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      setErrorMsg(s.locationError);
      setPhase('error');
      return;
    }

    /* 2. Connect Socket.io for live status */
    try {
      const token = await getToken();
      const socket = createSosSocket(token);

      const unsubStatus = onSosEvent(socket, 'sos:status', (payload) => {
        setDeliveries((prev) => [...prev, payload]);
      });

      const unsubError = onSosEvent(socket, 'sos:error', (payload) => {
        console.error('SOS WS error:', payload);
      });

      socketCleanup.current = () => {
        unsubStatus();
        unsubError();
      };
    } catch (err) {
      console.warn('Socket connection failed, continuing without live updates:', err);
    }

    /* 3. POST /sos/trigger */
    try {
      const response = await api.sosTrigger({
        lat,
        lng,
        message: prefillMessage || undefined,
      });
      setResult(response);
      setPhase('triggered');
    } catch (err) {
      setErrorMsg('SOS trigger failed. Please call 112 directly.');
      setPhase('error');
    }
  }, [api, getToken, prefillMessage]);

  return (
    <ErrorBoundary>
      <main className="sos-bg relative flex min-h-dvh flex-col items-center overflow-hidden">
        {/* Background pulse glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-sos-500/20 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center w-full max-w-lg px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4"
          >
            <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
              {s.title}
            </h1>
          </motion.div>

          {/* Pulse button (ready state) */}
          <AnimatePresence mode="wait">
            {phase === 'ready' && (
              <motion.div
                key="pulse"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-1 items-center justify-center py-8"
              >
                <Pulse onTrigger={handleTrigger} size={180} />
              </motion.div>
            )}

            {/* Triggering */}
            {phase === 'triggering' && (
              <motion.div
                key="triggering"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-1 flex-col items-center justify-center gap-6"
              >
                <div className="h-20 w-20 rounded-full bg-white/10 flex items-center justify-center">
                  <svg
                    className="h-10 w-10 text-white animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="3"
                      className="opacity-25"
                    />
                    <path
                      d="M4 12a8 8 0 018-8"
                      stroke="currentColor" strokeWidth="3"
                      strokeLinecap="round"
                      className="opacity-75"
                    />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-white">{s.triggering}</p>
              </motion.div>
            )}

            {/* Error */}
            {phase === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-1 flex-col items-center justify-center gap-6"
              >
                <p className="text-white/80 text-center">{errorMsg}</p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setPhase('ready')}>
                    {strings.common.retry}
                  </Button>
                  <a href="tel:112">
                    <Button variant="danger" size="lg">
                      {s.call112}
                    </Button>
                  </a>
                </div>
              </motion.div>
            )}

            {/* Triggered — results */}
            {phase === 'triggered' && result && (
              <motion.div
                key="triggered"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full space-y-5 py-6"
              >
                {/* Success header */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
                    <span className="text-3xl">✓</span>
                  </div>
                  <p className="font-display text-xl font-bold text-white">
                    {s.triggered}
                  </p>
                  <p className="text-sm text-white/60 mt-1">
                    Sent to {result.broadcastedTo} contact{result.broadcastedTo !== 1 ? 's' : ''}
                  </p>
                </motion.div>

                {/* Call 112 */}
                <a href="tel:112" className="block">
                  <Card
                    variant="ghost"
                    className="border border-white/20 bg-white/10 text-center"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <svg
                        className="h-6 w-6 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <div>
                        <p className="font-display text-lg font-bold text-white">
                          {s.call112}
                        </p>
                        <p className="text-xs text-white/50">{s.call112Sub}</p>
                      </div>
                    </div>
                  </Card>
                </a>

                {/* Live delivery status */}
                {deliveries.length > 0 && (
                  <section>
                    <h2 className="font-display text-sm font-semibold text-white/80 mb-3">
                      {s.deliveryStatus}
                    </h2>
                    <div className="space-y-2">
                      {deliveries.map((d, i) => (
                        <DeliveryCard key={i} d={d} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Nearby places */}
                {result.places.police.length > 0 && (
                  <section>
                    <h2 className="font-display text-sm font-semibold text-white/80 mb-3">
                      🚔 {s.nearbyPolice}
                    </h2>
                    <div className="space-y-2">
                      {result.places.police.slice(0, 3).map((p, i) => (
                        <PlaceCard key={i} place={p} icon="🚔" />
                      ))}
                    </div>
                  </section>
                )}

                {result.places.hospitals.length > 0 && (
                  <section>
                    <h2 className="font-display text-sm font-semibold text-white/80 mb-3">
                      🏥 {s.nearbyHospitals}
                    </h2>
                    <div className="space-y-2">
                      {result.places.hospitals.slice(0, 3).map((p, i) => (
                        <PlaceCard key={i} place={p} icon="🏥" />
                      ))}
                    </div>
                  </section>
                )}

                {/* Navigation */}
                <div className="flex gap-3 pt-4">
                  <Link href="/onboard" className="flex-1">
                    <Button variant="outline" block size="sm">
                      {s.addContacts}
                    </Button>
                  </Link>
                  <Link href="/dashboard" className="flex-1">
                    <Button variant="ghost" block size="sm">
                      {strings.dashboard.title}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </ErrorBoundary>
  );
}
