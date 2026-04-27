'use client';

import { motion } from 'framer-motion';
import { TransparentImg } from './TransparentImg';

/**
 * Centerpiece sculpture only (lotus + emblem).
 * Side decorations (kite + chakra) are mounted at the HeroSection level so
 * they can be cropped by the viewport edge for a cinematic editorial feel.
 *
 *  Z order (within centerpiece):
 *    z-5   atmosphere glow
 *    z-10  lotus  (background base, slightly soft)
 *    z-20  emblem (front centrepiece, sharp, full depth shadows)
 */
export function HeroVisual({ className = '' }: { className?: string }) {
  return (
    <div className={`relative mx-auto w-full max-w-5xl ${className}`}>
      <div className="group/sculpt relative mx-auto flex min-h-[20rem] w-full items-center justify-center sm:min-h-[26rem] md:min-h-[30rem]">

        {/* Atmosphere glow — large soft sphere, low opacity */}
        <div
          className="pointer-events-none absolute inset-x-[10%] inset-y-[5%] z-[5]"
          aria-hidden
        >
          <div className="h-full w-full rounded-full bg-[radial-gradient(closest-side,rgba(251,148,36,0.18)_0%,rgba(244,114,182,0.12)_38%,transparent_65%)] blur-3xl" />
        </div>

        {/* Entrance animation */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex w-full max-w-[28rem] items-center justify-center sm:max-w-[34rem] md:max-w-[40rem]"
        >
          {/* Continuous float — whole sculpture */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative flex w-full items-center justify-center transition-transform duration-700 ease-out group-hover/sculpt:scale-[1.03]"
          >
            {/* ── Layer 1 · Lotus (background base) ── */}
            <div
              className="absolute left-1/2 top-1/2 z-10 w-[118%] -translate-x-1/2 -translate-y-[50%] sm:w-[114%] md:w-[112%]"
              aria-hidden
            >
              <TransparentImg
                src="/hero/lotus.png"
                alt=""
                threshold={50}
                className="h-auto w-full object-contain [filter:blur(1px)_drop-shadow(0_20px_45px_rgba(244,114,182,0.28))] sm:[filter:blur(0.6px)_drop-shadow(0_24px_52px_rgba(244,114,182,0.24))] md:[filter:blur(0.4px)_drop-shadow(0_28px_60px_rgba(244,114,182,0.22))]"
              />
            </div>

            {/* ── Layer 2 · Emblem (front centrepiece) ── */}
            <div className="relative z-20 w-[65%] sm:w-[62%] md:w-[60%]">
              <TransparentImg
                src="/hero/emblem.png"
                alt="State Emblem of India — 3D Ashoka Lions"
                threshold={42}
                className="h-auto w-full object-contain [filter:drop-shadow(0_28px_64px_rgba(0,0,0,0.24))_drop-shadow(0_8px_18px_rgba(0,0,0,0.16))]"
              />
            </div>
          </motion.div>

          {/* Ground ellipse — anchors the whole piece */}
          <div
            className="pointer-events-none absolute inset-x-[22%] bottom-[2%] z-[25] h-[10px] rounded-full bg-ink/[0.09] blur-xl dark:bg-black/25 sm:inset-x-[28%]"
            aria-hidden
          />
        </motion.div>
      </div>
    </div>
  );
}
