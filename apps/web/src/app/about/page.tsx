import Link from 'next/link';
import { Section } from '@/components/sections/Section';

export const metadata = {
  title: 'About',
  description:
    'Justice OS is the execution layer for civic justice in India — built by Team Maverick.',
};

const values = [
  {
    title: 'Execution over awareness',
    body: 'A right people know about but can\u2019t enforce isn\u2019t a right yet. We obsess over the last mile.',
    glyph: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <polyline points="22 6 12 16 8 12 4 16" />
        <polyline points="14 6 22 6 22 14" />
      </svg>
    ),
  },
  {
    title: 'Citation-grade reasoning',
    body: 'Every recommendation we make is paired with the statute, section and a verbatim citation. No hallucinations.',
    glyph: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M12 4v16M5 8h14M5 16h14" />
      </svg>
    ),
  },
  {
    title: 'Built for India\u2019s plurality',
    body: 'Multilingual, multi-channel (SMS, WhatsApp, email), multi-jurisdiction. From a Tier-3 town to a metro.',
    glyph: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2c3 3 3 17 0 20-3-3-3-17 0-20z" />
      </svg>
    ),
  },
] as const;

const layers = [
  { id: 0, name: 'Urgency',     line: 'Pulse SOS — broadcast in seconds.' },
  { id: 1, name: 'Intelligence',line: 'Statute Guard — citations or it didn\u2019t happen.' },
  { id: 2, name: 'Execution',   line: 'Direct-File — to the right officer\u2019s inbox.' },
  { id: 3, name: 'Persistence', line: 'Persistence Bot — follow-ups until resolution.' },
] as const;

export default function AboutPage() {
  return (
    <main>
      {/* Hero band */}
      <section className="relative isolate overflow-hidden">
        <div className="india-canvas absolute inset-0 -z-10" />
        <div className="absolute inset-0 -z-10 grid-overlay opacity-40" />
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-16 pt-24 text-center sm:pt-28">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-ink-muted backdrop-blur">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-saffron-500" />
            About Justice OS
          </p>
          <h1 className="font-display text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl md:text-7xl">
            Building the execution layer for{' '}
            <span className="gradient-text-india">civic justice in India.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-balance text-base leading-relaxed text-ink-muted sm:text-lg">
            We&apos;re a small team obsessed with the gap between a right
            written into law and a citizen actually being able to use it. Justice
            OS is what closes that gap — quietly, autonomously, at scale.
          </p>
        </div>
      </section>

      {/* Values */}
      <Section
        eyebrow="What we believe"
        title="Three principles that shape the product."
      >
        <div className="grid gap-5 md:grid-cols-3">
          {values.map((v) => (
            <article
              key={v.title}
              className="rounded-3xl border border-line bg-card p-7 shadow-card"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-canvas-2 text-ink ring-1 ring-line">
                {v.glyph}
              </div>
              <h3 className="font-display text-lg font-semibold text-ink">
                {v.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {v.body}
              </p>
            </article>
          ))}
        </div>
      </Section>

      {/* The four layers */}
      <Section
        eyebrow="The four layers"
        title="A small system, deeply integrated."
        description="Each layer plugs into the others. Together they take a citizen from a sentence to a resolution."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {layers.map((l) => (
            <article
              key={l.id}
              className="flex items-start gap-4 rounded-3xl border border-line bg-card p-6 shadow-card"
            >
              <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-saffron-50 font-display text-base font-semibold text-saffron-700 ring-1 ring-saffron-100 dark:bg-saffron-500/15 dark:text-saffron-300 dark:ring-saffron-500/20">
                L{l.id}
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">
                  {l.name}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">{l.line}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* Team */}
      <Section
        eyebrow="Team Maverick"
        title="A two-person team. Many late nights."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {[
            { name: 'Kamakshi Pandoh', role: 'Product & Design' },
            { name: 'Chirag', role: 'Engineering & AI' },
          ].map((m) => (
            <div
              key={m.name}
              className="rounded-3xl border border-line bg-card p-7 shadow-card"
            >
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-ink font-display text-base font-semibold text-canvas">
                {m.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <p className="font-display text-lg font-semibold text-ink">
                {m.name}
              </p>
              <p className="mt-1 text-sm text-ink-muted">{m.role}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/chat"
            className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-sm font-medium text-canvas shadow-soft-xl hover:opacity-90"
          >
            Try Justice OS
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center rounded-full border border-line bg-card px-6 text-sm font-medium text-ink hover:bg-canvas-2"
          >
            Open dashboard
          </Link>
        </div>
      </Section>
    </main>
  );
}
