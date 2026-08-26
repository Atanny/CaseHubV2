/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/layouts/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design system colors — sourced directly from the CASEHUB Figma file
        ch: {
          main: '#40513B', // Main Color — primary text / active state
          background: '#E8DFCA', // Background Color — app canvas
          secondary: '#F5EFE6', // Secondary / Tertiary Color — panel backgrounds
          border: '#E8DFCA', // Border Color
          white: '#FFFFFF', // Card / White Color
          red: '#C54446', // Danger / logout / remove actions
        },
      },
      fontFamily: {
        // Headings
        heading: ['var(--font-moderustic)', 'sans-serif'],
        // Nav labels / badges / small uppercase UI text
        label: ['var(--font-prompt)', 'sans-serif'],
        // Body copy / buttons
        body: ['var(--font-poppins)', 'sans-serif'],
      },
      fontSize: {
        h4: ['24px', { lineHeight: '1', fontWeight: '700' }],
        h6: ['16px', { lineHeight: '1', fontWeight: '700' }],
        badge: ['10px', { lineHeight: '1', fontWeight: '700', letterSpacing: '0' }],
        body: ['12px', { lineHeight: '1', fontWeight: '400' }],
      },
      boxShadow: {
        ch: '2px 5px 10px 0px rgba(64,81,59,0.1)',
        'ch-sm': '0px 1px 5px 0px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        ch: '10px',
        'ch-lg': '15px',
      },
    },
  },
  plugins: [],
};
