'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { HeroVisual } from '@/components/hero/HeroVisual';
import { HeroDecor } from '@/components/hero/HeroDecor';

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Soft tricolor-pastel canvas (hero spec) */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-100 via-pink-100 to-green-100 dark:from-navy-950 dark:via-navy-900 dark:to-slate-900" />
      <div className="absolute inset-0 -z-10 grid-overlay opacity-10 dark:opacity-[0.08]" />
      {/* Soft glow orbs */}
      <div className="pointer-events-none absolute left-1/2 top-[-180px] -z-10 h-[420px] w-[640px] -translate-x-1/2 rounded-full bg-gradient-to-br from-sky-200/70 via-leaf-100/60 to-lotus-100/70 blur-3xl dark:from-sky-500/20 dark:via-leaf-500/10 dark:to-lotus-500/20" />

      {/* Cinematic edge decorations — kite (left) + chakra (right), partially cropped */}
      <HeroDecor />

      {/* Note: parent layout already applies pt-16 for the fixed nav — keep this modest so the badge sits closer to the header */}
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-6 pt-4 pb-6 sm:pt-5 sm:pb-8 md:pt-6 md:pb-10">
        <motion.span
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-4 py-1.5 text-xs font-medium tracking-[0.15em] text-ink-muted uppercase backdrop-blur"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-leaf-500" />
          </span>
          Justice OS · For India
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-balance text-center font-display text-[44px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl md:text-[76px] lg:text-[88px]"
        >
          Rights exist.
          <br />
          <span className="gradient-text-india">Access doesn&apos;t.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mt-6 max-w-2xl text-balance text-center text-base leading-relaxed text-ink-muted sm:text-lg"
        >
          An AI-powered platform that helps Indian citizens take action on their
          rights — translating intent into the right law, the right officer, and
          autonomous follow-ups, until something changes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/chat"
            className="group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-full bg-ink px-6 text-sm font-medium text-canvas shadow-soft-xl transition-all hover:scale-[1.02]"
          >
            File your first grievance
            <svg
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <Link
            href="#how"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-line bg-card/70 px-6 text-sm font-medium text-ink backdrop-blur transition-colors hover:border-line-strong hover:bg-card"
          >
            See how it works
          </Link>
        </motion.div>

        {/* Hero visual — pulled closer to CTA */}
        <div className="relative -mt-2 w-full sm:mt-4 md:mt-6">
          <HeroVisual />
        </div>

        {/* Stat strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-0 grid w-full max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {[
            { v: '1.4B+', l: 'Citizens' },
            { v: '~50L',  l: 'Complaints / yr' },
            { v: '<3%',   l: 'Reach resolution' },
            { v: '24×7',  l: 'Autonomous follow-up' },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-2xl border border-line bg-card/70 px-4 py-3 text-center backdrop-blur"
            >
              <p className="font-display text-xl font-semibold text-ink sm:text-2xl">
                {s.v}
              </p>
              <p className="mt-1 text-xs text-ink-muted">{s.l}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
