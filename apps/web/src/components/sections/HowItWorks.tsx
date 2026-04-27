'use client';

import { motion } from 'framer-motion';
import { Section } from './Section';

const steps = [
  {
    n: '01',
    title: 'You describe the problem',
    body: 'Type or speak in plain English or Hindi. No forms. No legal jargon. Just what happened.',
    icon: (
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 7h22v15H10l-5 5z" />
        <line x1="10" y1="13" x2="22" y2="13" />
        <line x1="10" y1="17" x2="18" y2="17" />
      </svg>
    ),
  },
  {
    n: '02',
    title: 'AI understands the intent',
    body: 'We classify the issue, detect urgency, and pull the most relevant statute, section and citation.',
    icon: (
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="16" cy="16" r="6" />
        <path d="M16 4v3M16 25v3M28 16h-3M7 16H4M24 8l-2 2M10 22l-2 2M24 24l-2-2M10 10L8 8" />
      </svg>
    ),
  },
  {
    n: '03',
    title: 'Authority mapping',
    body: 'We map your PIN code → the specific nodal officer who has to act, with email and designation.',
    icon: (
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 28s9-9 9-15a9 9 0 1 0-18 0c0 6 9 15 9 15z" />
        <circle cx="16" cy="13" r="3.2" />
      </svg>
    ),
  },
  {
    n: '04',
    title: 'Complaint generated & filed',
    body: 'A legally-grounded notice is drafted citing the right section, then sent across email/SMS/WhatsApp.',
    icon: (
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 4H7a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V11z" />
        <polyline points="14 4 14 11 22 11" />
        <line x1="11" y1="20" x2="22" y2="20" />
        <line x1="11" y1="16" x2="22" y2="16" />
      </svg>
    ),
  },
  {
    n: '05',
    title: 'Action — until it&apos;s resolved',
    body: 'Auto follow-ups at 7 days, escalation at 14, with a public chain-of-action timeline.',
    icon: (
      <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22 6 12 16 8 12 4 16" />
        <polyline points="14 6 22 6 22 14" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <Section
      id="how"
      eyebrow="How it works"
      title="From a sentence, to a filed complaint, to action."
      description="Five quiet steps. No paperwork, no language tax, no following up by hand."
    >
      <div className="relative">
        {/* Vertical connector */}
        <div
          className="absolute left-[27px] top-2 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-saffron-300 via-line to-leaf-300 sm:block"
          aria-hidden="true"
        />

        <ol className="space-y-5">
          {steps.map((s, i) => (
            <motion.li
              key={s.n}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.06, duration: 0.55, ease: 'easeOut' }}
              className="relative flex gap-5 sm:gap-7"
            >
              <div className="relative z-10 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-line bg-card text-ink shadow-card">
                {s.icon}
                <span className="absolute -bottom-2 -right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-saffron-500 text-[10px] font-semibold text-white shadow-sm">
                  {s.n}
                </span>
              </div>
              <div className="flex-1 rounded-3xl border border-line bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover">
                <h3 className="font-display text-xl font-semibold text-ink">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.body}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
