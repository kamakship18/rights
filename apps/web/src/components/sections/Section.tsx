'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className = '',
  align = 'center',
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  align?: 'center' | 'left';
}) {
  return (
    <section id={id} className={`section-pad ${className}`}>
      <div className="mx-auto max-w-7xl">
        {(eyebrow || title || description) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className={`mb-12 ${align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}`}
          >
            {eyebrow && (
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-ink-muted backdrop-blur">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-saffron-500" />
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
                {description}
              </p>
            )}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  );
}
