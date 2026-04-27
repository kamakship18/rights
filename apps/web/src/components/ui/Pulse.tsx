'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { strings } from '@/lib/strings';

const s = strings.sos;

/* ── Types ────────────────────────────────────────────────── */

export interface PulseProps {
  /** Called when the user completes a 1-second hold */
  onTrigger: () => void;
  /** Disable interaction (e.g. while triggering) */
  disabled?: boolean;
  /** Size in pixels */
  size?: number;
  className?: string;
}

/* ── Component ────────────────────────────────────────────── */

export function Pulse({
  onTrigger,
  disabled = false,
  size = 180,
  className = '',
}: PulseProps) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);
  const triggeredRef = useRef(false);

  const HOLD_MS = 1000;

  const startHold = useCallback(() => {
    if (disabled) return;
    triggeredRef.current = false;
    setHolding(true);
    startRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(elapsed / HOLD_MS, 1);
      setProgress(pct);

      if (pct >= 1 && !triggeredRef.current) {
        triggeredRef.current = true;
        clearInterval(timerRef.current!);
        onTrigger();
      }
    }, 16);
  }, [disabled, onTrigger]);

  const cancelHold = useCallback(() => {
    setHolding(false);
    setProgress(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /* SVG progress ring params */
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer pulse rings (always animate) */}
      {!disabled && (
        <>
          <motion.div
            className="absolute rounded-full bg-sos-500/20"
            style={{ width: size + 60, height: size + 60 }}
            animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute rounded-full bg-sos-500/15"
            style={{ width: size + 40, height: size + 40 }}
            animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.5,
            }}
          />
        </>
      )}

      {/* Progress ring */}
      <AnimatePresence>
        {holding && (
          <motion.svg
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute"
            width={size + 16}
            height={size + 16}
            style={{ transform: 'rotate(-90deg)' }}
          >
            <circle
              cx={(size + 16) / 2}
              cy={(size + 16) / 2}
              r={radius + 8}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="4"
            />
            <circle
              cx={(size + 16) / 2}
              cy={(size + 16) / 2}
              r={radius + 8}
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * (radius + 8)}
              strokeDashoffset={
                2 * Math.PI * (radius + 8) * (1 - progress)
              }
              className="transition-[stroke-dashoffset] duration-75"
            />
          </motion.svg>
        )}
      </AnimatePresence>

      {/* Main button */}
      <motion.button
        className={`relative z-10 flex items-center justify-center rounded-full font-display text-lg font-bold text-white shadow-glow-sos select-none ${
          disabled
            ? 'bg-slate-600 cursor-not-allowed'
            : 'bg-gradient-to-br from-sos-400 via-sos-500 to-sos-700 cursor-pointer active:from-sos-500 active:to-sos-800'
        }`}
        style={{ width: size, height: size }}
        whileHover={disabled ? {} : { scale: 1.05 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onContextMenu={(e) => e.preventDefault()}
        disabled={disabled}
        aria-label={s.holdToTrigger}
        role="button"
      >
        {/* Inner icon */}
        <div className="flex flex-col items-center gap-1">
          <svg
            className="h-12 w-12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span className="text-xs uppercase tracking-wider opacity-80">SOS</span>
        </div>
      </motion.button>

      {/* Hold instruction */}
      <motion.p
        className="absolute -bottom-10 text-center text-xs text-white/60"
        animate={{ opacity: holding ? 0 : 1 }}
      >
        {disabled ? s.triggering : s.holdToTrigger}
      </motion.p>
    </div>
  );
}
