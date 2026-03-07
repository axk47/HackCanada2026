/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#020817',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        },
        'orb-green': '#22c55e',
        'orb-red': '#ef4444',
        'orb-yellow': '#eab308',
        'accent': '#38bdf8',
      },
      fontFamily: {
        mono: ['"Space Mono"', 'monospace'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
