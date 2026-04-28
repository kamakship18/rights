'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createChainGrievance } from '../api';
import type { CreateGrievanceResult } from '../types';

/* ── Rights / Regulations options ────────────────────────── */
const RIGHTS_OPTIONS = [
  'Article 21 — Right to Life',
  'Article 19 — Freedom of Speech',
  'Right to Information Act, 2005',
  'Consumer Protection Act, 2019',
  'Noise Pollution Rules, 2000',
  'Electricity Rights Rules, 2020',
  'Protection of Women from DV Act, 2005',
  'IPC / BNS — Assault / Harassment',
  'IT Act, 2000 — Cybercrime',
  'Environment Protection Act, 1986',
];

const TAG_SUGGESTIONS = [
  'noise', 'harassment', 'municipal', 'electricity', 'water',
  'roads', 'sanitation', 'corruption', 'stalking', 'cybercrime',
  'consumer', 'domestic violence', 'environment',
];

const ACCEPTED_TYPES = '.jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx';
const MAX_FILE_MB = 10;

/* ── Helpers ─────────────────────────────────────────────── */

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

/* ── Component ───────────────────────────────────────────── */

export function GrievanceChainForm() {
  const router = useRouter();

  /* Form state */
  const [fullName,          setFullName]          = useState('');
  const [pin,               setPin]               = useState('');
  const [location,          setLocation]          = useState('');
  const [title,             setTitle]             = useState('');
  const [description,       setDescription]       = useState('');
  const [tags,              setTags]              = useState<string[]>([]);
  const [tagInput,          setTagInput]          = useState('');
  const [rights,            setRights]            = useState<string[]>([]);
  const [files,             setFiles]             = useState<File[]>([]);
  const [isDragging,        setIsDragging]        = useState(false);
  const [isAnonymous,       setIsAnonymous]       = useState(false);

  /* Submission state */
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const [result,      setResult]      = useState<CreateGrievanceResult | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  /* ── File handling ─────────────────────────────────────── */

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter(f => {
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        setError(`"${f.name}" exceeds ${MAX_FILE_MB} MB limit.`);
        return false;
      }
      return true;
    });
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !names.has(f.name))];
    });
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeFile = (name: string) =>
    setFiles(prev => prev.filter(f => f.name !== name));

  /* ── Tag handling ──────────────────────────────────────── */

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const onTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  /* ── Rights toggle ─────────────────────────────────────── */

  const toggleRight = (r: string) =>
    setRights(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  /* ── Submit ────────────────────────────────────────────── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!pin.match(/^\d{6}$/)) { setError('Enter a valid 6-digit PIN code.'); return; }
    if (title.trim().length < 5) { setError('Title must be at least 5 characters.'); return; }
    if (description.trim().length < 20) { setError('Description must be at least 20 characters.'); return; }

    setSubmitting(true);
    try {
      const res = await createChainGrievance({
        fullName:          isAnonymous ? '' : fullName.trim() || '',
        pin:               pin.trim(),
        location:          location.trim(),
        title:             title.trim(),
        description:       description.trim(),
        tags,
        rightsRegulations: rights,
        files,
      });
      setResult(res);
    } catch (err) {
      setError((err as Error).message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success screen ────────────────────────────────────── */

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-line bg-card p-8 shadow-card text-center"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-leaf-50 text-leaf-600 ring-1 ring-leaf-100 dark:bg-leaf-500/10 dark:text-leaf-300">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-semibold text-ink">Grievance Filed</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Your record has been immutably stored.
        </p>

        <div className="mt-6 rounded-2xl border border-line bg-canvas-2 p-5 text-left space-y-3">
          <Row label="Grievance ID"   value={result.grievanceId} mono />
          <Row label="Storage"        value={result.storageType === 'blockchain' ? '⛓ Blockchain (primary)' : '🗄 MongoDB (fallback)'} />
          <Row label="Block index"    value={result.blockIndex !== null ? `#${result.blockIndex}` : 'N/A'} />
          <Row label="Block hash"     value={result.blockchainHash ? result.blockchainHash.slice(0, 24) + '…' : 'N/A'} mono />
          <Row label="Files uploaded" value={String(result.filesProcessed)} />
          <Row label="Timestamp"      value={new Date(result.timestamp).toLocaleString('en-IN')} />
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={() => router.push(`/blockchain/${result.grievanceId}`)}
            className="inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-canvas hover:opacity-90"
          >
            View full record
          </button>
          <button
            onClick={() => { setResult(null); setTitle(''); setDescription(''); setFiles([]); setTags([]); setRights([]); }}
            className="inline-flex h-11 items-center rounded-full border border-line bg-canvas px-6 text-sm font-medium text-ink-muted hover:text-ink"
          >
            File another
          </button>
        </div>
      </motion.div>
    );
  }

  /* ── Form ──────────────────────────────────────────────── */

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Anonymous toggle */}
      <div className="flex items-start gap-3 rounded-2xl border border-line bg-canvas-2 p-4">
        <button
          type="button"
          role="switch"
          aria-checked={isAnonymous}
          onClick={() => setIsAnonymous(v => !v)}
          className={`relative mt-0.5 inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${isAnonymous ? 'bg-brand-600' : 'bg-line'}`}
        >
          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${isAnonymous ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
        <div>
          <p className="text-sm font-medium text-ink">File anonymously</p>
          <p className="mt-0.5 text-xs text-ink-muted">Your name will not appear in the blockchain record.</p>
        </div>
      </div>

      {/* Personal info */}
      <AnimatePresence>
        {!isAnonymous && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Field
              id="fullName" label="Full name" optional
              value={fullName} onChange={setFullName}
              placeholder="Priya Sharma"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-4">
        <Field
          id="pin" label="PIN code" required
          value={pin} onChange={v => setPin(v.replace(/\D/g, '').slice(0, 6))}
          placeholder="110001" inputMode="numeric"
        />
        <Field
          id="location" label="Location / area" optional
          value={location} onChange={setLocation}
          placeholder="Chandni Chowk, Delhi"
        />
      </div>

      <Field
        id="title" label="Grievance title" required
        value={title} onChange={setTitle}
        placeholder="Illegal loudspeaker used at night near my house"
      />

      {/* Description */}
      <div>
        <label htmlFor="description" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-soft">
          Description <span className="text-sos-500">*</span>
        </label>
        <textarea
          id="description"
          required
          minLength={20}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe your grievance in detail — what happened, when, and how it affects you…"
          rows={5}
          className="w-full resize-none rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-soft focus:border-ink-muted focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
        <p className="mt-1 text-right text-[10px] text-ink-soft">{description.length} chars</p>
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-soft">
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map(t => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700 ring-1 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-300">
              {t}
              <button type="button" onClick={() => setTags(prev => prev.filter(x => x !== t))} className="ml-0.5 opacity-60 hover:opacity-100" aria-label={`Remove tag ${t}`}>×</button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={onTagKeyDown}
          placeholder="Type a tag and press Enter…"
          className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:border-ink-muted focus:outline-none focus:ring-2 focus:ring-ink/10"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TAG_SUGGESTIONS.filter(s => !tags.includes(s)).map(s => (
            <button
              key={s} type="button"
              onClick={() => addTag(s)}
              className="rounded-full border border-line bg-canvas-2 px-2.5 py-0.5 text-[11px] text-ink-muted hover:border-line-strong hover:text-ink"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Rights / Regulations */}
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-soft">
          Applicable rights / regulations
        </label>
        <div className="space-y-2">
          {RIGHTS_OPTIONS.map(r => (
            <label key={r} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-canvas-2 p-3 hover:border-line-strong">
              <input
                type="checkbox"
                checked={rights.includes(r)}
                onChange={() => toggleRight(r)}
                className="h-4 w-4 rounded border-line accent-ink"
              />
              <span className="text-sm text-ink">{r}</span>
            </label>
          ))}
        </div>
      </div>

      {/* File upload */}
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-soft">
          Evidence files
        </label>
        <div
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${isDragging ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/10' : 'border-line hover:border-line-strong'}`}
        >
          <svg className="mx-auto mb-3 h-8 w-8 text-ink-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="text-sm font-medium text-ink">Drop files here or click to browse</p>
          <p className="mt-1 text-xs text-ink-muted">Images, PDFs, Word documents · max {MAX_FILE_MB} MB each</p>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={e => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <ul className="mt-3 space-y-2">
            {files.map(f => (
              <li key={f.name} className="flex items-center justify-between rounded-xl border border-line bg-canvas-2 px-4 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg" aria-hidden="true">{f.type.startsWith('image/') ? '🖼' : f.type === 'application/pdf' ? '📄' : '📝'}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{f.name}</p>
                    <p className="text-[10px] text-ink-muted">{humanSize(f.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(f.name)}
                  aria-label={`Remove ${f.name}`}
                  className="ml-4 flex-shrink-0 text-ink-soft hover:text-sos-600"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Error */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-sos-200 bg-sos-50/80 px-4 py-3 text-sm text-sos-700 dark:border-sos-500/20 dark:bg-sos-500/10 dark:text-sos-200"
          role="alert"
        >
          {error}
        </motion.p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-canvas shadow-soft-xl transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
            Hashing & storing on chain…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            File on blockchain
          </>
        )}
      </button>

      <p className="text-center text-[11px] text-ink-muted">
        Each submission is hashed with SHA-256 and stored immutably. Records cannot be deleted or edited.
      </p>
    </form>
  );
}

/* ── Field helper ────────────────────────────────────────── */

function Field({
  id, label, value, onChange, placeholder,
  required: req, optional, inputMode,
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  required?: boolean; optional?: boolean;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-soft">
        {label}
        {req && <span className="ml-1 text-sos-500">*</span>}
        {optional && <span className="ml-1 text-ink-soft">(optional)</span>}
      </label>
      <input
        id={id} type="text" value={value} inputMode={inputMode}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={req}
        className="h-11 w-full rounded-xl border border-line bg-canvas px-4 text-sm text-ink placeholder:text-ink-soft focus:border-ink-muted focus:outline-none focus:ring-2 focus:ring-ink/10"
      />
    </div>
  );
}

/* ── Row helper for success screen ──────────────────────── */

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-ink-muted shrink-0">{label}</span>
      <span className={`text-right text-xs font-medium text-ink break-all ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
