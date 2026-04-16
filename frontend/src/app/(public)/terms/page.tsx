import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Skillship",
  description: "Skillship platform terms of service.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Terms of Service</h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">Last updated: April 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-[var(--muted-foreground)]">
        <section>
          <h2 className="text-base font-bold text-[var(--foreground)]">1. Acceptance of Terms</h2>
          <p className="mt-2">
            By accessing or using the Skillship platform, you agree to be bound by these Terms of Service and all
            applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from
            using the platform.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--foreground)]">2. Use of the Platform</h2>
          <p className="mt-2">
            Skillship grants you a limited, non-exclusive, non-transferable licence to access and use the platform
            for educational purposes only. You agree not to misuse, reverse-engineer, or attempt to gain
            unauthorised access to any part of the platform.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--foreground)]">3. User Accounts</h2>
          <p className="mt-2">
            You are responsible for maintaining the confidentiality of your account credentials and for all
            activities that occur under your account. Notify us immediately of any unauthorised use at{" "}
            <a href="mailto:info@skillship.in" className="text-primary hover:underline">info@skillship.in</a>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--foreground)]">4. Intellectual Property</h2>
          <p className="mt-2">
            All content on the Skillship platform — including quizzes, reports, analytics, and AI outputs — is
            owned by or licensed to Skillship Edutech. Unauthorised reproduction or distribution is prohibited.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--foreground)]">5. Limitation of Liability</h2>
          <p className="mt-2">
            Skillship is provided on an "as is" basis. We make no warranties, expressed or implied, and shall not
            be liable for any indirect, incidental, or consequential damages arising from your use of the platform.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--foreground)]">6. Changes to Terms</h2>
          <p className="mt-2">
            We reserve the right to update these terms at any time. We will notify registered institutions of
            material changes. Continued use of the platform after changes constitutes acceptance of the revised
            terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--foreground)]">7. Contact</h2>
          <p className="mt-2">
            For questions about these terms, contact us at{" "}
            <a href="mailto:info@skillship.in" className="text-primary hover:underline">info@skillship.in</a> or
            call +91 93684 08577.
          </p>
        </section>
      </div>

      <div className="mt-12 flex items-center gap-4">
        <Link href="/" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
          ← Back to home
        </Link>
        <Link href="/privacy" className="text-sm text-[var(--muted-foreground)] hover:text-primary">
          Privacy Policy
        </Link>
      </div>
    </main>
  );
}
