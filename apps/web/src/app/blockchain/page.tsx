'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { GrievanceChainList } from '@/features/grievance-chain/components/GrievanceChainList';

export default function BlockchainListPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

      {/* Page header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1">
            ⛓ Blockchain
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Grievance records
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Immutable SHA-256 hashed records — once filed, they cannot be altered.
          </p>
        </div>

        <Link
          href="/blockchain/new"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-canvas shadow-soft-xl transition-opacity hover:opacity-90"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          File on blockchain
        </Link>
      </motion.header>

      <GrievanceChainList />
    </div>
  );
}
