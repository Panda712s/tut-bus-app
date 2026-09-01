import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'InterVariable',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        // Semantic tokens (values live as CSS vars in globals.css)
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
          inset: 'rgb(var(--surface-inset) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--line) / <alpha-value>)',
          soft: 'rgb(var(--line-soft) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted) / <alpha-value>)',
          dim: 'rgb(var(--ink-dim) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          strong: 'rgb(var(--accent-strong) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
          ink: 'rgb(var(--accent-ink) / <alpha-value>)',
        },
        gold: 'rgb(var(--gold) / <alpha-value>)',
        // Kept so any lingering `brand-*` utilities still resolve to the accent ramp.
        brand: {
          50: 'rgb(var(--accent-soft) / <alpha-value>)',
          100: 'rgb(var(--accent-soft) / <alpha-value>)',
          200: 'rgb(var(--accent) / 0.4)',
          300: 'rgb(var(--accent) / 0.6)',
          400: 'rgb(var(--accent) / 0.8)',
          500: 'rgb(var(--accent) / <alpha-value>)',
          600: 'rgb(var(--accent) / <alpha-value>)',
          700: 'rgb(var(--accent-strong) / <alpha-value>)',
          800: 'rgb(var(--accent-strong) / <alpha-value>)',
          900: 'rgb(var(--accent-strong) / <alpha-value>)',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 34 54 / 0.04), 0 8px 24px -12px rgb(15 34 54 / 0.10)',
        'card-hover': '0 2px 4px 0 rgb(15 34 54 / 0.05), 0 16px 40px -16px rgb(15 34 54 / 0.16)',
        glow: '0 8px 24px -8px rgb(var(--accent) / 0.4)',
        'glow-sm': '0 4px 14px -6px rgb(var(--accent) / 0.4)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'backdrop-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgb(var(--accent) / 0.5)' },
          '70%': { boxShadow: '0 0 0 8px rgb(var(--accent) / 0)' },
          '100%': { boxShadow: '0 0 0 0 rgb(var(--accent) / 0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.22s ease-out both',
        'scale-in': 'scale-in 0.16s ease-out both',
        'backdrop-in': 'backdrop-in 0.16s ease-out both',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
      },
      backgroundImage: {
        'accent-grad': 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-strong)) 100%)',
        'canvas-glow':
          'radial-gradient(60rem 40rem at 82% -12%, rgb(var(--accent) / 0.07), transparent 60%), radial-gradient(46rem 36rem at -8% 8%, rgb(var(--gold) / 0.06), transparent 55%)',
      },
    },
  },
  plugins: [],
};

export default config;
