import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: "#E6F4F4",
          100: "#C2E3E4",
          200: "#9AD1D3",
          300: "#6FBEC1",
          400: "#4CAEAF",
          500: "#0D7377",
          600: "#0B6467",
          700: "#095456",
          800: "#074547",
          900: "#053536",
        },
        ochre: {
          50: "#FBF1EA",
          100: "#F4DCC9",
          200: "#EDC5A6",
          300: "#E5AE83",
          400: "#DE9760",
          500: "#C87941",
          600: "#A86436",
          700: "#884F2B",
          800: "#683A20",
          900: "#482515",
        },
        gold: {
          50: "#FBF5E5",
          100: "#F5E7BC",
          200: "#EFD894",
          300: "#E9C96C",
          400: "#DEB74E",
          500: "#D4A84B",
          600: "#B48A3E",
          700: "#946C31",
          800: "#744E24",
          900: "#543017",
        },
        cream: {
          50: "#FDFCFB",
          100: "#FAF8F5",
          200: "#F5F1EA",
          300: "#EFE9DF",
          400: "#E6DDCE",
        },
        ink: {
          900: "#2C3639",
          800: "#3F4A4D",
          700: "#525E61",
          600: "#6B7280",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(13, 115, 119, 0.08), 0 1px 2px rgba(13, 115, 119, 0.06)",
        "card-hover": "0 4px 12px rgba(13, 115, 119, 0.12), 0 2px 4px rgba(13, 115, 119, 0.08)",
        gold: "0 0 0 1px rgba(212, 168, 75, 0.3)",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.4s ease-out both",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
