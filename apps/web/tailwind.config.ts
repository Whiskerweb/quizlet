import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
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
        // Dark theme colors
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
        // Light theme colors
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
      },
    },
  },
  plugins: [],
};

export default config;
