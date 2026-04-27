'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Button,
  Card,
  Input,
  ErrorBoundary,
  SkeletonCard,
} from '@/components/ui';
import { createApiClient, type EmergencyContact } from '@/lib/api';
import { strings } from '@/lib/strings';

const s = strings.onboard;

export default function OnboardPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const api = createApiClient(getToken);

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  // Wipe contacts immediately when signed-in user changes
  const loadedForRef = useRef<string | null>(null);
  useEffect(() => {
    const currentId = user?.id ?? null;
    if (loadedForRef.current !== null && loadedForRef.current !== currentId) {
      setContacts([]);
    }
    loadedForRef.current = currentId;
  }, [user?.id]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* Form state */
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');

  /* Fetch contacts */
  const fetchContacts = useCallback(async () => {
    try {
      const data = await api.listContacts();
      setContacts(data);
    } catch {
      setError('Could not load contacts.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  /* Add contact */
  const handleAdd = useCallback(async () => {
    if (!name.trim() || !phone.trim()) {
      setError('Name and phone are required.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const newContact = await api.addContact({
        name: name.trim(),
        phone: phone.trim(),
        relation: relation.trim() || undefined,
      });
      setContacts((prev) => [...prev, newContact]);
      setName('');
      setPhone('');
      setRelation('');
      setSuccess('Contact added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Could not save contact. Check the phone format.');
    } finally {
      setSaving(false);
    }
  }, [name, phone, relation, api]);

  /* Delete contact */
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm(s.deleteConfirm)) return;

      try {
        await api.deleteContact(id);
        setContacts((prev) => prev.filter((c) => c.id !== id));
      } catch {
        setError('Could not remove contact.');
      }
    },
    [api],
  );

  return (
    <ErrorBoundary>
      <main className="relative min-h-dvh bg-canvas px-4 py-10">
        <div className="pointer-events-none absolute inset-0 grid-overlay opacity-40" />

        <div className="relative z-10 mx-auto max-w-lg">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-ink-soft">
              Settings
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {s.title}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">{s.subtitle}</p>
          </motion.div>

          {/* Warning if no contacts */}
          {!loading && contacts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 flex items-center gap-2 rounded-xl border border-saffron-200 bg-saffron-50 px-4 py-3 dark:border-saffron-500/20 dark:bg-saffron-500/10"
            >
              <span aria-hidden="true">⚠️</span>
              <p className="text-xs text-saffron-700 dark:text-saffron-200">{s.minContactWarning}</p>
            </motion.div>
          )}

          {/* Existing contacts */}
          {loading ? (
            <div className="space-y-3 mb-8">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : contacts.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 mb-8"
            >
              <AnimatePresence>
                {contacts.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    layout
                  >
                    <Card className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {c.name}
                        </p>
                        <p className="text-xs text-ink-muted">{c.phone}</p>
                        {c.relation && (
                          <p className="mt-0.5 text-[10px] text-ink-soft">
                            {c.relation}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-sos-50 hover:text-sos-600 dark:hover:bg-sos-500/10 dark:hover:text-sos-300"
                        aria-label={`${strings.common.delete} ${c.name}`}
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : null}

          {/* Add form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <h2 className="mb-4 font-display text-lg font-semibold text-ink">
                {s.addContact}
              </h2>

              <div className="space-y-4">
                <Input
                  id="contact-name"
                  label={s.nameLabel}
                  placeholder={s.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  id="contact-phone"
                  label={s.phoneLabel}
                  placeholder={s.phonePlaceholder}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                />
                <Input
                  id="contact-relation"
                  label={s.relationLabel}
                  placeholder={s.relationPlaceholder}
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                />
              </div>

              {error && (
                <p className="mt-3 text-xs text-sos-600 dark:text-sos-300" role="alert">
                  {error}
                </p>
              )}

              {success && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 text-xs text-leaf-600 dark:text-leaf-300"
                  role="status"
                >
                  {success}
                </motion.p>
              )}

              <Button
                variant="gold"
                block
                className="mt-5"
                loading={saving}
                onClick={handleAdd}
                disabled={!name.trim() || !phone.trim()}
              >
                {saving ? s.savingBtn : s.saveBtn}
              </Button>
            </Card>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 flex gap-3"
          >
            <Link href="/sos" className="flex-1">
              <Button variant="danger" block>
                {strings.sos.title}
              </Button>
            </Link>
            <Link href="/dashboard" className="flex-1">
              <Button variant="outline" block>
                {strings.dashboard.title}
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>
    </ErrorBoundary>
  );
}
