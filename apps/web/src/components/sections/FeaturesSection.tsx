'use client';

import { motion } from 'framer-motion';
import { Section } from './Section';

const features = [
  {
    title: 'AI-powered understanding',
    body: 'Multilingual intent classification with citation-grade legal reasoning. We don&apos;t guess — we cite.',
    tone: 'sky',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2a4 4 0 0 1 4 4v3a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <path d="M12 18v4" />
      </svg>
    ),
  },
  {
    title: 'Auto complaint generation',
    body: 'Notices drafted with the right statute, section, citation and language for the receiving authority.',
    tone: 'saffron',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z" />
      </svg>
    ),
  },
  {
    title: 'One-click submission',
    body: 'Email, SMS and WhatsApp delivery to mapped officers. We track every send with a chain-of-action receipt.',
    tone: 'leaf',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m22 2-7 20-4-9-9-4z" />
        <path d="M22 2 11 13" />
      </svg>
    ),
  },
  {
    title: 'Smart follow-ups',
    body: 'Automated 7-day reminders, 14-day escalations and resolution capture — so silence isn&apos;t an answer.',
    tone: 'lotus',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12a9 9 0 1 1-3.2-6.9" />
        <polyline points="21 4 21 10 15 10" />
      </svg>
    ),
  },
  {
    title: 'Emergency SOS',
    body: 'Press-and-hold to broadcast your live location to trusted contacts plus the nearest police & hospitals.',
    tone: 'crimson',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10.3 3.7a2 2 0 0 1 3.4 0L22 18a2 2 0 0 1-1.7 3H3.7A2 2 0 0 1 2 18z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <circle cx="12" cy="17" r="1" />
      </svg>
    ),
  },
  {
    title: 'Citizen dashboard',
    body: 'Every grievance you&apos;ve filed, with live status, evidence trail and the assigned officer&apos;s details.',
    tone: 'indigo',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
      </svg>
    ),
  },
] as const;

const toneClasses: Record<string, string> = {
  sky:     'text-sky-600 bg-sky-50 ring-sky-100 dark:text-sky-300 dark:bg-sky-500/10 dark:ring-sky-500/20',
  saffron: 'text-saffron-600 bg-saffron-50 ring-saffron-100 dark:text-saffron-300 dark:bg-saffron-500/10 dark:ring-saffron-500/20',
  leaf:    'text-leaf-600 bg-leaf-50 ring-leaf-100 dark:text-leaf-300 dark:bg-leaf-500/10 dark:ring-leaf-500/20',
  lotus:   'text-lotus-600 bg-lotus-50 ring-lotus-100 dark:text-lotus-300 dark:bg-lotus-500/10 dark:ring-lotus-500/20',
  crimson: 'text-sos-600 bg-sos-50 ring-sos-100 dark:text-sos-300 dark:bg-sos-500/10 dark:ring-sos-500/20',
  indigo:  'text-brand-600 bg-brand-50 ring-brand-100 dark:text-brand-300 dark:bg-brand-500/10 dark:ring-brand-500/20',
};

export function FeaturesSection() {
  return (
    <Section
      id="features"
      eyebrow="Built for execution"
      title="Everything you need to turn intent into action."
      description="A small system, deeply integrated with how Indian institutions actually work — language, statute, officer, follow-up."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.05, duration: 0.55, ease: 'easeOut' }}
            className="group relative overflow-hidden rounded-3xl border border-line bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover"
          >
            <div className={`mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${toneClasses[f.tone]}`}>
              {f.icon}
            </div>
            <h3 className="font-display text-lg font-semibold text-ink">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.body}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
