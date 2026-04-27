'use client';

import { ThemeProvider, useTheme } from 'next-themes';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

/**
 * App-wide providers.
 *
 * - next-themes: light/dark mode without flash
 * - Clerk:       auth context, switches its own appearance with the theme
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
      {children}
    </ClerkProvider>
  );
}
