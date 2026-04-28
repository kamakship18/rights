'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

const items = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m3 11 9-8 9 8" />
        <path d="M5 9.5V21h14V9.5" />
        <path d="M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    href: '/dashboard?tab=complaints',
    match: '/dashboard',
    label: 'My Complaints',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="13" y2="17" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
    ),
  },
  {
    href: '/local-issues',
    label: 'Local Issues',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/blockchain',
    label: 'Blockchain',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="7" width="6" height="5" rx="1" />
        <rect x="9" y="7" width="6" height="5" rx="1" />
        <rect x="16" y="7" width="6" height="5" rx="1" />
        <path d="M5 12v3M12 12v3M19 12v3" />
        <path d="M3 15h18" />
      </svg>
    ),
  },
  {
    href: '/performance',
    label: 'Performance',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3v18h18" />
        <path d="m7 16 4-4 4 4 4-4" />
      </svg>
    ),
  },
  {
    href: '/onboard',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z" />
      </svg>
    ),
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-line/80 bg-canvas-2/60 backdrop-blur md:block">
      <div className="sticky top-16 flex h-[calc(100dvh-4rem)] flex-col p-5">
        <p className="mb-4 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
          Workspace
        </p>
        <nav className="space-y-1">
          {items.map((it) => {
            const match = ('match' in it ? it.match : it.href) as string;
            const active =
              match === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(match);
            return (
              <Link
                key={it.label}
                href={it.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-card text-ink shadow-card'
                    : 'text-ink-muted hover:bg-card hover:text-ink'
                }`}
              >
                <span className={`grid h-7 w-7 place-items-center rounded-lg ${active ? 'bg-saffron-50 text-saffron-600 dark:bg-saffron-500/15 dark:text-saffron-300' : 'bg-canvas-2 text-ink-muted group-hover:bg-canvas group-hover:text-ink'}`}>
                  {it.icon}
                </span>
                {it.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-line bg-card p-4">
          <p className="text-xs font-medium text-ink">
            {user?.firstName ? `Hello, ${user.firstName}` : 'Welcome'}
          </p>
          <p className="mt-1 text-[11px] text-ink-muted">
            Need to file something urgent?
          </p>
          <Link
            href="/chat"
            className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl bg-ink text-xs font-medium text-canvas hover:opacity-90"
          >
            New grievance
          </Link>
        </div>
      </div>
    </aside>
  );
}
