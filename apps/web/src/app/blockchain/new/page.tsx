'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { GrievanceChainForm } from '@/features/grievance-chain/components/GrievanceChainForm';

export default function NewBlockchainGrievancePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">

      {/* Back nav */}
      <Link
        href="/blockchain"
        className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-ink-muted hover:text-ink"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        All blockchain records
      </Link>

      {/* Page header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1">
          ⛓ Blockchain
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          File a blockchain grievance
        </h1>
        <p className="mt-2 text-sm text-ink-muted max-w-xl">
          Your grievance is stored as an immutable block — hashed with SHA-256.
          Files are hashed and referenced in the block. Court-ready export available after filing.
        </p>

        {/* Storage flow diagram */}
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          <span className="rounded-full border border-line bg-canvas-2 px-2.5 py-1">Your data</span>
          <span aria-hidden="true">→</span>
          <span className="rounded-full border border-line bg-canvas-2 px-2.5 py-1">SHA-256 hash</span>
          <span aria-hidden="true">→</span>
          <span className="rounded-full border border-leaf-200 bg-leaf-50 px-2.5 py-1 text-leaf-700 ring-1 ring-leaf-100 dark:bg-leaf-500/10 dark:text-leaf-300">
            ⛓ Blockchain (primary)
          </span>
          <span aria-hidden="true">→</span>
          <span className="rounded-full border border-saffron-200 bg-saffron-50 px-2.5 py-1 text-saffron-700 ring-1 ring-saffron-100 dark:bg-saffron-500/10 dark:text-saffron-300">
            🗄 MongoDB (reference)
          </span>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-3xl border border-line bg-card p-6 shadow-card sm:p-8"
      >
        <GrievanceChainForm />
      </motion.div>
    </div>
  );
}
