'use client';

import { motion } from 'framer-motion';
import { Tag } from './Tag';
import { Card } from './Card';
import { strings } from '@/lib/strings';
import type { NoticeEvent } from '@/lib/api';

const s = strings.grievance;

/* ── Icons per EventKind ──────────────────────────────────── */

const eventIcons: Record<string, string> = {
  FILED: '📄',
  FOLLOWUP_7D: '🔔',
  ESCALATION_14D: '⚠️',
  SOS_BROADCAST: '🚨',
};

const eventColors: Record<string, string> = {
  FILED: 'bg-brand-500',
  FOLLOWUP_7D: 'bg-amber-500',
  ESCALATION_14D: 'bg-sos-500',
  SOS_BROADCAST: 'bg-sos-600',
};

/* ── Types ────────────────────────────────────────────────── */

export interface TimelineProps {
  events: NoticeEvent[];
  className?: string;
}

/* ── Stagger animation ────────────────────────────────────── */

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/* ── Component ────────────────────────────────────────────── */

export function Timeline({ events, className = '' }: TimelineProps) {
  if (events.length === 0) {
    return (
      <Card variant="ghost" className="py-8 text-center">
        <p className="text-sm text-ink-soft">{s.noEvents}</p>
      </Card>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={`relative ${className}`}
      role="list"
      aria-label={s.timelineTitle}
    >
      {/* Vertical line */}
      <div className="absolute left-5 top-0 h-full w-0.5 bg-gradient-timeline opacity-30" />

      {events.map((event, i) => (
        <motion.div
          key={event.id}
          variants={item}
          className="relative flex gap-4 pb-8 last:pb-0"
          role="listitem"
        >
          {/* Node dot */}
          <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${eventColors[event.kind] ?? 'bg-slate-600'} shadow-lg`}
            >
              <span className="text-lg" aria-hidden="true">
                {eventIcons[event.kind] ?? '📋'}
              </span>
            </div>
            {/* Pulse ring on latest event */}
            {i === events.length - 1 && (
              <span
                className={`absolute inset-0 rounded-full ${eventColors[event.kind] ?? 'bg-slate-600'} animate-pulse-ring opacity-40`}
              />
            )}
          </div>

          {/* Event card */}
          <Card className="flex-1" variant="default">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-ink">
                {s.eventLabels[event.kind] ?? event.kind}
              </h3>
              <Tag
                value={event.channel}
                colorScheme="channel"
                small
              >
                {s.channelLabels[event.channel] ?? event.channel}
              </Tag>
            </div>

            <time className="mt-1 block text-xs text-ink-soft">
              {new Date(event.sentAt).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </time>

            {/* Payload preview */}
            {event.payload && Object.keys(event.payload).length > 0 && (
              <div className="mt-3 rounded-lg bg-canvas-2 p-3 ring-1 ring-line">
                <pre className="overflow-x-auto scrollbar-hide text-xs text-ink-muted">
                  {JSON.stringify(event.payload, null, 2).slice(0, 300)}
                </pre>
              </div>
            )}
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
