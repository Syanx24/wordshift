/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Stitch Neo-Brutalist Palette
        surface: {
          DEFAULT: '#fbf9f1',
          dim: '#dcdad2',
          bright: '#fbf9f1',
          variant: '#e4e3db',
          lowest: '#ffffff',
          low: '#f5f4ec',
          container: '#f0eee6',
          high: '#eae8e0',
          highest: '#e4e3db',
        },
        'on-surface': {
          DEFAULT: '#1b1c17',
          variant: '#54414e',
        },
        ink: '#111111',
        primary: {
          DEFAULT: '#ab0e97',
          container: '#f45bd7',
          fixed: '#ffd7f0',
          'fixed-dim': '#fface7',
          'on-container': '#5f0053',
          'on-fixed': '#3a0032',
        },
        secondary: {
          DEFAULT: '#296c00',
          container: '#a0f973',
          fixed: '#a0f973',
          'fixed-dim': '#85dc5a',
          'on-container': '#2c7300',
          'on-fixed': '#072100',
        },
        tertiary: {
          DEFAULT: '#715c00',
          container: '#cca800',
          fixed: '#ffe17b',
          'fixed-dim': '#ebc315',
          'on-container': '#4d3e00',
          'on-fixed': '#231b00',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
          'on-container': '#93000a',
        },
        outline: {
          DEFAULT: '#87717e',
          variant: '#dabfcf',
        },
        // Fallback backward-compatible brand tokens
        brand: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#f45bd7',
          600: '#ab0e97',
          700: '#86198f',
          800: '#701a75',
          900: '#581c87',
        },
        dark: {
          bg: '#141414',
          surface: '#1c1c1c',
          card: '#242424',
          border: '#333333',
          subtle: '#444444'
        }
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"Space Grotesk"', 'monospace'],
      },
      boxShadow: {
        'neo-xs': '1.5px 1.5px 0px #111111',
        'neo-sm': '2px 2px 0px #111111',
        'neo': '3px 3px 0px #111111',
        'neo-md': '4px 4px 0px #111111',
        'neo-lg': '6px 6px 0px #111111',
        'neo-xl': '8px 8px 0px #111111',
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'marquee': 'marquee 16s linear infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
