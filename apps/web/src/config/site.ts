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
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
    product: [
      { label: "Features", href: "/#features" },
      { label: "Workshops", href: "/workshops" },
      { label: "Marketplace", href: "/marketplace" },
      { label: "Pricing", href: "/pricing" },
    ],
    resources: [
      { label: "Documentation", href: "/docs" },
      { label: "Help Center", href: "/help" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
    socials: [
      { label: "Twitter", href: "https://twitter.com/skillship" },
      { label: "LinkedIn", href: "https://linkedin.com/company/skillship" },
      { label: "Instagram", href: "https://instagram.com/skillship" },
      { label: "YouTube", href: "https://youtube.com/@skillship" },
    ],
    contact: {
      email: "hello@skillship.in",
      phone: "+91 98765 43210",
      address: "Pune, Maharashtra, India",
    },
  },
} as const;
