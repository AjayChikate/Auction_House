/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        fall: {
          '0%': { transform: 'translateY(-50px) rotate(0deg)', opacity: 1 },
          '80%': { transform: 'translateY(180px) rotate(270deg)', opacity: 1 },
          '100%': { transform: 'translateY(250px) rotate(360deg)', opacity: 0 },
        },
      },
      animation: {
        fall: 'fall 1s linear forwards',
      },
    },
  },
  plugins: [],
}





