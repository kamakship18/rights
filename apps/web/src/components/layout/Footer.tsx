'use client';

import Link from 'next/link';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="relative border-t border-line/80 bg-canvas/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
            Rights exist. Access doesn&apos;t. We&apos;re building the
            execution layer for civic justice in India — from emergency SOS to
            autonomous follow-ups.
          </p>
        </div>

        <FooterCol
          title="Product"
          links={[
            { label: 'How it works', href: '/#how' },
            { label: 'Features',     href: '/#features' },
            { label: 'Dashboard',    href: '/dashboard' },
            { label: 'File grievance', href: '/chat' },
          ]}
        />

        <FooterCol
          title="Company"
          links={[
            { label: 'About',   href: '/about' },
            { label: 'Profile', href: '/profile' },
            { label: 'SOS',     href: '/sos' },
          ]}
        />

        <FooterCol
          title="Legal"
          links={[
            { label: 'Privacy',         href: '#' },
            { label: 'Terms of use',    href: '#' },
            { label: 'Citizen charter', href: '#' },
          ]}
        />
      </div>

      <div className="border-t border-line/80">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-6 py-6 text-xs text-ink-soft sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Justice OS · Team Maverick — Kamakshi & Chirag</p>
          <p className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-leaf-500" />
            All systems online
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-soft">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-ink-muted transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
