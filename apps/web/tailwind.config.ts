import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          900: "#1E3A8A",
        },
        accent: {
          DEFAULT: "#10B981",
          50: "#ECFDF5",
          500: "#10B981",
          600: "#059669",
        },
        warning: {
          DEFAULT: "#F59E0B",
          50: "#FFFBEB",
          500: "#F59E0B",
        },
        danger: {
          DEFAULT: "#EF4444",
          50: "#FEF2F2",
          500: "#EF4444",
          600: "#DC2626",
        },
        surface: {
          bg: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
        },
        dark: {
          bg: "#0F172A",
          card: "#1E293B",
          border: "#334155",
          text: "#F1F5F9",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      maxWidth: {
        container: "1440px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.1)",
      },
    },
  },
  plugins: [],
};
export default config;
