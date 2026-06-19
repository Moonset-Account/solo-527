import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF3F9",
          100: "#D6E2EE",
          200: "#AEC4DC",
          300: "#85A6C9",
          400: "#5D88B7",
          500: "#346AA5",
          600: "#1E3A5F",
          700: "#172E4C",
          800: "#102339",
          900: "#091726",
        },
        accent: {
          50: "#FFF8EC",
          100: "#FEECCB",
          200: "#FDDA94",
          300: "#FBC75D",
          400: "#FAB527",
          500: "#F59E0B",
          600: "#C97F04",
          700: "#975F03",
          800: "#643F02",
          900: "#322001",
        },
      },
      fontFamily: {
        sans: ["'Noto Sans SC'", "'PingFang SC'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.06)",
        "card-hover": "0 10px 20px -10px rgba(30, 58, 95, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
