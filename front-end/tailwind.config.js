/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--color-bg) / <alpha-value>)',
        surface: 'hsl(var(--color-surface) / <alpha-value>)',
        text: 'hsl(var(--color-text) / <alpha-value>)',
        'text-primary': 'hsl(var(--color-text) / 0.88)',
        'text-secondary': 'hsl(var(--color-muted) / 0.9)',
        muted: 'hsl(var(--color-muted) / <alpha-value>)',
        border: 'hsl(var(--color-border) / <alpha-value>)',
        ring: 'hsl(var(--color-ring) / <alpha-value>)',
        primary: 'hsl(var(--color-primary) / <alpha-value>)',
        secondary: 'hsl(var(--color-secondary) / <alpha-value>)',
        accent: 'hsl(var(--color-accent) / <alpha-value>)',
        'on-primary': 'hsl(var(--color-on-primary) / <alpha-value>)',
        sidebar: 'hsl(var(--color-sidebar-bg) / <alpha-value>)',
        'sidebar-border': 'hsl(var(--color-sidebar-border) / <alpha-value>)',
        'sidebar-hover': 'hsl(var(--color-sidebar-hover) / <alpha-value>)',
        'sidebar-text': 'hsl(var(--color-sidebar-text) / <alpha-value>)',
        'sidebar-muted': 'hsl(var(--color-sidebar-muted) / <alpha-value>)',
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif']
      },
    },
  },
  plugins: [],
}
