/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        jakarta: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // ── Colores semánticos del tema (apuntan a CSS variables) ──────────────
        // Se usan como clases: bg-k-bg, text-k-text, border-k-border, etc.
        // NOTA: Opacity modifiers (bg-k-gold/20) NO funcionan con var(),
        //       para eso usar inline styles o las clases k-* en index.css
        'k-bg':      'var(--k-bg)',
        'k-sidebar': 'var(--k-sidebar)',
        'k-surface': 'var(--k-surface)',
        'k-border':  'var(--k-border)',
        'k-text':    'var(--k-text)',
        'k-muted':   'var(--k-muted)',
        'k-gold':    'var(--k-gold)',
        'k-green':   'var(--k-green)',
        'k-teal':    'var(--k-teal)',

        // ── Naranja Kairon — trazo del Hijo (encarnación, crecimiento) ──────────
        brand: {
          50:  '#fff8ec',
          100: '#ffefd3',
          200: '#ffdba5',
          300: '#ffc06d',
          400: '#ff9a32',
          500: '#f97316',
          600: '#ea6a0a',
          700: '#c2530a',
          800: '#9a4210',
          900: '#7c3710',
          950: '#431a04',
        },
        // ── Verde Kairon — trazo del Espíritu (conexión, crecimiento agrario) ────
        kgreen: {
          50:  '#eefdf4',
          100: '#d6fae4',
          200: '#b0f4cc',
          300: '#78e9aa',
          400: '#3dd683',
          500: '#18c064',
          600: '#0d9b50',
          700: '#0e7a42',
          800: '#106137',
          900: '#0e5030',
          950: '#052d1b',
        },
        // ── Teal Kairon — acento espiritual (flujo de puntos) ────────────────────
        kteal: {
          50:  '#edfcfc',
          100: '#d1f7f7',
          200: '#a9eeee',
          300: '#6fe1e1',
          400: '#2ecbcb',
          500: '#13b0b0',
          600: '#0e8e8e',
          700: '#117272',
          800: '#145b5b',
          900: '#154c4c',
          950: '#062e2e',
        },
      },
      animation: {
        'trinity-glow': 'trinity 1.8s ease-in-out infinite',
        'fade-in-up':   'fadeInUp 0.4s ease forwards',
      },
      keyframes: {
        trinity: {
          '0%, 100%': { opacity: '0', transform: 'scale(0.8) translateY(0px)' },
          '50%':       { opacity: '1', transform: 'scale(1.4) translateY(-8px)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
