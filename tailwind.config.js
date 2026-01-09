/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Navy blue
        primary: {
          DEFAULT: 'hsl(220, 65%, 35%)',
          foreground: 'hsl(0, 0%, 100%)',
          hover: 'hsl(220, 65%, 28%)',
        },
        // Accent - Crimson
        accent: {
          DEFAULT: 'hsl(350, 75%, 45%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        // Success - Green
        success: {
          DEFAULT: 'hsl(152, 60%, 40%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        // Warning - Amber
        warning: {
          DEFAULT: 'hsl(38, 92%, 50%)',
          foreground: 'hsl(0, 0%, 10%)',
        },
        // Destructive - Red
        destructive: {
          DEFAULT: 'hsl(0, 72%, 51%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        // Background
        background: 'hsl(220, 25%, 97%)',
        // Card
        card: {
          DEFAULT: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(220, 30%, 18%)',
        },
        // Muted
        muted: {
          DEFAULT: 'hsl(220, 15%, 94%)',
          foreground: 'hsl(220, 10%, 45%)',
        },
        // Border
        border: 'hsl(220, 15%, 90%)',
        // Input
        input: 'hsl(220, 15%, 85%)',
        // Ring (focus)
        ring: 'hsl(220, 65%, 35%)',
        // Sidebar
        sidebar: {
          DEFAULT: 'hsl(222, 47%, 11%)',
          foreground: 'hsl(210, 40%, 98%)',
          muted: 'hsl(215, 20%, 65%)',
        },
      },
      borderRadius: {
        DEFAULT: '0.625rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card-hover': '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
