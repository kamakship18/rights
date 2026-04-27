import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* ── Semantic tokens (light + dark via CSS vars) ─────── */
        canvas:      'rgb(var(--c-canvas)      / <alpha-value>)',
        'canvas-2':  'rgb(var(--c-canvas-2)    / <alpha-value>)',
        card:        'rgb(var(--c-card)        / <alpha-value>)',
        elev:        'rgb(var(--c-elev)        / <alpha-value>)',
        ink:         'rgb(var(--c-ink)         / <alpha-value>)',
        'ink-muted': 'rgb(var(--c-ink-muted)   / <alpha-value>)',
        'ink-soft':  'rgb(var(--c-ink-soft)    / <alpha-value>)',
        line:        'rgb(var(--c-line)        / <alpha-value>)',
        'line-strong': 'rgb(var(--c-line-strong) / <alpha-value>)',

        /* ── Indian flag accents ────────────────────────────── */
        saffron: {
          50:  '#fff5eb',
          100: '#ffe4c2',
          200: '#fdcb8c',
          300: '#fbb15c',
          400: '#f99935',
          500: '#f57c00',
          600: '#dd6900',
          700: '#b25400',
        },
        leaf: {
          50:  '#effaf2',
          100: '#d3f1da',
          200: '#a9e2b8',
          300: '#79cf91',
          400: '#4fb96d',
          500: '#2f9e44',
          600: '#247a35',
          700: '#1c5d29',
        },
        lotus: {
          50:  '#fff1f5',
          100: '#ffd6e2',
          200: '#fbb1c8',
          300: '#f586a8',
          400: '#ec5a87',
          500: '#d6336c',
          600: '#b1234f',
        },
        sky: {
          50:  '#eef6ff',
          100: '#d6e8ff',
          200: '#a9ccff',
          300: '#7aabff',
          400: '#5489f9',
          500: '#3b6def',
          600: '#2f56c4',
        },

        /* ── Deep navy base (kept for dark variants) ────────── */
        navy: {
          50:  '#eef1f8',
          100: '#d8dff0',
          200: '#b5c2e2',
          300: '#8da0d0',
          400: '#6a7fbf',
          500: '#4e63a8',
          600: '#3d4f8a',
          700: '#2d3a6a',
          800: '#1c2547',
          850: '#151d38',
          900: '#0f172a',
          950: '#0a0f1c',
        },
        /* ── Warm amber/gold accent ─────────────────────────── */
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        /* ── Brand blue ─────────────────────────────────────── */
        brand: {
          50:  '#f0f4ff',
          100: '#dbe4ff',
          200: '#bac8ff',
          300: '#91a7ff',
          400: '#748ffc',
          500: '#5c7cfa',
          600: '#4c6ef5',
          700: '#4263eb',
          800: '#3b5bdb',
          900: '#364fc7',
        },
        /* ── Justice semantic colors ───────────────────────── */
        justice: {
          gold:     '#f59f00',
          crimson:  '#e03131',
          emerald:  '#2f9e44',
          midnight: '#0f172a',
          slate:    '#1e293b',
        },
        /* ── SOS emergency red ramp ────────────────────────── */
        sos: {
          50:  '#fff1f2',
          100: '#fee2e2',
          200: '#fca5a5',
          300: '#f87171',
          400: '#ef4444',
          500: '#dc2626',
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#450a0a',
        },
        /* ── Surface (legacy glass tokens, kept for compat) ──── */
        surface: {
          card:  'rgba(30, 41, 59, 0.5)',
          hover: 'rgba(30, 41, 59, 0.7)',
          glass: 'rgba(15, 23, 42, 0.6)',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', '"Playfair Display"', 'Georgia', 'serif'],
        ui:      ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-brand': '0 0 20px rgba(92,124,250,0.3), 0 0 60px rgba(92,124,250,0.1)',
        'glow-gold':  '0 0 20px rgba(245,159,0,0.3), 0 0 60px rgba(245,159,0,0.1)',
        'glow-sos':   '0 0 30px rgba(239,68,68,0.4), 0 0 80px rgba(239,68,68,0.15)',
        'glow-saffron': '0 10px 40px -10px rgba(245,124,0,0.35), 0 0 60px rgba(245,124,0,0.1)',
        'glass':      '0 8px 32px rgba(0,0,0,0.3)',
        'card':       '0 1px 2px rgba(15,23,42,0.04), 0 12px 40px -16px rgba(15,23,42,0.12)',
        'card-hover': '0 4px 8px rgba(15,23,42,0.06), 0 20px 60px -20px rgba(15,23,42,0.18)',
        'soft-xl':    '0 30px 80px -30px rgba(15,23,42,0.25)',
      },
      backgroundImage: {
        'gradient-navy':    'linear-gradient(135deg, #0a0f1c 0%, #0f172a 50%, #1c2547 100%)',
        'gradient-hero':    'linear-gradient(135deg, #5c7cfa, #748ffc, #f59f00)',
        'gradient-sos':     'linear-gradient(135deg, #b91c1c 0%, #dc2626 40%, #991b1b 100%)',
        'gradient-card':    'linear-gradient(135deg, rgba(30,41,59,0.5), rgba(15,23,42,0.3))',
        'gradient-timeline': 'linear-gradient(180deg, #4c6ef5 0%, #f59f00 100%)',
        'gradient-india':
          'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(168, 200, 255, 0.55) 0%, rgba(255,255,255,0) 60%), radial-gradient(ellipse 70% 60% at 90% 30%, rgba(167, 226, 184, 0.55) 0%, rgba(255,255,255,0) 60%), radial-gradient(ellipse 70% 60% at 10% 80%, rgba(251, 177, 200, 0.55) 0%, rgba(255,255,255,0) 60%), linear-gradient(180deg, #fbf7f2 0%, #f7f5f9 100%)',
        'gradient-india-dark':
          'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(73, 100, 176, 0.35) 0%, rgba(15,23,42,0) 60%), radial-gradient(ellipse 70% 60% at 90% 30%, rgba(35, 110, 70, 0.35) 0%, rgba(15,23,42,0) 60%), radial-gradient(ellipse 70% 60% at 10% 80%, rgba(165, 60, 105, 0.35) 0%, rgba(15,23,42,0) 60%), linear-gradient(180deg, #0a0f1c 0%, #0f172a 100%)',
      },
      keyframes: {
        'pulse-ring': {
          '0%':   { transform: 'scale(0.9)', opacity: '1' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        'pulse-dot': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':      { transform: 'scale(1.1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'progress-ring': {
          '0%':   { strokeDashoffset: '283' },
          '100%': { strokeDashoffset: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%':      { transform: 'translateY(-20px) rotate(2deg)' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'pulse-ring':   'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-dot':    'pulse-dot 2s ease-in-out infinite',
        shimmer:        'shimmer 2s linear infinite',
        'fade-in-up':   'fade-in-up 0.5s ease-out forwards',
        'slide-up':     'slide-up 0.3s ease-out',
        'progress-ring': 'progress-ring 1s linear forwards',
        float:          'float 6s ease-in-out infinite',
        'float-slow':   'float-slow 9s ease-in-out infinite',
        'spin-slow':    'spin-slow 40s linear infinite',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
