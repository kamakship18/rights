'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

const HIDE_NAV_ON = ['/sign-in', '/sign-up', '/sos'];
const HIDE_FOOTER_ON = [
  '/sign-in',
  '/sign-up',
  '/sos',
  '/chat',
  '/dashboard',
  '/profile',
  '/onboard',
  '/grievance',
  '/local-issues',
];
const FULL_BLEED = ['/dashboard', '/profile', '/local-issues'];

export function ChromeWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';

  const hideNav = HIDE_NAV_ON.some((p) => pathname.startsWith(p));
  const hideFooter = HIDE_FOOTER_ON.some((p) => pathname.startsWith(p));
  const fullBleed = FULL_BLEED.some((p) => pathname.startsWith(p));

  return (
    <div className="flex min-h-dvh flex-col">
      {!hideNav && <Navbar />}
      <div className={`flex-1 ${!hideNav ? 'pt-16' : ''} ${fullBleed ? 'flex' : ''}`}>
        {children}
      </div>
      {!hideFooter && <Footer />}
    </div>
  );
}
