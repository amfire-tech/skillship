export const siteConfig = {
  name: "Skillship",
  description:
    "AI-Powered School Management & Career Guidance Platform for Indian schools delivering AI and robotics workshops to students from Class 1 to 12.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  navLinks: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Workshops", href: "/workshops" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Contact", href: "/contact" },
  ],
  cta: { label: "Request Demo", href: "/request-demo" },
  footer: {
    company: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Request Demo", href: "/request-demo" },
    ],
    product: [
      { label: "Features", href: "/#features" },
      { label: "Workshops", href: "/workshops" },
      { label: "Marketplace", href: "/marketplace" },
    ],
    resources: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
    socials: [
      { label: "Twitter", href: "https://twitter.com/skillship_" },
      { label: "LinkedIn", href: "https://www.linkedin.com/company/skillship-edutech/" },
      { label: "Instagram", href: "https://www.instagram.com/skillship.in/" },
      { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61551827170275" },
    ],
    contact: {
      email: "info@skillship.in",
      phone: "+91 93684 08577",
      address: "Tajganj, Agra, Uttar Pradesh 282006",
    },
  },
} as const;
