import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'Blockchain Grievances · Actionable Justice OS',
  description: 'Immutable, SHA-256 hashed grievance records stored on a tamper-evident blockchain.',
};

export default function BlockchainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
