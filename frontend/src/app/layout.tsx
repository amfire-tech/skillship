import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { OrganizationJsonLd } from "@/components/seo/OrganizationJsonLd";
import { siteConfig } from "@/config/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Skillship — AI-Powered Learning",
    template: "%s | Skillship",
  },
  description: "AI-powered school LMS for Indian schools",
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

// Explicit, mobile-first viewport. width=device-width + initial-scale keeps the
// UI at true device width on phones (90%+ of our users). `viewport-fit=cover`
// lets content use the full screen on notched devices; theme-color tints the
// mobile browser chrome to match the brand.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f14" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <OrganizationJsonLd />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-[var(--foreground)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--background)] focus:shadow-lg"
        >
          Skip to content
        </a>
        <QueryProvider>
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
