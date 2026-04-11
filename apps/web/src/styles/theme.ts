export const theme = {
  colors: {
    primary: "#2563EB",
    accent: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    background: "#F8FAFC",
    card: "#FFFFFF",
    dark: {
      background: "#0F172A",
      card: "#1E293B",
      text: "#F1F5F9",
      border: "#334155",
    },
  },
  font: {
    family: "'Inter', sans-serif",
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    section: "96px",
    sectionMobile: "64px",
    container: "1440px",
    gutter: "24px",
  },
  shadow: {
    card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
    cardHover: "0 4px 12px rgba(0,0,0,0.1)",
  },
  borderRadius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
  },
} as const;
