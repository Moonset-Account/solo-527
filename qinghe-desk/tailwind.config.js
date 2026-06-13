/** @type {import('tailwindcss').Config} */
function hsl(varName) {
  return `hsl(var(${varName}) / <alpha-value>)`;
}

module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: hsl("--border"),
        input: hsl("--input"),
        ring: hsl("--ring"),
        background: hsl("--background"),
        foreground: hsl("--foreground"),
        success: hsl("--success"),
        warning: hsl("--warning"),
        primary: {
          DEFAULT: hsl("--primary"),
          foreground: hsl("--primary-foreground"),
        },
        secondary: {
          DEFAULT: hsl("--secondary"),
          foreground: hsl("--secondary-foreground"),
        },
        destructive: {
          DEFAULT: hsl("--destructive"),
          foreground: hsl("--destructive-foreground"),
        },
        muted: {
          DEFAULT: hsl("--muted"),
          foreground: hsl("--muted-foreground"),
        },
        accent: {
          DEFAULT: hsl("--accent"),
          foreground: hsl("--accent-foreground"),
        },
        popover: {
          DEFAULT: hsl("--card"),
          foreground: hsl("--card-foreground"),
        },
        card: {
          DEFAULT: hsl("--card"),
          foreground: hsl("--card-foreground"),
        },
        pine: {
          50: "#f0f5f3",
          100: "#d9e8e2",
          200: "#b3d1c5",
          300: "#8dbaa8",
          400: "#67a38b",
          500: "#4d8b72",
          600: "#3d7060",
          700: "#2f574c",
          800: "#1a3c34",
          900: "#0f2520",
          950: "#081210",
        },
        amber: {
          50: "#fdf8ed",
          100: "#f9edcc",
          200: "#f3da96",
          300: "#edc660",
          400: "#d4a853",
          500: "#c49233",
          600: "#a67528",
          700: "#855922",
          800: "#6d4722",
          900: "#5c3c21",
        },
        cream: "#F8F6F0",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        serif: ["Noto Serif SC", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
