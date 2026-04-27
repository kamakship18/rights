'use client';

import { useState, useEffect, useMemo } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import { ClerkProvider, useAuth, useUser } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { OnboardingModal } from '@/components/OnboardingModal';
import { createApiClient } from '@/lib/api';

/**
 * App-wide providers.
 *
 * - next-themes: light/dark mode without flash
 * - Clerk:       auth context, switches its own appearance with the theme
 * - OnboardingGate: shows onboarding modal once when profileComplete === false
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <ClerkAdapter>{children}</ClerkAdapter>
    </ThemeProvider>
  );
}

function ClerkAdapter({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <ClerkProvider
      appearance={{
        baseTheme: isDark ? dark : undefined,
        variables: {
          colorPrimary: '#1c233c',
          borderRadius: '0.875rem',
        },
        elements: {
          card: 'shadow-soft-xl border border-line bg-card',
          headerTitle: 'font-display text-2xl text-ink',
          formButtonPrimary:
            'bg-ink text-canvas hover:opacity-90 transition-colors rounded-xl',
        },
      }}
    >
      <OnboardingGate>{children}</OnboardingGate>
    </ClerkProvider>
  );
}

/**
 * After sign-in, fetches the DB profile. If profileComplete === false,
 * shows the onboarding modal.
 *
 * Uses user.id as the key so the entire subtree remounts when the
 * signed-in user changes — this guarantees no state leaks between accounts.
 */
function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const api = useMemo(() => createApiClient(getToken), [getToken]);
  const [showModal, setShowModal] = useState(false);

  // Reset modal state whenever the signed-in user changes
  useEffect(() => {
    setShowModal(false);
  }, [user?.id]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;
    api
      .getProfile()
      .then((p) => {
        if (!p.profileComplete) setShowModal(true);
      })
      .catch(() => {
        // Silent — don't block the app if profile call fails
      });
  // Re-run whenever the user ID changes so a second sign-in is checked too
  }, [isLoaded, isSignedIn, user?.id, api]);

  return (
    <>
      {children}
      {showModal && <OnboardingModal onDone={() => setShowModal(false)} />}
    </>
  );
}
