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
        primary: {
          50: "#E8F3FF",
          100: "#BEDAFF",
          200: "#94BFFF",
          300: "#6AA4FF",
          400: "#4089FF",
          500: "#165DFF",
          600: "#0E42D2",
          700: "#0A2BA0",
          800: "#061A6E",
          900: "#030D3C",
        },
        success: {
          50: "#E8FFEA",
          500: "#00B42A",
          600: "#009A29",
        },
        warning: {
          50: "#FFF7E8",
          500: "#FF7D00",
          600: "#D45A00",
        },
        danger: {
          50: "#FFECE8",
          500: "#F53F3F",
          600: "#CB2634",
        },
        neutral: {
          50: "#F7F8FA",
          100: "#F2F3F5",
          200: "#E5E6EB",
          300: "#C9CDD4",
          400: "#86909C",
          500: "#4E5969",
          600: "#272E3B",
          700: "#1D2129",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        card: "0 2px 8px 0 rgba(0, 0, 0, 0.08)",
        "card-hover": "0 4px 16px 0 rgba(0, 0, 0, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
