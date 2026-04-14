"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";

type TabKey = "organization" | "branding" | "security" | "integrations" | "notifications";

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "organization",
    label: "Organization",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /></svg>
    ),
  },
  {
    key: "branding",
    label: "Branding",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" /><circle cx="17.5" cy="10.5" r=".5" /><circle cx="8.5" cy="7.5" r=".5" /><circle cx="6.5" cy="12.5" r=".5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.97-4.48-9-10-9z" /></svg>
    ),
  },
  {
    key: "security",
    label: "Security",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    ),
  },
  {
    key: "integrations",
    label: "Integrations",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 3v4M8 3v4" /></svg>
    ),
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
    ),
  },
];

export default function SettingsPage() {
  const [active, setActive] = useState<TabKey>("organization");

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Platform configuration, branding, security and integrations" />

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Sidebar tabs */}
        <motion.nav
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="rounded-2xl border border-[var(--border)] bg-white p-2"
        >
          <ul className="space-y-0.5">
            {tabs.map((t) => {
              const isActive = active === t.key;
              return (
                <li key={t.key}>
                  <button
                    onClick={() => setActive(t.key)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-primary to-accent text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.6)]"
                        : "text-[var(--muted-foreground)] hover:bg-primary/5 hover:text-primary"
                    }`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isActive ? "text-white" : "text-[var(--muted-foreground)]"}`}>
                      {t.icon}
                    </span>
                    {t.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.nav>

        {/* Panel */}
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-5"
        >
          {active === "organization" && <OrgPanel />}
          {active === "branding" && <BrandingPanel />}
          {active === "security" && <SecurityPanel />}
          {active === "integrations" && <IntegrationsPanel />}
          {active === "notifications" && <NotificationsPanel />}
        </motion.div>
      </div>
    </div>
  );
}

function PanelCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 md:p-6">
      <div>
        <h3 className="text-base font-bold tracking-tight text-[var(--foreground)]">{title}</h3>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{description}</p>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs font-semibold text-[var(--muted-foreground)]">{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
    />
  );
}

function Toggle({ on, label, description }: { on: boolean; label: string; description: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] p-4">
      <div>
        <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{description}</p>
      </div>
      <div className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full ${on ? "bg-gradient-to-r from-primary to-accent" : "bg-slate-200"}`}>
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
    </div>
  );
}

function SaveBar() {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      <button className="h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary">
        Cancel
      </button>
      <button className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5">
        Save changes
      </button>
    </div>
  );
}

function OrgPanel() {
  return (
    <>
      <PanelCard title="Organization details" description="Public-facing information shown to schools and partners">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Organization name"><Input defaultValue="Skillship Education Pvt. Ltd." /></Field>
          <Field label="Primary domain"><Input defaultValue="skillship.in" /></Field>
          <Field label="Support email"><Input defaultValue="support@skillship.in" /></Field>
          <Field label="Support phone"><Input defaultValue="+91 98765 43210" /></Field>
          <Field label="Registered address">
            <Input defaultValue="HSR Layout, Bengaluru, Karnataka 560102" />
          </Field>
          <Field label="GSTIN"><Input defaultValue="29ABCDE1234F1Z5" /></Field>
        </div>
        <SaveBar />
      </PanelCard>
    </>
  );
}

function BrandingPanel() {
  return (
    <>
      <PanelCard title="Logo and identity" description="Assets used across dashboards and public pages">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Logo (PNG, SVG)">
            <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/40 text-xs text-[var(--muted-foreground)]">
              Drag and drop or click to upload
            </div>
          </Field>
          <Field label="Favicon (32x32)">
            <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/40 text-xs text-[var(--muted-foreground)]">
              Drag and drop
            </div>
          </Field>
        </div>
        <Field label="Primary color">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-primary" />
            <Input defaultValue="#059669" className="max-w-[180px]" />
          </div>
        </Field>
        <SaveBar />
      </PanelCard>
    </>
  );
}

function SecurityPanel() {
  return (
    <>
      <PanelCard title="Authentication" description="Control how admins and users sign in">
        <Toggle on={true} label="Enforce 2FA for admins" description="Super admins and sub-admins must verify with an authenticator app." />
        <Toggle on={false} label="Allow SSO (Google Workspace)" description="Schools with Google domains can sign in with their school account." />
        <Toggle on={true} label="Session timeout after 30 min idle" description="Users are logged out automatically after inactivity." />
      </PanelCard>

      <PanelCard title="Access control" description="IP restrictions and audit logs">
        <Field label="Allowed admin IP ranges (CIDR)">
          <Input placeholder="e.g., 10.0.0.0/24, 192.168.1.0/24" />
        </Field>
        <Toggle on={true} label="Retain audit logs for 1 year" description="Meets DPDP compliance for Indian educational data." />
        <SaveBar />
      </PanelCard>
    </>
  );
}

function IntegrationsPanel() {
  const items = [
    { name: "Razorpay", description: "Payment gateway for workshop bookings", connected: true },
    { name: "Google Classroom", description: "Sync rosters and grade passback", connected: true },
    { name: "Slack", description: "Alerts and daily digests to admin channel", connected: false },
    { name: "Zoho CRM", description: "Lead and partnership sync", connected: false },
    { name: "Zoom", description: "Live workshop delivery and recording", connected: true },
  ];
  return (
    <PanelCard title="Connected services" description="Manage third-party integrations used by Skillship">
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.name} className="flex items-center justify-between rounded-xl border border-[var(--border)] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                {it.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{it.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{it.description}</p>
              </div>
            </div>
            <button className={`h-9 rounded-full px-4 text-xs font-semibold transition-colors ${
              it.connected
                ? "border border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-red-200 hover:text-red-500"
                : "bg-gradient-to-r from-primary to-accent text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.6)] hover:-translate-y-0.5"
            }`}>
              {it.connected ? "Disconnect" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function NotificationsPanel() {
  return (
    <PanelCard title="Notifications" description="Control the channels and frequency of system alerts">
      <Toggle on={true} label="New school onboarding" description="Email when a new school completes onboarding." />
      <Toggle on={true} label="Pending quiz approvals" description="Daily digest of quizzes awaiting review." />
      <Toggle on={false} label="Weekly performance report" description="Aggregated performance sent every Monday at 9 AM IST." />
      <Toggle on={true} label="Security alerts" description="Unusual login attempts, failed 2FA and token misuse." />
      <SaveBar />
    </PanelCard>
  );
}
