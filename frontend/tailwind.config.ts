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
          DEFAULT: "#059669",
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
        accent: {
          DEFAULT: "#0D9488",
          50: "#F0FDFA",
          500: "#0D9488",
          600: "#0F766E",
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
          bg: "#F9FAFB",
          card: "#FFFFFF",
          border: "#E5E7EB",
        },
        dark: {
          bg: "#0C1220",
          card: "#162032",
          border: "#1E3A3A",
          text: "#F0FDF4",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      maxWidth: {
        container: "1440px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 25px -5px rgba(5,150,105,0.12), 0 4px 10px -3px rgba(0,0,0,0.06)",
        glass: "0 8px 32px rgba(5,150,105,0.08)",
        glow: "0 0 40px -10px rgba(5,150,105,0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
