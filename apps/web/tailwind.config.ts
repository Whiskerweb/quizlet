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
        // Brand colors
        brand: {
          primary: '#4255FF',
          primarySoft: '#5468FF',
          primaryDark: '#1B2BFF',
          secondaryTeal: '#3FD3FF',
          accentYellow: '#FFD95A',
          accentPink: '#FF5FA2',
        },
        // Dark theme
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
            primaryHover: '#5468FF',
            primaryActive: '#1B2BFF',
            surfaceHover: '#181F3E',
            surfaceActive: '#141A37',
            danger: '#FF4B5C',
            success: '#3BD373',
            warning: '#FFD95A',
          },
          semantic: {
            navActiveBackground: '#1C2346',
            navActiveIcon: '#FFFFFF',
            navInactiveIcon: '#C5C9FF',
            chipBackground: '#151B3B',
            chipBackgroundSelected: '#1C2346',
          },
        },
        // Light theme
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
            link: '#4255FF',
          },
          border: {
            subtle: '#E1E4FF',
            soft: '#D3D9FF',
          },
          states: {
            primaryHover: '#5468FF',
            primaryActive: '#1B2BFF',
            surfaceHover: '#EEF1FF',
          },
        },
        // Legacy primary colors (for backward compatibility)
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#4255FF',
          600: '#1B2BFF',
          700: '#1B2BFF',
          800: '#1B2BFF',
          900: '#1B2BFF',
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
        base: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'sans-serif'],
        display: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'sans-serif'],
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
        'elevation-1': '0 8px 24px rgba(0,0,0,0.28)',
        'elevation-2': '0 12px 32px rgba(0,0,0,0.36)',
        'primary-glow': '0 10px 24px rgba(66,85,255,0.45)',
        'primary-glow-lg': '0 10px 26px rgba(66,85,255,0.45)',
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
        slideIn: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-10px) scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)',
          },
        },
        'card-appear': {
          '0%': { opacity: '0', transform: 'translateY(-20px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        slideIn: 'slideIn 0.6s ease-out',
        'card-appear': 'card-appear 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;




