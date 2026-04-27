'use client';

import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Types ────────────────────────────────────────────────── */

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Danger variant (red top border) */
  danger?: boolean;
}

/* ── Component ────────────────────────────────────────────── */

export function BottomSheet({
  open,
  onClose,
  children,
  danger = false,
}: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t ${
              danger
                ? 'border-sos-500/40 bg-sos-900/95'
                : 'border-white/10 bg-navy-800/95'
            } p-6 pb-8 backdrop-blur-xl`}
            role="dialog"
            aria-modal="true"
          >
            {/* Handle */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
