/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          deep:  '#0B1B32',
          mid:   '#26415E',
          light: '#0D1E4C',
        },
        rose: {
          strong: '#C48CB3',
          soft:   '#E5C9D7',
        },
        sky: '#83A6CE',
      },
      fontFamily: {
        sans:    ['DM Sans', 'sans-serif'],
        serif:   ['DM Serif Display', 'serif'],
      },
    },
  },
  plugins: [],
}
