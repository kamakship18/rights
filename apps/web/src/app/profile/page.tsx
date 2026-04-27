'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useUser, useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { ErrorBoundary } from '@/components/ui';
import { createApiClient } from '@/lib/api';

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const api = useMemo(() => createApiClient(getToken), [getToken]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [primaryPin, setPrimaryPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    const meta = (user.unsafeMetadata ?? {}) as Record<string, unknown>;
    const metaPhone =
      typeof meta.phone === 'string'
        ? (meta.phone as string)
        : user.primaryPhoneNumber?.phoneNumber ?? '';
    setPhone(metaPhone);
  }, [user]);

  // Load DB profile fields (location + pin) separately
  useEffect(() => {
    if (!isSignedIn) return;
    api.getProfile().then((p) => {
      if (p.location) setLocation(p.location);
      if (p.primaryPin) setPrimaryPin(p.primaryPin);
      if (p.phone && !phone) setPhone(p.phone);
    }).catch(() => { /* silent */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  const dirty =
    !!user &&
    (firstName !== (user.firstName ?? '') ||
      lastName !== (user.lastName ?? '') ||
      phone !==
        ((user.unsafeMetadata as Record<string, unknown>)?.phone ??
          user.primaryPhoneNumber?.phoneNumber ??
          ''));

  async function onSave() {
    if (!user) return;
    if (primaryPin && !/^\d{6}$/.test(primaryPin)) {
      setError('PIN code must be exactly 6 digits.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // Save name/phone to Clerk
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        unsafeMetadata: {
          ...(user.unsafeMetadata ?? {}),
          phone: phone.trim(),
        },
      });
      // Save location/pin/phone to our DB
      await api.updateProfile({
        fullName: `${firstName.trim()} ${lastName.trim()}`.trim() || undefined,
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        primaryPin: primaryPin || undefined,
      });
      setSuccess('Profile updated.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (e) {
      setError(
        (e as Error)?.message ||
          'Could not update your profile. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (!isLoaded) {
    return (
      <>
        <Sidebar />
        <main className="flex-1 bg-canvas">
          <div className="mx-auto max-w-2xl px-4 py-10 sm:px-8">
            <div className="skeleton mb-6 h-10 w-1/2" />
            <div className="skeleton h-72" />
          </div>
        </main>
      </>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <>
        <Sidebar />
        <main className="flex-1 bg-canvas">
          <div className="mx-auto max-w-2xl px-4 py-16 sm:px-8">
            <div className="rounded-3xl border border-line bg-card p-10 text-center shadow-card">
              <h1 className="font-display text-2xl font-semibold text-ink">
                Sign in to manage your profile
              </h1>
              <p className="mt-2 text-sm text-ink-muted">
                We never show profile data unless it&apos;s yours.
              </p>
              <Link
                href="/sign-in"
                className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-canvas"
              >
                Sign in
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const email = user.primaryEmailAddress?.emailAddress ?? '';
  const initials = `${(firstName[0] ?? '').toUpperCase()}${(lastName[0] ?? '').toUpperCase()}` || 'JS';

  return (
    <ErrorBoundary>
      <Sidebar />
      <main className="flex-1 bg-canvas">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
          <motion.header
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
              Account
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Profile
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Manage how you appear on Justice OS and how authorities reach you.
            </p>
          </motion.header>

          {/* Identity card */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mb-6 overflow-hidden rounded-3xl border border-line bg-card shadow-card"
          >
            <div className="relative h-28 bg-gradient-to-br from-saffron-200 via-canvas-2 to-leaf-200 dark:from-saffron-500/20 dark:via-canvas-2 dark:to-leaf-500/20">
              <div className="absolute inset-0 grid-overlay opacity-50" />
            </div>
            <div className="-mt-10 px-6 pb-6 sm:px-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-end gap-4">
                  {user.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.imageUrl}
                      alt={firstName || 'User avatar'}
                      className="h-20 w-20 rounded-2xl border-4 border-card object-cover shadow-card"
                    />
                  ) : (
                    <div className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-card bg-ink font-display text-2xl font-semibold text-canvas shadow-card">
                      {initials}
                    </div>
                  )}
                  <div className="pb-1">
                    <p className="font-display text-lg font-semibold text-ink">
                      {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'New citizen'}
                    </p>
                    <p className="text-sm text-ink-muted">{email}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-leaf-50 px-3 py-1 text-[11px] font-medium text-leaf-700 ring-1 ring-leaf-100 dark:bg-leaf-500/10 dark:text-leaf-300 dark:ring-leaf-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-leaf-500" />
                  Verified
                </span>
              </div>
            </div>
          </motion.section>

          {/* Edit form */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl border border-line bg-card p-6 shadow-card sm:p-8"
          >
            <div className="mb-6">
              <h2 className="font-display text-xl font-semibold text-ink">
                Personal information
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Used on grievance filings and emergency SOS broadcasts.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="firstName"
                label="First name"
                value={firstName}
                onChange={setFirstName}
                placeholder="Priya"
              />
              <Field
                id="lastName"
                label="Last name"
                value={lastName}
                onChange={setLastName}
                placeholder="Sharma"
              />
              <Field
                id="phone"
                label="Phone"
                value={phone}
                onChange={setPhone}
                placeholder="+91 98765 43210"
                type="tel"
                hint="Used by SOS broadcasts."
              />
              <Field
                id="email"
                label="Email"
                value={email}
                onChange={() => {}}
                disabled
                hint="Managed via your sign-in provider."
              />
              <div className="sm:col-span-2">
                <Field
                  id="location"
                  label="Home locality / area"
                  value={location}
                  onChange={setLocation}
                  placeholder="e.g. Chandni Chowk, New Delhi"
                  hint="Used to match you with local community issues."
                />
              </div>
              <Field
                id="primaryPin"
                label="PIN code"
                value={primaryPin}
                onChange={(v) => setPrimaryPin(v.replace(/\D/g, '').slice(0, 6))}
                placeholder="110001"
                hint="6-digit area PIN code."
              />
            </div>

            {error && (
              <p className="mt-4 text-sm text-sos-700 dark:text-sos-300" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="mt-4 text-sm text-leaf-600 dark:text-leaf-300" role="status">
                {success}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center rounded-full border border-line bg-canvas px-5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
              >
                Cancel
              </Link>
              <button
                type="button"
                disabled={!dirty || saving}
                onClick={onSave}
                className="inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-canvas shadow-soft-xl transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </motion.section>

          {/* Other actions */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-6 grid gap-4 sm:grid-cols-2"
          >
            <ActionCard
              title="Emergency contacts"
              body="People who get pinged the moment you trigger SOS."
              href="/onboard"
              cta="Manage"
            />
            <ActionCard
              title="Sign-in & security"
              body="Manage password, 2FA, connected accounts."
              href="#"
              cta="Open Clerk"
            />
          </motion.section>
        </div>
      </main>
    </ErrorBoundary>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = 'text',
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-soft"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-line bg-canvas px-4 text-sm text-ink shadow-inner placeholder:text-ink-soft focus:border-ink-muted focus:outline-none focus:ring-2 focus:ring-ink/10 disabled:cursor-not-allowed disabled:opacity-60"
      />
      {hint && <p className="mt-1.5 text-[11px] text-ink-soft">{hint}</p>}
    </div>
  );
}

function ActionCard({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-line bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div>
        <h3 className="font-display text-base font-semibold text-ink">
          {title}
        </h3>
        <p className="mt-1 text-sm text-ink-muted">{body}</p>
      </div>
      <span className="inline-flex h-9 items-center rounded-full border border-line bg-canvas px-4 text-xs font-medium text-ink-muted group-hover:border-line-strong group-hover:text-ink">
        {cta}
        <svg
          className="ml-1 h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </span>
    </Link>
  );
}
