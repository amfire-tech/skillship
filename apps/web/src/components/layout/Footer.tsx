import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Footer() {
  const linkGroups = [
    {
      title: "Platform",
      links: [
        { label: "Features", href: "/#features" },
        { label: "Workshops", href: "/workshops" },
        { label: "Marketplace", href: "/marketplace" },
        { label: "Pricing", href: "/pricing" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Blog", href: "/blog" },
        { label: "Press", href: "/press" },
      ],
    },
    {
      title: "Contact",
      links: [
        { label: "info@skillship.in", href: "mailto:info@skillship.in" },
        { label: "+91 93684 08577", href: "tel:+919368408577" },
        { label: "Agra, Uttar Pradesh", href: "#" },
        { label: "Privacy Policy", href: "/privacy" },
      ],
    },
  ];

  return (
    <footer className="bg-[#0C1F1A] text-white" role="contentinfo">
      <div className="mx-auto max-w-container px-6 lg:px-8">
        <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div>
            <Link href="/" className="flex items-center gap-2.5" aria-label={`${siteConfig.name} home`}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </div>
              <span className="text-lg font-bold text-white">
                {siteConfig.name}
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-emerald-200/60">
              AI-powered school management and career guidance for Indian schools
              delivering future-ready education.
            </p>
          </div>

          {/* Link Groups */}
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-bold text-white">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-3" role="list">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-emerald-200/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-emerald-800/30 py-6 md:flex-row">
          <p className="text-sm text-emerald-200/50">
            {new Date().getFullYear()} Skillship Edutech. All rights reserved.
          </p>
          <p className="text-sm text-emerald-200/50">
            Made for Indian Education
          </p>
        </div>
      </div>
    </footer>
  );
}
