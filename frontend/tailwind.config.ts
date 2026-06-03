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
        // ── BRAND ── Primary = Skillship orange. Accent = Skillship teal.
        // The "from-primary to-accent" gradient that pervades dashboard
        // CTAs now resolves to the homepage's brand-gradient automatically.
        primary: {
          DEFAULT: "#F39C32",
          50:  "#FEF7EC",
          100: "#FDEFD4",
          200: "#FBD9A4",
          300: "#F8B660",
          400: "#F8B660",
          500: "#F39C32",
          600: "#D8861F",
          700: "#A66818",
          800: "#7A4F12",
          900: "#523508",
        },
        accent: {
          DEFAULT: "#2EB6B5",
          50:  "#ECFAFA",
          100: "#D4F2F2",
          200: "#A7E5E4",
          300: "#5CC9C8",
          400: "#5CC9C8",
          500: "#2EB6B5",
          600: "#1F9594",
          700: "#19736F",
          800: "#125A57",
          900: "#0A3B39",
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
        // Official Skillship brand palette — extracted from the logo wordmark.
        // Values locked to skillship_homepage_brief.md §1.1 (don't drift).
        brand: {
          orange:        "#F39C32",
          "orange-400":  "#F8B660",
          "orange-500":  "#F39C32",
          "orange-600":  "#D8861F",
          teal:          "#2EB6B5",
          "teal-400":    "#5CC9C8",
          "teal-500":    "#2EB6B5",
          "teal-600":    "#1F9594",
          cream:         "#F4EAD3",
          "cream-soft":  "#FAF4E6",
          green:         "#4FB956",
          warm:          "#FAF7F0",
          ink:           "#0F1419",
          "ink-soft":    "#1A2128",
          "ink-2":       "#4A5560",
          "ink-3":       "#8A95A0",
        },
      },
      fontFamily: {
        // Wire to the CSS variable that next/font sets in layout.tsx so the
        // self-hosted Inter Variable from /_next/static/media/ is actually
        // used, not the system Inter fallback. Brief §1.2.
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      maxWidth: {
        container: "1440px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 25px -5px rgba(5,150,105,0.12), 0 4px 10px -3px rgba(0,0,0,0.06)",
        glass: "0 8px 32px rgba(5,150,105,0.08)",
        glow: "0 0 40px -10px rgba(5,150,105,0.3)",
        // Public-site shadows — per brief §1.5
        soft:    "0 1px 2px rgba(15,20,25,0.04), 0 4px 12px rgba(15,20,25,0.04)",
        medium:  "0 4px 12px rgba(15,20,25,0.06), 0 12px 32px rgba(15,20,25,0.08)",
        strong:  "0 8px 24px rgba(15,20,25,0.08), 0 24px 64px rgba(15,20,25,0.12)",
        warm:    "0 8px 32px rgba(243,156,50,0.18)",
        cool:    "0 8px 32px rgba(46,182,181,0.18)",
      },
      backgroundImage: {
        "brand-gradient":   "linear-gradient(135deg, #F39C32 0%, #2EB6B5 100%)",
        "warmth-gradient":  "linear-gradient(135deg, #F39C32 0%, #F8B660 100%)",
        "cool-gradient":    "linear-gradient(135deg, #2EB6B5 0%, #5CC9C8 100%)",
        "dawn-gradient":    "linear-gradient(180deg, #FAF7F0 0%, #F4EAD3 100%)",
      },
      transitionTimingFunction: {
        // ease-out-expo — the arrival curve from brief §1.4
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        // strong-in — for exits
        "in-strong": "cubic-bezier(0.7, 0, 0.84, 0)",
      },
    },
  },
  plugins: [],
};
export default config;
