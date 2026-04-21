"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

const STUB = {
  name: "Dr. Anjali Mehta", email: "anjali.mehta@dps.in",
  role: "principal", school: "Delhi Public School, Noida",
  phone: "+91 98765 43210", joinedAt: "March 12, 2025", status: "Active",
  lastLogin: "2 hours ago",
};

const roleColors: Record<string, string> = {
  admin: "bg-violet-100 text-violet-700",
  subadmin: "bg-amber-100 text-amber-700",
  principal: "bg-teal-100 text-teal-700",
  teacher: "bg-primary/10 text-primary",
  student: "bg-blue-100 text-blue-700",
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
    <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{value || "—"}</p>
  </div>
);

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState({ ...STUB });
  const [editing, setEditing] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);

  function save() {
    // TODO: PATCH /api/v1/users/{id}/
    toast("User updated", "success");
    setEditing(false);
  }

  function toggleSuspend() {
    const next = user.status === "Active" ? "Suspended" : "Active";
    setUser((u) => ({ ...u, status: next }));
    setSuspendOpen(false);
    toast(`User ${next === "Suspended" ? "suspended" : "reactivated"}`, next === "Suspended" ? "info" : "success");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:text-primary transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">{user.name}</h1>
          <p className="text-xs text-[var(--muted-foreground)]">User ID: {id} · <Link href="/dashboard/admin/users" className="text-primary hover:underline">All Users</Link></p>
        </div>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={() => setSuspendOpen(true)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${user.status === "Active" ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-700 hover:bg-green-50"}`}>
            {user.status === "Active" ? "Suspend" : "Reactivate"}
          </button>
          {editing ? (
            <>
              <button type="button" onClick={() => setEditing(false)}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]">Cancel</button>
              <button type="button" onClick={save}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">Save</button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">Edit</button>
          )}
        </div>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-xl font-bold text-white">
            {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <p className="font-bold text-[var(--foreground)]">{user.name}</p>
            <div className="mt-1 flex gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${roleColors[user.role] ?? "bg-gray-100 text-gray-600"}`}>
                {user.role}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${user.status === "Active" ? "bg-primary/10 text-primary" : "bg-red-100 text-red-600"}`}>
                {user.status}
              </span>
            </div>
          </div>
        </div>

        {editing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {(["name","email","phone","school"] as const).map((k) => (
              <div key={k} className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{k}</label>
                <input value={user[k]} onChange={(e) => setUser((u) => ({ ...u, [k]: e.target.value }))}
                  className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Email" value={user.email} />
            <Field label="Phone" value={user.phone} />
            <Field label="School" value={user.school} />
            <Field label="Joined" value={user.joinedAt} />
            <Field label="Last Login" value={user.lastLogin} />
          </div>
        )}
      </div>

      {/* Suspend confirm dialog */}
      {suspendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-[var(--foreground)]">
              {user.status === "Active" ? "Suspend user?" : "Reactivate user?"}
            </h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {user.status === "Active"
                ? `${user.name} will lose access immediately.`
                : `${user.name} will regain access immediately.`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setSuspendOpen(false)}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]">Cancel</button>
              <button type="button" onClick={toggleSuspend}
                className={`rounded-xl px-4 py-2 text-sm font-medium text-white ${user.status === "Active" ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:opacity-90"}`}>
                {user.status === "Active" ? "Suspend" : "Reactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
