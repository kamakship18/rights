'use client';

import { motion } from 'framer-motion';
import { Section } from './Section';

const stats = [
  {
    value: '1.4B+',
    label: 'Citizens, one constitution',
    body: 'Every Indian is entitled to a long list of rights — yet most are unaware of which law applies, where to go, and what to file.',
    accent: 'from-saffron-100 to-saffron-50',
    glyph: (
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="11" r="5" />
        <path d="M4 28c0-5.5 5.4-9 12-9s12 3.5 12 9" />
      </svg>
    ),
  },
  {
    value: '40–50L',
    label: 'Complaints filed each year',
    body: 'Across police, consumer forums, RTI, ombudsmen and online portals — a gigantic stream that overwhelms officers and citizens alike.',
    accent: 'from-sky-100 to-sky-50',
    glyph: (
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 6h22v18H10l-5 5z" />
        <line x1="10" y1="12" x2="22" y2="12" />
        <line x1="10" y1="17" x2="18" y2="17" />
      </svg>
    ),
  },
  {
    value: '> 70%',
    label: 'Go unreported or stall',
    body: 'Language barriers, bureaucratic mazes and missing follow-ups quietly close the gap between the right and its enforcement.',
    accent: 'from-lotus-100 to-lotus-50',
    glyph: (
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="16" r="11" />
        <line x1="9" y1="16" x2="23" y2="16" />
        <path d="M16 9c2.7 3 2.7 11 0 14" />
        <path d="M16 9c-2.7 3-2.7 11 0 14" />
      </svg>
    ),
  },
];

export function ProblemSection() {
  return (
    <Section
      id="problem"
      eyebrow="The gap"
      title="A right without action is a promise on paper."
      description="India produces some of the strongest legal protections on Earth — yet enforcement is gated by friction. We&apos;re here to shrink that gap."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {stats.map((s, i) => (
          <motion.article
            key={s.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.08, duration: 0.6, ease: 'easeOut' }}
            className="group relative overflow-hidden rounded-3xl border border-line bg-card p-7 shadow-card transition-shadow hover:shadow-card-hover"
          >
            <div className={`pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br ${s.accent} opacity-80 blur-2xl dark:opacity-30`} />
            <div className="relative">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-canvas-2 text-ink shadow-inner">
                {s.glyph}
              </div>
              <p className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                {s.value}
              </p>
              <p className="mt-2 text-sm font-medium text-ink">{s.label}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                {s.body}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </Section>
  );
}
