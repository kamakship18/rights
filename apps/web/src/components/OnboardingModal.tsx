'use client';

/**
 * OnboardingModal
 *
 * Shown once after sign-in when `user.profileComplete === false`.
 * Saves data to the DB via PATCH /profile.
 * Can be dismissed (skipped) — profileComplete stays false until filled.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@clerk/nextjs';
import { createApiClient } from '@/lib/api';

interface Props {
  onDone: () => void;
}

export function OnboardingModal({ onDone }: Props) {
  const { getToken } = useAuth();
  const api = createApiClient(getToken);

  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [primaryPin, setPrimaryPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = useCallback(async () => {
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (primaryPin && !/^\d{6}$/.test(primaryPin)) {
      setError('PIN must be 6 digits.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await api.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        primaryPin: primaryPin || undefined,
      });
      onDone();
    } catch {
      setError('Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [fullName, phone, location, primaryPin, api, onDone]);

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      >
        <motion.div
          key="panel"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="w-full max-w-md rounded-3xl border border-line bg-card p-8 shadow-[0_32px_80px_rgba(0,0,0,0.4)]"
        >
          {/* Header */}
          <div className="mb-6">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
              Step {step} of 2
            </p>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
              {step === 1 ? 'Tell us about yourself' : 'Where are you located?'}
            </h2>
            <p className="mt-1.5 text-sm text-ink-muted">
              {step === 1
                ? 'This helps us file notices with your correct identity.'
                : 'Used to find your local issues and the right authority.'}
            </p>
          </div>

          {/* Step 1 — identity */}
          {step === 1 && (
            <div className="space-y-4">
              <Field
                label="Full name *"
                placeholder="Priya Sharma"
                value={fullName}
                onChange={setFullName}
                autoFocus
              />
              <Field
                label="Phone number"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={setPhone}
                inputMode="tel"
              />
            </div>
          )}

          {/* Step 2 — location */}
          {step === 2 && (
            <div className="space-y-4">
              <Field
                label="Home locality / area"
                placeholder="e.g. Chandni Chowk, New Delhi"
                value={location}
                onChange={setLocation}
                autoFocus
              />
              <Field
                label="PIN code"
                placeholder="110001"
                value={primaryPin}
                onChange={(v) => setPrimaryPin(v.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
              />
            </div>
          )}

          {error && (
            <p className="mt-3 text-xs text-sos-600 dark:text-sos-300" role="alert">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onDone}
              className="text-xs text-ink-muted hover:text-ink"
            >
              Skip for now
            </button>
            <div className="flex gap-2">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex h-10 items-center rounded-xl border border-line px-4 text-sm text-ink hover:bg-canvas-2"
                >
                  Back
                </button>
              )}
              {step === 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!fullName.trim()) {
                      setError('Please enter your full name.');
                      return;
                    }
                    setError('');
                    setStep(2);
                  }}
                  className="inline-flex h-10 items-center rounded-xl bg-ink px-5 text-sm font-medium text-canvas hover:opacity-90"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex h-10 items-center rounded-xl bg-brand-600 px-5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save profile'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  inputMode,
  maxLength,
  autoFocus,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-ink">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        maxLength={maxLength}
        autoFocus={autoFocus}
        className="h-11 w-full rounded-xl border border-line bg-canvas px-4 text-sm text-ink placeholder:text-ink-soft focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </div>
  );
}
