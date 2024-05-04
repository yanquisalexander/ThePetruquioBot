import MiduAnimations from '@midudev/tailwind-animations'
import plugin from 'tailwindcss/plugin'

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  safelist: ["dark"],
  
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      textShadow: {
        sm: '0 1px 2px var(--tw-shadow-color)',
        DEFAULT: '0 2px 4px var(--tw-shadow-color)',
        lg: '0 8px 16px var(--tw-shadow-color)',
      },
      animation: {
        spin: "spin 1s linear infinite",
      },
      colors: {
        twitch: {
          50: '#f6f2ff',
          100: '#eee8ff',
          200: '#dfd4ff',
          300: '#cab1ff',
          400: '#b085ff',
          500: '#9146ff',
          600: '#8d30f7',
          700: '#7f1ee3',
          800: '#6a18bf',
          900: '#57169c',
          950: '#370b6a',
        },        
      },
      keyframes: {
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [
    MiduAnimations,
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'text-shadow': (value) => ({
            textShadow: value,
          }),
        },
        { values: theme('textShadow') }
      )
    }),
  ],
}