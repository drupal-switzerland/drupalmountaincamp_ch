import type { Config } from 'tailwindcss'

import plugin from 'tailwindcss/plugin'
import defaultTheme from 'tailwindcss/defaultTheme'
import { SCREENS } from './app/tailwind/screens'

const fontSize: Record<string, [string, string]> = {
  xs: ['12px', '15px'],
  sm: ['14px', '17.5px'],
  base: ['16px', '24px'],
  lg: ['18px', '27px'],
  xl: ['20px', '30px'],
  '2xl': ['24px', '36px'],
  '3xl': ['30px', '37.5px'],
  '4xl': ['36px', '45px'],
  '5xl': ['48px', '48px'],
  '6xl': ['60px', '60px'],
  '7xl': ['72px', '72px'],
  '8xl': ['96px', '96px'],
  '9xl': ['128px', '128px'],
}

const colors = {
  // Brand navy (Mountain Camp 2027). Base color #0E2D40 sits at 500 because
  // components reference primary-500 for text/headings.
  primary: {
    50: '#ecf5fa',
    100: '#d4e7f2',
    200: '#a9cfe4',
    300: '#74aec9',
    400: '#35708f',
    500: '#0e2d40',
    600: '#0c2839',
    700: '#0a2230',
    800: '#071a26',
    900: '#05131c',
    950: '#030c12',
  },
  // Brand red-orange accent (date banners, CTAs, prominent headings).
  accent: {
    50: '#fdf0ee',
    100: '#fbdcd9',
    200: '#f6b6b0',
    300: '#f08b81',
    400: '#ea5f52',
    500: '#e03628',
    600: '#c02b1f',
    700: '#9c2319',
    800: '#781b13',
    900: '#54130e',
    950: '#380c09',
  },
  // Link blue from the beaker theme.
  link: {
    DEFAULT: '#0094f0',
    hover: '#007ecc',
  },
  gray: {
    50: '#FBFBFB',
    100: '#F3F3F3',
    200: '#E2E2E2',
    300: '#DCDCDE',
    400: '#949BA9',
    500: '#777E94',
    600: '#494E6A',
    700: '#353F57',
    800: '#30384A',
    900: '#1D212D',
  },
  error: {
    50: '#FFE8E9',
    100: '#F8D2D4',
    200: '#F0A5A9',
    300: '#E9787E',
    400: '#E14B53',
    500: '#DA1E28',
    600: '#AE1820',
    700: '#871319',
    800: '#570C10',
    900: '#3A080B',
  },
  warning: {
    50: '#FFFBF2',
    100: '#FFEECC',
    200: '#FFDD99',
    300: '#FFCC66',
    400: '#FFBB33',
    500: '#FFAA00',
    600: '#CC8800',
    700: '#996600',
    800: '#664400',
    900: '#3D2900',
  },
  success: {
    50: '#F7FAF0',
    100: '#E9F1D8',
    200: '#D3E3B1',
    300: '#BED58B',
    400: '#A8C764',
    500: '#92B93D',
    600: '#759431',
    700: '#586F25',
    800: '#3A4A18',
    900: '#242E0F',
  },
}

const spacing = {
  0: '0',
  0.5: '2px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
  36: '144px',
  40: '170px',
  gap: 'var(--grid-gap)',
  outer: 'var(--container-padding)',
}

const config: Config = {
  content: [
    './app/components/**/*.{vue,ts,js}',
    './app/pages/**/*.{vue,ts,js}',
    './app/layouts/**/*.{vue,ts,js}',
    './app/helpers/**/*.{vue,ts,js}',

    // We also need to check the formkit config to not
    // purge classes away that are only used there.
    './formkit.config.ts',
  ],
  theme: {
    screens: Object.fromEntries(
      Object.entries(SCREENS).map(([key, minWidth]) => {
        return [key, minWidth + 'px']
      }),
    ),
    borderWidth: {
      DEFAULT: '1px',
      0: '0',
      1: '1px',
      2: '2px',
      3: '3px',
      4: '4px',
      6: '6px',
      8: '8px',
    },
    fontSize,
    colors: {
      // Monochrome colors.
      white: '#ffffff',
      current: 'currentColor',
      transparent: 'transparent',
      body: colors.gray['900'],

      ...colors,
    },
    spacing,
    fontWeight: {
      light: '300',
      regular: '400',
      medium: '600',
      bold: '700',
    },
    extend: {
      fontFamily: {
        sans: ['"Source Sans 3"', ...defaultTheme.fontFamily.sans],
        heading: ['"Zilla Slab"', ...defaultTheme.fontFamily.serif],
      },
      transitionDuration: {
        250: '250ms',
      },
    },
  },
  plugins: [
    /**
     * Various additional variants
     */
    plugin(({ addVariant }) => {
      addVariant(
        'mobile-only',
        "@media screen and (max-width: theme('screens.md'))",
      )
      addVariant('not-last', '&:not(:last-child)')
      addVariant('not-first', '&:not(:first-child)')
    }),
  ],
  corePlugins: {
    textOpacity: false,
  },
}

export default config
