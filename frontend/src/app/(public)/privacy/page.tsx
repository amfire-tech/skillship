import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Skillship",
  description: "How Skillship collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Privacy Policy</h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">Last updated: April 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-[var(--muted-foreground)]">
        <section>
          <h2 className="text-base font-bold text-[var(--foreground)]">1. Information We Collect</h2>
          <p className="mt-2">
            We collect information you provide directly — such as school name, principal details, contact
            information, and student enrolment data — as well as usage data generated automatically when you
            interact with the platform.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--foreground)]">2. How We Use Your Information</h2>
          <p className="mt-2">
            We use your data to provide and improve the Skillship platform, generate analytics and performance
            reports, send service notifications, and comply with legal obligations under the Digital Personal Data
            Protection (DPDP) Act, 2023.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--foreground)]">3. Data Sharing</h2>
          <p className="mt-2">
            We do not sell or share your personal data with third parties for marketing purposes. We may share
            data with trusted service providers (payment processors, cloud infrastructure) under strict data
            processing agreements.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--foreground)]">4. Student Data</h2>
          <p className="mt-2">
            Student data is collected and processed on behalf of registered institutions. We act as a data
            processor under applicable laws. Institutions are responsible for obtaining appropriate consent from
            students and parents.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--foreground)]">5. Data Retention</h2>
          <p className="mt-2">
            We retain data for as long as your institution's account is active, or as required by law. You may
            request deletion of your data by contacting our support team. Audit logs are retained for 1 year in
            compliance with DPDP regulations.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--foreground)]">6. Security</h2>
          <p className="mt-2">
            We implement industry-standard security measures including encryption in transit and at rest, role-based
            access controls, and regular security audits. No system is 100% secure — please report vulnerabilities
            to{" "}
            <a href="mailto:info@skillship.in" className="text-primary hover:underline">info@skillship.in</a>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--foreground)]">7. Your Rights</h2>
          <p className="mt-2">
            You have the right to access, correct, or request deletion of your personal data. To exercise these
            rights, contact us at{" "}
            <a href="mailto:info@skillship.in" className="text-primary hover:underline">info@skillship.in</a>.
            We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-[var(--foreground)]">8. Changes to This Policy</h2>
          <p className="mt-2">
            We may update this Privacy Policy periodically. We will notify registered institutions of material
            changes via email. Continued use of the platform constitutes acceptance of the updated policy.
          </p>
        </section>
      </div>

      <div className="mt-12 flex items-center gap-4">
        <Link href="/" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
          ← Back to home
        </Link>
        <Link href="/terms" className="text-sm text-[var(--muted-foreground)] hover:text-primary">
          Terms of Service
        </Link>
      </div>
    </main>
  );
}
