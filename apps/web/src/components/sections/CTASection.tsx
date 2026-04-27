'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function CTASection() {
  return (
    <section className="px-6 pb-24 pt-8 sm:pb-32">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
          className="relative isolate overflow-hidden rounded-[36px] border border-line bg-gradient-to-br from-canvas-2 via-card to-canvas-2 px-8 py-14 sm:px-14 sm:py-20"
        >
          <div className="pointer-events-none absolute -left-20 top-1/2 -z-10 h-72 w-72 -translate-y-1/2 rounded-full bg-saffron-200/60 blur-3xl dark:bg-saffron-500/15" />
          <div className="pointer-events-none absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full bg-leaf-200/60 blur-3xl dark:bg-leaf-500/15" />
          <div className="pointer-events-none absolute bottom-0 right-1/3 -z-10 h-60 w-60 rounded-full bg-lotus-200/60 blur-3xl dark:bg-lotus-500/15" />

          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-ink-muted backdrop-blur">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-saffron-500" />
              Take the first step
            </p>
            <h2 className="font-display text-balance text-3xl font-semibold tracking-tight text-ink sm:text-5xl md:text-6xl">
              Know your rights.{' '}
              <span className="gradient-text-india">Act on them.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-ink-muted sm:text-lg">
              Filing a grievance shouldn&apos;t feel harder than the grievance
              itself. Try Justice OS — it&apos;s free for citizens.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/chat"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-7 text-sm font-medium text-canvas shadow-soft-xl transition-transform hover:scale-[1.02]"
              >
                File a grievance
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-line bg-card/80 px-7 text-sm font-medium text-ink backdrop-blur transition-colors hover:bg-card"
              >
                Open dashboard
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
