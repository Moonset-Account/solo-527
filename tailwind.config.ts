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
        warning: {
          50: "#FFF7E8",
          100: "#FFE7B9",
          200: "#FFD68A",
          300: "#FFC55B",
          400: "#FFB42C",
          500: "#FF7D00",
          600: "#CC6400",
          700: "#994B00",
          800: "#663200",
          900: "#331900",
        },
        success: {
          500: "#00B42A",
        },
        danger: {
          500: "#F53F3F",
        },
      },
      fontFamily: {
        sans: ["PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "sans-serif"],
        mono: ["SF Mono", "Monaco", "Inconsolata", "monospace"],
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
