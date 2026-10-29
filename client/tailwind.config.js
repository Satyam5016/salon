/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        blush: '#bf4168',
        rosewood: '#6f243f',
        ink: '#1f1b1d',
        ivory: '#fffaf6',
        champagne: '#f1d7b6',
        pearl: '#fbf3ed',
        sage: '#66785f',
        mist: '#edf3ef',
        plum: '#2d2028',
        gold: '#b48953'
      },
      boxShadow: {
        salon: '0 18px 55px rgba(50, 32, 39, 0.12)',
        soft: '0 10px 35px rgba(50, 32, 39, 0.08)'
      }
    }
  },
  plugins: []
};
