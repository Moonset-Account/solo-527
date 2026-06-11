import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./shared/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        slate: {
          950: "#0B1220",
          900: "#1A2028",
          800: "#1F3A5F",
          700: "#2B4A7A",
          600: "#3A5A8A",
          50: "#F4F6F8",
        },
        amber: {
          500: "#E8871E",
          400: "#F09D3E",
          50: "#FFF8EC",
        },
        mint: {
          500: "#2EA885",
          400: "#3EBFA0",
          50: "#ECFBF7",
        },
      },
      fontFamily: {
        sans: [
          '"Noto Sans SC"',
          '"Source Han Sans CN"',
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
      borderRadius: {
        lg2: "2px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
        "card-hover": "0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)",
        inset: "inset 0 1px 0 rgba(255, 255, 255, 0.06)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in-right": "slideInRight 200ms ease-out",
        "slide-up": "slideUp 220ms cubic-bezier(0.16, 1, 0.3, 1)",
        flash: "flashGreen 400ms ease-out",
      },
      keyframes: {
        slideInRight: {
          "0%": { transform: "translateX(120%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        flashGreen: {
          "0%, 100%": { backgroundColor: "transparent" },
          "50%": { backgroundColor: "rgba(46, 168, 133, 0.18)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
