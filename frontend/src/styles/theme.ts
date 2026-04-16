export const theme = {
  colors: {
    primary: "#059669",
    accent: "#0D9488",
    warning: "#F59E0B",
    danger: "#EF4444",
    background: "#FAFFFE",
    card: "#FFFFFF",
    dark: {
      background: "#0C1220",
      card: "#162032",
      text: "#F0FDF4",
      border: "#1E3A3A",
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
    card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    cardHover: "0 8px 25px -5px rgba(5,150,105,0.12)",
  },
  borderRadius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
  },
} as const;
