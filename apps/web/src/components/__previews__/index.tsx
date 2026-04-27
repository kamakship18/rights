'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  Input,
  Textarea,
  Tag,
  Timeline,
  Pulse,
  Skeleton,
  SkeletonCard,
  BottomSheet,
} from '../ui';

/**
 * Visual preview of all 6 UI primitives.
 * Navigate to /components-preview to see this in action (or import in Storybook).
 */
export default function ComponentPreviews() {
  const [sheet, setSheet] = useState(false);

  const mockEvents = [
    {
      id: '1',
      grievanceId: 'g1',
      kind: 'FILED',
      channel: 'EMAIL',
      source: 'SYSTEM' as const,
      message: null,
      payload: { to: 'officer@gov.in', subject: 'Noise complaint' },
      sentAt: new Date().toISOString(),
    },
    {
      id: '2',
      grievanceId: 'g1',
      kind: 'FOLLOWUP_7D',
      channel: 'EMAIL',
      source: 'SYSTEM' as const,
      message: null,
      payload: { reminder: true },
      sentAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    },
  ];

  return (
    <main className="min-h-dvh bg-navy-900 p-6 space-y-12">
      <h1 className="font-display text-3xl font-bold text-white">
        UI Component Previews
      </h1>

      {/* — Button — */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-white">
          Button
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="gold">Gold</Button>
          <Button variant="primary" loading>Loading</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="lg">Large</Button>
        </div>
      </section>

      {/* — Card — */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-white">
          Card
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>Default card with content</Card>
          <Card variant="danger">Danger card</Card>
          <Card variant="highlight">Highlight card</Card>
          <Card hoverable glow>
            Hoverable + glow
          </Card>
        </div>
      </section>

      {/* — Input — */}
      <section className="space-y-4 max-w-md">
        <h2 className="font-display text-xl font-semibold text-white">
          Input & Textarea
        </h2>
        <Input label="Full Name" placeholder="Enter your name" />
        <Input label="With Error" error="This field is required" />
        <Textarea label="Description" placeholder="Write something..." />
      </section>

      {/* — Tag — */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-white">
          Tag
        </h2>
        <div className="flex flex-wrap gap-2">
          <Tag value="PENDING" dot />
          <Tag value="FILED" />
          <Tag value="FOLLOWED_UP" />
          <Tag value="ESCALATED" />
          <Tag value="RESOLVED" />
          <Tag value="CRITICAL" colorScheme="urgency" dot />
          <Tag value="HIGH" colorScheme="urgency" />
          <Tag value="NORMAL" colorScheme="urgency" />
          <Tag value="EMAIL" colorScheme="channel" small />
          <Tag value="WHATSAPP" colorScheme="channel" small />
        </div>
      </section>

      {/* — Timeline — */}
      <section className="space-y-4 max-w-2xl">
        <h2 className="font-display text-xl font-semibold text-white">
          Timeline
        </h2>
        <Timeline events={mockEvents} />
      </section>

      {/* — Pulse — */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-white">
          Pulse (SOS)
        </h2>
        <div className="flex justify-center py-16">
          <Pulse onTrigger={() => alert('SOS Triggered!')} size={140} />
        </div>
      </section>

      {/* — Skeleton — */}
      <section className="space-y-4 max-w-md">
        <h2 className="font-display text-xl font-semibold text-white">
          Skeleton
        </h2>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <SkeletonCard />
      </section>

      {/* — BottomSheet — */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-white">
          BottomSheet
        </h2>
        <Button variant="outline" onClick={() => setSheet(true)}>
          Open Bottom Sheet
        </Button>
        <BottomSheet open={sheet} onClose={() => setSheet(false)} danger>
          <h3 className="font-display text-lg font-semibold text-white">
            Emergency Alert
          </h3>
          <p className="mt-2 text-sm text-white/70">
            This is a danger bottom sheet for SOS warnings.
          </p>
          <Button
            variant="danger"
            className="mt-4"
            onClick={() => setSheet(false)}
          >
            Close
          </Button>
        </BottomSheet>
      </section>
    </main>
  );
}
