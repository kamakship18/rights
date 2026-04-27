'use client';

/* ── Skeleton loader variants ─────────────────────────────── */

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      aria-hidden="true"
      role="presentation"
    />
  );
}

/* ── Preset skeletons ─────────────────────────────────────── */

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonTimeline() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChat() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-32 rounded-xl" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/[0.06] bg-surface-card p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
