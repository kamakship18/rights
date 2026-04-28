'use client';

import { motion } from 'framer-motion';
import { ChainStatusBadge } from './ChainStatusBadge';
import { getDownloadUrl } from '../api';
import type { GrievanceChainRecord } from '../types';

interface Props {
  record: GrievanceChainRecord;
}

export function GrievanceChainDetails({ record }: Props) {
  const { metadata, files, blockchainBlock, chainValid } = record;

  return (
    <div className="space-y-6">

      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-line bg-card p-6 shadow-card"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <ChainStatusBadge storageType={record.storageType} chainValid={chainValid} />
          <time className="text-xs text-ink-muted">
            {new Date(record.timestamp).toLocaleString('en-IN', {
              dateStyle: 'long', timeStyle: 'short',
            })}
          </time>
        </div>

        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {metadata.title}
        </h1>
        <p className="mt-2 text-xs font-mono text-ink-soft">{record.grievanceId}</p>

        {/* Tags */}
        {metadata.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {metadata.tags.map(t => (
              <span key={t} className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700 ring-1 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-300">
                {t}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Description */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-3xl border border-line bg-card p-6 shadow-card"
      >
        <SectionTitle>Description</SectionTitle>
        <p className="mt-3 text-sm leading-relaxed text-ink">{metadata.description}</p>
      </motion.section>

      {/* Metadata grid */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl border border-line bg-card p-6 shadow-card"
      >
        <SectionTitle>Filing details</SectionTitle>
        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoRow label="Filer name"   value={record.isAnonymous ? 'Anonymous' : (metadata.fullName || '—')} />
          <InfoRow label="PIN code"     value={metadata.pin} />
          <InfoRow label="Location"     value={metadata.location || '—'} />
          <InfoRow label="Storage type" value={record.storageType === 'blockchain' ? 'Blockchain (primary)' : 'MongoDB (fallback)'} />
          {metadata.rightsRegulations.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="text-[10px] uppercase tracking-wider text-ink-soft mb-1">Rights / Regulations</dt>
              <dd className="flex flex-wrap gap-1.5">
                {metadata.rightsRegulations.map(r => (
                  <span key={r} className="rounded-lg bg-canvas-2 px-2 py-0.5 text-[11px] text-ink-muted ring-1 ring-line">{r}</span>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </motion.section>

      {/* Blockchain proof */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-3xl border border-line bg-card p-6 shadow-card"
      >
        <SectionTitle>Blockchain proof</SectionTitle>
        <dl className="mt-4 space-y-3">
          <HashRow label="Block hash (SHA-256)"  value={record.blockchainHash} />
          <HashRow label="Block index"           value={record.blockIndex !== null ? String(record.blockIndex) : null} />
          {blockchainBlock && (
            <>
              <HashRow label="Previous block hash" value={blockchainBlock.previousHash} />
              <HashRow label="Block timestamp"     value={blockchainBlock.timestamp} />
            </>
          )}
          {chainValid !== null && (
            <div className="flex items-center gap-2 rounded-xl bg-canvas-2 px-4 py-3">
              <span className={chainValid ? 'text-leaf-600' : 'text-sos-600'}>
                {chainValid ? '✓' : '✗'}
              </span>
              <span className="text-sm text-ink">
                Chain integrity: <strong>{chainValid ? 'Valid' : 'TAMPERED — chain broken'}</strong>
              </span>
            </div>
          )}
        </dl>
      </motion.section>

      {/* Evidence files */}
      {files.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-line bg-card p-6 shadow-card"
        >
          <SectionTitle>Evidence files</SectionTitle>
          <ul className="mt-4 space-y-3">
            {files.map(f => (
              <li key={f.hash} className="rounded-2xl border border-line bg-canvas-2 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm text-ink">{f.name}</p>
                    <p className="mt-1 font-mono text-[10px] text-ink-soft break-all">
                      SHA-256: {f.hash}
                    </p>
                    {f.size && (
                      <p className="mt-0.5 text-[10px] text-ink-soft">
                        {(f.size / 1024).toFixed(1)} KB · {f.mimetype}
                      </p>
                    )}
                  </div>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 shrink-0 items-center rounded-xl border border-line bg-canvas px-3 text-xs text-ink-muted hover:text-ink"
                  >
                    View ↗
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      {/* Court-ready export */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-3xl border border-saffron-200/70 bg-saffron-50/60 p-6 dark:border-saffron-500/20 dark:bg-saffron-500/10"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display text-base font-semibold text-saffron-800 dark:text-saffron-100">
              Court-ready record
            </p>
            <p className="mt-1 text-sm text-saffron-700/80 dark:text-saffron-200/80">
              Download the full grievance JSON — includes all hashes, timestamps, and file evidence for legal submission.
            </p>
          </div>
          <a
            href={getDownloadUrl(record.grievanceId)}
            download
            className="inline-flex h-11 items-center gap-2 rounded-full border border-saffron-300 bg-white px-5 text-sm font-medium text-saffron-800 shadow-sm hover:bg-saffron-50 dark:border-saffron-500/30 dark:bg-saffron-500/15 dark:text-saffron-100"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download full record
          </a>
        </div>
      </motion.section>

    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-base font-semibold text-ink">{children}</h2>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-ink-soft">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value}</dd>
    </div>
  );
}

function HashRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-ink-soft mb-1">{label}</dt>
      <dd className="rounded-lg bg-canvas-2 px-3 py-2 font-mono text-[11px] text-ink break-all ring-1 ring-line">
        {value}
      </dd>
    </div>
  );
}
