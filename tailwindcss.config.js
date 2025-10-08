/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './public/*.html',
    './app/helpers/**/*.rb',
    './app/javascript/**/*.js',
    './app/views/**/*.{erb,haml,html,slim}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Ubuntu', 'Cantarell', 'Noto Sans', 'Helvetica Neue', 'Arial', 'sans-serif']
      },
      screens: {
        print: {
          raw: 'print'
        }
      },
    },
  },
  daisyui: {
    darkTheme: 'dark', // Force dark theme to be 'dark'
    themes: [
      'light',
      'dark',
      {
        dark: {
          ...require('daisyui/src/theming/themes')['dark'],
          "primary": "#ed74b8",
          "secondary": "#dd4e44",
          "accent": "#0088cc",
          "neutral": "#2a2e37",
          "base-100": "#1f2937",
          "info": "#3b82f6",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
    ],
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
    require('daisyui')
  ]
}
