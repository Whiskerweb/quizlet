import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563EB',
          primarySoft: '#93C5FD',
          primaryDark: '#1D4ED8',
          secondaryTeal: '#0EA5E9',
          accentYellow: '#FBBF24',
          accentPink: '#F472B6',
        },
        dark: {
          background: {
            base: '#05081E',
            subtle: '#070B28',
            raised: '#101632',
            card: '#101632',
            cardMuted: '#151B3B',
            input: '#151B3B',
            sidebar: '#05081E',
          },
          text: {
            primary: '#FFFFFF',
            secondary: '#C5C9FF',
            muted: '#8B8FBE',
            label: '#6F739C',
            placeholder: '#5D618F',
            inverse: '#05081E',
          },
          border: {
            subtle: 'rgba(255,255,255,0.06)',
            soft: 'rgba(255,255,255,0.12)',
            strong: 'rgba(255,255,255,0.18)',
            focus: '#FFFFFF',
          },
          states: {
            primaryHover: '#93C5FD',
            primaryActive: '#3B82F6',
            surfaceHover: '#181F3E',
            surfaceActive: '#141A37',
            danger: '#FF4B5C',
            success: '#3BD373',
            warning: '#FCD34D',
          },
          semantic: {
            navActiveBackground: '#1C2346',
            navActiveIcon: '#FFFFFF',
            navInactiveIcon: '#C5C9FF',
            chipBackground: '#151B3B',
            chipBackgroundSelected: '#1C2346',
          },
        },
        light: {
          background: {
            base: '#FFFFFF',
            subtle: '#F5F7FF',
            card: '#FFFFFF',
            heroBand: '#F6F8FF',
          },
          text: {
            primary: '#111135',
            secondary: '#44466F',
            muted: '#7B7FA5',
            link: '#60A5FA',
          },
          border: {
            subtle: '#E1E4FF',
            soft: '#D3D9FF',
          },
          states: {
            primaryHover: '#93C5FD',
            primaryActive: '#3B82F6',
            surfaceHover: '#EEF1FF',
          },
        },
        bg: {
          default: 'var(--bg-default)',
          muted: 'var(--bg-muted)',
          subtle: 'var(--bg-subtle)',
          emphasis: 'var(--bg-emphasis)',
          inverted: 'var(--bg-inverted)',
          info: 'var(--bg-info)',
          success: 'var(--bg-success)',
          attention: 'var(--bg-attention)',
          error: 'var(--bg-error)',
        },
        border: {
          default: 'var(--border-default)',
          muted: 'var(--border-muted)',
          subtle: 'var(--border-subtle)',
          emphasis: 'var(--border-emphasis)',
        },
        content: {
          default: 'var(--content-default)',
          muted: 'var(--content-muted)',
          subtle: 'var(--content-subtle)',
          emphasis: 'var(--content-emphasis)',
          inverted: 'var(--content-inverted)',
          info: 'var(--content-info)',
          success: 'var(--content-success)',
          attention: 'var(--content-attention)',
          error: 'var(--content-error)',
        },
        state: {
          focus: '#2563EB',
          success: '#22C55E',
          warning: '#F97316',
          danger: '#DC2626',
        },
        neutral: {
          25: '#FCFCFA',
          50: '#F7F7F2',
          100: '#EFEFE7',
          200: '#E2E0D9',
          300: '#CBC7BD',
          400: '#A7A297',
          500: '#6F6A61',
          600: '#4F4C45',
          700: '#3D3A34',
          800: '#2F2C28',
          900: '#1F1D1A',
        },
      },
      spacing: {
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        xxl: '24px',
        pill: '999px',
      },
      fontFamily: {
        base: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'sans-serif'],
        display: ['var(--font-satoshi)', 'Satoshi', 'Inter', 'system-ui', '-apple-system', 'SF Pro Display', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Geist Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        caption: ['12px', { lineHeight: '1.4' }],
        bodySm: ['13px', { lineHeight: '1.4' }],
        body: ['14px', { lineHeight: '1.4' }],
        bodyLg: ['16px', { lineHeight: '1.4' }],
        subtitle: ['18px', { lineHeight: '1.4' }],
        titleSm: ['20px', { lineHeight: '1.25' }],
        title: ['24px', { lineHeight: '1.25' }],
        titleLg: ['28px', { lineHeight: '1.25' }],
        display: ['36px', { lineHeight: '1.1' }],
        hero: ['44px', { lineHeight: '1.1' }],
      },
      boxShadow: {
        card: '0 15px 35px rgba(15,23,42,0.08)',
        'card-hover': '0 18px 45px rgba(15,23,42,0.12)',
        panel: '0 20px 60px rgba(15,23,42,0.14)',
        'primary-glow': '0 14px 48px rgba(37,99,235,0.35)',
      },
      transitionDuration: {
        fast: '120ms',
        normal: '180ms',
        slow: '260ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        emphasized: 'cubic-bezier(0.18, 0.9, 0.32, 1.1)',
      },
      keyframes: {
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up-fade': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-from-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        spinner: {
          to: { transform: 'rotate(360deg)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        pulse: {
          '0%': { transform: 'scale(0.98)', opacity: '0.75' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.2s ease-out forwards',
        'slide-up-fade': 'slide-up-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-from-right': 'slide-in-from-right 0.2s ease',
        wiggle: 'wiggle 0.75s infinite',
        spinner: 'spinner 1.2s linear infinite',
        blink: 'blink 1.4s infinite both',
        pulse: 'pulse 1s linear infinite alternate',
      },
    },
  },
  plugins: [],
};

export default config;




