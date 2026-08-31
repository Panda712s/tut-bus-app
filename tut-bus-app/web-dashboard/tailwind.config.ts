import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcdaff',
          300: '#8ec3ff',
          400: '#59a3ff',
          500: '#3182f6',
          600: '#1e63e0',
          700: '#194fb5',
          800: '#1a4392',
          900: '#1b3a75',
        },
      },
    },
  },
  plugins: [],
};

export default config;
