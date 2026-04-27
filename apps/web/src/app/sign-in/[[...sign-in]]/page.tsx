import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center px-4">
      <div className="india-canvas absolute inset-0 -z-10" />
      <div className="absolute inset-0 -z-10 grid-overlay opacity-40" />
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to home
        </Link>
        <SignIn
          afterSignInUrl="/dashboard"
          signUpUrl="/sign-up"
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-card border border-line shadow-soft-xl rounded-3xl',
              headerTitle: 'font-display text-2xl text-ink',
              headerSubtitle: 'text-ink-muted',
              socialButtonsBlockButton:
                'border border-line text-ink hover:bg-canvas-2',
              formButtonPrimary:
                'bg-ink text-canvas hover:opacity-90 transition-opacity rounded-xl',
              footerActionLink: 'text-saffron-600 hover:text-saffron-500',
            },
          }}
        />
      </div>
    </main>
  );
}
