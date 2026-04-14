import Link from "next/link";
import Image from "next/image";
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
            <Link href="/" className="flex items-center gap-2" aria-label={`${siteConfig.name} home`}>
              <Image src="/logo-icon.png" alt="Skillship logo" width={38} height={38} className="object-contain" />
              <span className="text-lg font-bold tracking-tight">
                <span style={{ color: "#F59E0B" }}>SKILL</span>
                <span style={{ color: "#0D9488" }}>SHIP</span>
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
