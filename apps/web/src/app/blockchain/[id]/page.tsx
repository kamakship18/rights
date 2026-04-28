'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getChainGrievance } from '@/features/grievance-chain/api';
import { GrievanceChainDetails } from '@/features/grievance-chain/components/GrievanceChainDetails';
import type { GrievanceChainRecord } from '@/features/grievance-chain/types';

export default function BlockchainGrievanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [record,  setRecord]  = useState<GrievanceChainRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await getChainGrievance(decodeURIComponent(id));
        if (!cancelled) setRecord(res.data);
      } catch (err) {
        if (!cancelled) setError((err as Error).message || 'Failed to load record.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

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

      {/* Loading */}
      {loading && (
        <div className="space-y-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-3xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl border border-sos-200 bg-sos-50/80 px-6 py-8 text-center dark:border-sos-500/20 dark:bg-sos-500/10"
        >
          <p className="font-display text-lg font-semibold text-sos-700 dark:text-sos-200">
            Record not found
          </p>
          <p className="mt-2 text-sm text-sos-600/80 dark:text-sos-200/70">{error}</p>
          <Link
            href="/blockchain"
            className="mt-5 inline-flex h-10 items-center rounded-full border border-line bg-canvas px-5 text-sm text-ink"
          >
            Back to list
          </Link>
        </motion.div>
      )}

      {/* Record */}
      {!loading && record && <GrievanceChainDetails record={record} />}
    </div>
  );
}
