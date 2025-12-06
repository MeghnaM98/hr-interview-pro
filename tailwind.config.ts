import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#3b82f6',
          deep: '#1d4ed8',
          accent: '#a78bfa',
          teal: '#0f766e'
        },
        warm: {
          sand: '#f8fafb',
          slate: '#f1f5f9'
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Plus Jakarta Sans', 'Inter', 'sans-serif'],
        display: ['var(--font-jakarta)', 'Plus Jakarta Sans', 'Inter', 'sans-serif']
      },
      boxShadow: {
        card: '0 20px 60px -35px rgba(15, 118, 110, 0.65)',
        glow: '0 0 30px rgba(59, 130, 246, 0.35)'
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at top, rgba(59,130,246,0.25), transparent 60%)',
        'accent-sheen': 'linear-gradient(120deg, rgba(59,130,246,0.35), rgba(167,139,250,0.35))'
      }
    }
  },
  plugins: [forms]
};

export default config;
