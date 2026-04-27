'use client';

import { Component, type ReactNode } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { strings } from '@/lib/strings';

const s = strings.common;

/* ── Types ────────────────────────────────────────────────── */

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/* ── Component ────────────────────────────────────────────── */

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="mx-auto max-w-md text-center">
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sos-500/15">
              <svg
                className="h-8 w-8 text-sos-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="font-display text-lg font-semibold text-white">
              {s.error}
            </h2>
            <p className="text-sm text-slate-400">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <Button variant="outline" onClick={this.handleRetry}>
              {s.retry}
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
