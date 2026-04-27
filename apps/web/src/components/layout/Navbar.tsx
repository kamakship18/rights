'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

const links = [
  { label: 'Home',      href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'About',     href: '/about' },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-line/80 bg-canvas/75 backdrop-blur-xl shadow-[0_1px_0_0_rgb(var(--c-line)/0.6)]'
          : 'border-b border-transparent bg-canvas/0'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between pl-2.5 pr-4 sm:pl-4 sm:pr-6 lg:pl-5 lg:pr-8">
        <div className="flex min-w-0 items-center gap-4 md:gap-8">
          <Logo
            size="lg"
            className="shrink-0 -translate-x-px pl-0 sm:translate-x-0"
          />
          <ul className="hidden items-center gap-0.5 md:flex">
            {links.map((l) => {
              const active =
                l.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`relative inline-flex h-10 items-center rounded-full px-3.5 text-base font-medium transition-colors sm:px-4 ${
                      active
                        ? 'text-ink'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    {l.label}
                    {active && (
                      <span className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-saffron-500" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-center gap-2">
          <SignedIn>
            <Link
              href="/chat"
              className="hidden rounded-full bg-ink px-4 py-2.5 text-base font-medium text-canvas shadow-sm transition-all hover:opacity-90 sm:inline-flex"
            >
              File grievance
            </Link>
          </SignedIn>
          <SignedOut>
            <Link
              href="/sign-in"
              className="hidden rounded-full px-4 py-2.5 text-base font-medium text-ink-muted hover:text-ink sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="hidden rounded-full bg-ink px-4 py-2.5 text-base font-medium text-canvas shadow-sm transition-all hover:opacity-90 sm:inline-flex"
            >
              Get started
            </Link>
          </SignedOut>

          <ThemeToggle />

          <SignedIn>
            <div className="ml-1">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'h-8 w-8 rounded-full ring-2 ring-line',
                  },
                }}
              />
            </div>
          </SignedIn>

          {/* Mobile menu */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-ink-muted hover:text-ink md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {open ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="13" x2="20" y2="13" />
                  <line x1="4" y1="19" x2="14" y2="19" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`md:hidden overflow-hidden border-line/80 bg-canvas/95 backdrop-blur transition-[max-height,opacity] duration-300 ${
          open ? 'max-h-72 opacity-100 border-b' : 'max-h-0 opacity-0'
        }`}
      >
        <ul className="flex flex-col px-4 py-3">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="block rounded-xl px-3 py-3 text-base font-medium text-ink-muted hover:bg-card hover:text-ink"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="mt-2 flex gap-2">
            <SignedOut>
              <Link
                href="/sign-in"
                className="flex-1 rounded-full border border-line px-4 py-2.5 text-center text-base font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="flex-1 rounded-full bg-ink px-4 py-2.5 text-center text-base font-medium text-canvas"
              >
                Get started
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/chat"
                className="flex-1 rounded-full bg-ink px-4 py-2.5 text-center text-base font-medium text-canvas"
              >
                File grievance
              </Link>
            </SignedIn>
          </li>
        </ul>
      </div>
    </header>
  );
}
