/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#192D3E',
          dark: '#0F1A26',
          light: '#2A4154',
        },
        secondary: {
          DEFAULT: '#6B7280',
          light: '#9CA3AF',
          dark: '#4B5563',
        },
        text: {
          primary: '#333333',
          secondary: '#6B7280',
        },
        border: {
          DEFAULT: '#D1D5DB',
          light: '#E5E7EB',
        },
      },
    },
  },
  plugins: [],
}

