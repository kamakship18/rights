'use client';

import { motion } from 'framer-motion';
import { Kite } from './Kite';
import { Chakra } from './Chakra';

/**
 * Cinematic side decorations for the hero.
 *
 * Mounted at the HeroSection root so the parent's overflow-hidden crops them
 * into the viewport edges — they read as oversized poster elements rather
 * than UI icons.
 *
 * Composition:
 *   ← KITE (left, smaller than lotus, partially cropped, tilted -10deg)
 *   …   CENTRE (emblem + lotus, in HeroVisual)
 *   → CHAKRA (right, smaller than lotus, partially cropped, near-straight)
 *
 *  z-[1] keeps them BEHIND the centerpiece (z-5+) but in front of the
 *  background gradient.
 */
export function HeroDecor() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-visible"
      aria-hidden
    >
      {/* ── KITE — far left, ~30% off-screen ── */}
      <motion.div
        initial={{ opacity: 0, x: -90, y: 18, rotate: -16 }}
        animate={{ opacity: 0.9, x: 0, y: 0, rotate: -10 }}
        transition={{ duration: 1.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="
          absolute
          -left-[5vw] top-[14%]
          w-[22vw] max-w-[14rem] min-w-[7.25rem]
          sm:-left-[4.25vw] sm:top-[16%] sm:w-[20vw] sm:max-w-[16rem]
          md:-left-[3vw] md:top-[14%] md:w-[18vw] md:max-w-[17rem]
          lg:-left-[2vw] lg:w-[17vw] lg:max-w-[18.5rem]
        "
      >
        <motion.div
          animate={{ y: [0, -16, 0], rotate: [-10, -7, -10] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Kite className="h-auto w-full opacity-90 drop-shadow-[0_20px_50px_rgba(0,0,0,0.18)]" />
        </motion.div>
      </motion.div>

      {/* ── CHAKRA — far right, ~30% off-screen ── */}
      <motion.div
        initial={{ opacity: 0, x: 90, y: 12, rotate: 8 }}
        animate={{ opacity: 0.92, x: 0, y: 0, rotate: 2 }}
        transition={{ duration: 1.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="
          absolute
          -right-[6vw] top-[8%]
          w-[23vw] max-w-[16rem] min-w-[7.5rem]
          sm:-right-[5.25vw] sm:top-[10%] sm:w-[21vw] sm:max-w-[17rem]
          md:-right-[4.5vw] md:top-[8%] md:w-[20vw] md:max-w-[19rem]
          lg:-right-[2.75vw] lg:w-[18.5vw] lg:max-w-[20rem]
        "
      >
        <motion.div
          animate={{ y: [0, -22, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Chakra className="h-auto w-full opacity-90 drop-shadow-[0_28px_60px_rgba(0,0,0,0.18)] animate-spin-slow" />
        </motion.div>
      </motion.div>
    </div>
  );
}
