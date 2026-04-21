"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";

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

function Toggle({ on, onToggle, label, description }: { on: boolean; onToggle: () => void; label: string; description: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-start justify-between gap-4 rounded-xl border border-[var(--border)] p-4 text-left transition-colors hover:border-primary/20"
    >
      <div>
        <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{description}</p>
      </div>
      <div className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${on ? "bg-gradient-to-r from-primary to-accent" : "bg-slate-200"}`}>
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
    </button>
  );
}

function SaveBar({ onSave, onCancel }: { onSave: () => void; onCancel?: () => void }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="h-10 rounded-full border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(5,150,105,0.5)] transition-all hover:-translate-y-0.5"
      >
        Save changes
      </button>
    </div>
  );
}

const orgDefaults = {
  name: "Skillship Edutech",
  domain: "skillship.in",
  email: "info@skillship.in",
  phone: "+91 93684 08577",
  address: "Opp. Shipgram, Tajmahal Road, Tajganj, Agra, U.P. 282006",
  gstin: "",
};

type OrgErrors = Partial<Record<keyof typeof orgDefaults, string>>;

function validateOrg(form: typeof orgDefaults): OrgErrors {
  const err: OrgErrors = {};
  if (!form.name.trim()) err.name = "Organization name is required";
  if (!form.email.trim()) err.email = "Support email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = "Enter a valid email address";
  if (!form.phone.trim()) err.phone = "Contact number is required";
  else if (!/^[+]?[\d\s\-()]{8,15}$/.test(form.phone)) err.phone = "Enter a valid phone number";
  return err;
}

function OrgPanel() {
  const toast = useToast();
  const [form, setForm] = useState(orgDefaults);
  const [errors, setErrors] = useState<OrgErrors>({});

  function set(k: keyof typeof orgDefaults) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [k]: e.target.value }));
      if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
    };
  }

  function handleSave() {
    const errs = validateOrg(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    toast("Organization settings saved", "success");
  }

  return (
    <>
      <PanelCard title="Organization details" description="Public-facing information shown to schools and partners">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Organization name">
            <input
              value={form.name}
              onChange={set("name")}
              aria-describedby={errors.name ? "org-name-err" : undefined}
              className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors focus:ring-4 ${errors.name ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-[var(--border)] focus:border-primary focus:ring-primary/10"}`}
            />
            {errors.name && <p id="org-name-err" className="text-[11px] font-medium text-red-500">{errors.name}</p>}
          </Field>
          <Field label="Primary domain"><Input value={form.domain} onChange={set("domain")} /></Field>
          <Field label="Support email">
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              aria-describedby={errors.email ? "org-email-err" : undefined}
              className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors focus:ring-4 ${errors.email ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-[var(--border)] focus:border-primary focus:ring-primary/10"}`}
            />
            {errors.email && <p id="org-email-err" className="text-[11px] font-medium text-red-500">{errors.email}</p>}
          </Field>
          <Field label="Support phone">
            <input
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              aria-describedby={errors.phone ? "org-phone-err" : undefined}
              className={`h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition-colors focus:ring-4 ${errors.phone ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-[var(--border)] focus:border-primary focus:ring-primary/10"}`}
            />
            {errors.phone && <p id="org-phone-err" className="text-[11px] font-medium text-red-500">{errors.phone}</p>}
          </Field>
          <Field label="Registered address">
            <Input value={form.address} onChange={set("address")} />
          </Field>
          <Field label="GSTIN"><Input value={form.gstin} onChange={set("gstin")} placeholder="Enter GSTIN" /></Field>
        </div>
        <SaveBar
          onSave={handleSave}
          onCancel={() => { setForm(orgDefaults); setErrors({}); toast("Changes discarded", "info"); }}
        />
      </PanelCard>
    </>
  );
}

interface FileInfo { name: string; size: string; preview: string }

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];
const MAX_SIZE = 2 * 1024 * 1024;

function FileUploadField({ label, id, onFile, file }: { label: string; id: string; onFile: (f: FileInfo | null) => void; file: FileInfo | null }) {
  const toast = useToast();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast("Only PNG, JPG, SVG files allowed", "error");
      e.target.value = "";
      return;
    }
    if (f.size > MAX_SIZE) {
      toast("File must be under 2 MB", "error");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onFile({ name: f.name, size: `${(f.size / 1024).toFixed(1)} KB`, preview: reader.result as string });
    };
    reader.readAsDataURL(f);
  }

  return (
    <Field label={label}>
      <label htmlFor={id} className="relative flex h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/40 text-xs text-[var(--muted-foreground)] transition-colors hover:border-primary/30 hover:text-primary overflow-hidden">
        {file?.preview ? (
          <img src={file.preview} alt="preview" className="absolute inset-0 h-full w-full object-contain p-2" />
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            <span>Click to upload</span>
          </>
        )}
        <input id={id} type="file" accept=".png,.jpg,.jpeg,.svg" className="sr-only" onChange={handleChange} />
      </label>
      {file && (
        <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-1.5 text-[11px]">
          <span className="font-medium text-[var(--foreground)] truncate max-w-[180px]">{file.name}</span>
          <span className="text-[var(--muted-foreground)] shrink-0 ml-2">{file.size}</span>
          <button type="button" onClick={() => onFile(null)} className="ml-3 text-[var(--muted-foreground)] hover:text-red-500 shrink-0">✕</button>
        </div>
      )}
    </Field>
  );
}

function BrandingPanel() {
  const toast = useToast();
  const [logo, setLogo] = useState<FileInfo | null>(null);
  const [favicon, setFavicon] = useState<FileInfo | null>(null);

  return (
    <>
      <PanelCard title="Logo and identity" description="Assets used across dashboards and public pages. PNG, JPG, SVG only — max 2 MB.">
        <div className="grid gap-4 md:grid-cols-2">
          <FileUploadField label="Logo (PNG / SVG)" id="branding-logo" file={logo} onFile={setLogo} />
          <FileUploadField label="Favicon (32×32 PNG)" id="branding-favicon" file={favicon} onFile={setFavicon} />
        </div>
        <Field label="Primary color">
          <div className="flex items-center gap-2">
            <input type="color" defaultValue="#059669" className="h-8 w-8 cursor-pointer rounded-lg border border-[var(--border)] bg-transparent p-0.5" />
            <Input defaultValue="#059669" className="max-w-[180px]" />
          </div>
        </Field>
        <SaveBar
          onSave={() => toast("Branding settings saved", "success")}
          onCancel={() => { setLogo(null); setFavicon(null); toast("Changes discarded", "info"); }}
        />
      </PanelCard>
    </>
  );
}

const securityDefaults = { enforce2FA: true, sso: false, sessionTimeout: true, auditLogs: true };

function SecurityPanel() {
  const toast = useToast();
  const [enforce2FA, setEnforce2FA] = useState(securityDefaults.enforce2FA);
  const [sso, setSSO] = useState(securityDefaults.sso);
  const [sessionTimeout, setSessionTimeout] = useState(securityDefaults.sessionTimeout);
  const [auditLogs, setAuditLogs] = useState(securityDefaults.auditLogs);

  return (
    <>
      <PanelCard title="Authentication" description="Control how admins and users sign in">
        <Toggle on={enforce2FA} onToggle={() => setEnforce2FA((v) => !v)} label="Enforce 2FA for admins" description="Super admins and sub-admins must verify with an authenticator app." />
        <Toggle on={sso} onToggle={() => setSSO((v) => !v)} label="Allow SSO (Google Workspace)" description="Schools with Google domains can sign in with their school account." />
        <Toggle on={sessionTimeout} onToggle={() => setSessionTimeout((v) => !v)} label="Session timeout after 30 min idle" description="Users are logged out automatically after inactivity." />
      </PanelCard>

      <PanelCard title="Access control" description="IP restrictions and audit logs">
        <Field label="Allowed admin IP ranges (CIDR)">
          <Input placeholder="e.g., 10.0.0.0/24, 192.168.1.0/24" />
        </Field>
        <Toggle on={auditLogs} onToggle={() => setAuditLogs((v) => !v)} label="Retain audit logs for 1 year" description="Meets DPDP compliance for Indian educational data." />
        <SaveBar
          onSave={() => toast("Security settings saved", "success")}
          onCancel={() => {
            setEnforce2FA(securityDefaults.enforce2FA);
            setSSO(securityDefaults.sso);
            setSessionTimeout(securityDefaults.sessionTimeout);
            setAuditLogs(securityDefaults.auditLogs);
            toast("Changes discarded", "info");
          }}
        />
      </PanelCard>
    </>
  );
}

function IntegrationsPanel() {
  const toast = useToast();
  const items = [
    { name: "Razorpay", description: "Payment gateway for workshop bookings", connected: true },
    { name: "Google Classroom", description: "Sync rosters and grade passback", connected: true },
    { name: "Slack", description: "Alerts and daily digests to admin channel", connected: false },
    { name: "Zoho CRM", description: "Lead and partnership sync", connected: false },
    { name: "Zoom", description: "Live workshop delivery and recording", connected: true },
  ];
  const [connected, setConnected] = useState(items.map((it) => it.connected));
  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null);

  function handleToggle(i: number) {
    if (connected[i]) {
      // Disconnecting is destructive — confirm first
      setConfirmDisconnect(items[i].name);
    } else {
      setConnected((prev) => prev.map((c, idx) => (idx === i ? true : c)));
      toast(`${items[i].name} connected`, "success");
    }
  }

  function confirmDoDisconnect() {
    const i = items.findIndex((it) => it.name === confirmDisconnect);
    if (i >= 0) {
      setConnected((prev) => prev.map((c, idx) => (idx === i ? false : c)));
      toast(`${confirmDisconnect} disconnected`, "info");
    }
    setConfirmDisconnect(null);
  }

  return (
    <>
    <PanelCard title="Connected services" description="Manage third-party integrations used by Skillship">
      <div className="space-y-3">
        {items.map((it, i) => (
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
            <button
              onClick={() => handleToggle(i)}
              className={`h-9 rounded-full px-4 text-xs font-semibold transition-all ${
                connected[i]
                  ? "border border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-red-200 hover:text-red-500"
                  : "bg-gradient-to-r from-primary to-accent text-white shadow-[0_8px_20px_-10px_rgba(5,150,105,0.6)] hover:-translate-y-0.5"
              }`}
            >
              {connected[i] ? "Disconnect" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </PanelCard>

    {/* Disconnect confirmation dialog */}
    <AnimatePresence>
      {confirmDisconnect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="disconnect-dialog-title"
            aria-describedby="disconnect-dialog-desc"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 3v4M8 3v4" />
              </svg>
            </div>
            <h3 id="disconnect-dialog-title" className="mt-4 text-base font-bold text-[var(--foreground)]">Disconnect {confirmDisconnect}?</h3>
            <p id="disconnect-dialog-desc" className="mt-1.5 text-sm text-[var(--muted-foreground)]">
              Disconnecting <span className="font-semibold text-[var(--foreground)]">{confirmDisconnect}</span> will stop all syncs and data flow immediately. You can reconnect later.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={() => setConfirmDisconnect(null)}
                className="flex-1 h-10 rounded-full border border-[var(--border)] bg-white text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-primary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDoDisconnect}
                className="flex-1 h-10 rounded-full bg-red-500 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-red-600"
              >
                Disconnect
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

const notifDefaults = { onboarding: true, quizDigest: true, weeklyReport: false, securityAlerts: true };

function NotificationsPanel() {
  const toast = useToast();
  const [onboarding, setOnboarding] = useState(notifDefaults.onboarding);
  const [quizDigest, setQuizDigest] = useState(notifDefaults.quizDigest);
  const [weeklyReport, setWeeklyReport] = useState(notifDefaults.weeklyReport);
  const [securityAlerts, setSecurityAlerts] = useState(notifDefaults.securityAlerts);

  return (
    <PanelCard title="Notifications" description="Control the channels and frequency of system alerts">
      <Toggle on={onboarding} onToggle={() => setOnboarding((v) => !v)} label="New school onboarding" description="Email when a new school completes onboarding." />
      <Toggle on={quizDigest} onToggle={() => setQuizDigest((v) => !v)} label="Pending quiz approvals" description="Daily digest of quizzes awaiting review." />
      <Toggle on={weeklyReport} onToggle={() => setWeeklyReport((v) => !v)} label="Weekly performance report" description="Aggregated performance sent every Monday at 9 AM IST." />
      <Toggle on={securityAlerts} onToggle={() => setSecurityAlerts((v) => !v)} label="Security alerts" description="Unusual login attempts, failed 2FA and token misuse." />
      <SaveBar
        onSave={() => toast("Notification preferences saved", "success")}
        onCancel={() => {
          setOnboarding(notifDefaults.onboarding);
          setQuizDigest(notifDefaults.quizDigest);
          setWeeklyReport(notifDefaults.weeklyReport);
          setSecurityAlerts(notifDefaults.securityAlerts);
          toast("Changes discarded", "info");
        }}
      />
    </PanelCard>
  );
}
