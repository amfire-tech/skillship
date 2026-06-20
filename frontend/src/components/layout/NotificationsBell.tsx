/*
 * File:    frontend/src/components/layout/NotificationsBell.tsx
 * Purpose: Live notifications bell — polls the backend for the current user's
 *          alerts, shows an unread badge, marks read, and lets the user opt in
 *          to free browser push (so alerts arrive even with the tab closed).
 * Owner:   Pranav
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE, getToken } from "@/lib/auth";
import { asArray } from "@/lib/api";
import { pushSupported, permissionState, enablePush, isSubscribed } from "@/lib/push";

interface Notif {
  id: string;
  title: string;
  body: string;
  status: string;
  created_at: string;
  data_json?: { category?: string };
}

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const InboxIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

function timeAgo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const categoryLabel: Record<string, string> = {
  PAYMENT: "Payment",
  GUIDANCE: "Guidance",
  GENERAL: "Alert",
};

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const [canPush, setCanPush] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [listRes, countRes] = await Promise.all([
        fetch(`${API_BASE}/notifications/`, { headers }),
        fetch(`${API_BASE}/notifications/unread-count/`, { headers }),
      ]);
      if (listRes.ok) setItems(asArray<Notif>(await listRes.json()).slice(0, 20));
      if (countRes.ok) setUnread((await countRes.json()).unread_count ?? 0);
    } catch {
      /* transient — keep last good state */
    }
  }, []);

  // Poll for new alerts while the bell is mounted.
  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 30000);
    return () => clearInterval(t);
  }, [fetchData]);

  // Resolve push availability once.
  useEffect(() => {
    if (!pushSupported() || permissionState() === "denied") return;
    setCanPush(true);
    isSubscribed().then(setSubscribed);
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchData();
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, fetchData]);

  async function markRead(id: string) {
    const token = await getToken();
    if (!token) return;
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, status: "READ" } : n)));
    setUnread((u) => Math.max(0, u - 1));
    await fetch(`${API_BASE}/notifications/${id}/mark-read/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }

  async function markAllRead() {
    const token = await getToken();
    if (!token) return;
    setItems((prev) => prev.map((n) => ({ ...n, status: "READ" })));
    setUnread(0);
    await fetch(`${API_BASE}/notifications/mark-all-read/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }

  async function onEnablePush() {
    setPushBusy(true);
    setPushMsg(null);
    const res = await enablePush();
    setPushBusy(false);
    if (res.ok) {
      setSubscribed(true);
      setPushMsg("Browser alerts on — you'll get notified even with this tab closed.");
    } else {
      setPushMsg(res.reason ?? "Couldn't enable browser alerts.");
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-primary"
      >
        <BellIcon />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_24px_60px_-20px_rgba(5,150,105,0.25)] dark:bg-[var(--card)]"
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--foreground)]">Notifications</p>
            {unread > 0 ? (
              <button type="button" onClick={markAllRead} className="text-[11px] font-semibold text-primary hover:underline">
                Mark all read
              </button>
            ) : (
              <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                0 new
              </span>
            )}
          </div>

          {/* Browser push opt-in */}
          {canPush && !subscribed && (
            <div className="border-b border-[var(--border)] bg-primary/5 px-4 py-2.5">
              <button type="button" onClick={onEnablePush} disabled={pushBusy}
                className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline disabled:opacity-60">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                {pushBusy ? "Enabling…" : "Enable browser alerts"}
              </button>
              {pushMsg && <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">{pushMsg}</p>}
            </div>
          )}
          {canPush && subscribed && pushMsg && (
            <div className="border-b border-[var(--border)] bg-emerald-50 px-4 py-2 text-[11px] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{pushMsg}</div>
          )}

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <InboxIcon />
              </div>
              <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">You&apos;re all caught up</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Alerts from your school admin will appear here.
              </p>
            </div>
          ) : (
            <ul className="max-h-96 divide-y divide-[var(--border)] overflow-y-auto">
              {items.map((n) => {
                const isUnread = n.status !== "READ";
                const cat = n.data_json?.category;
                return (
                  <li key={n.id}>
                    <button type="button" onClick={() => isUnread && markRead(n.id)}
                      className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--muted)]/40 ${isUnread ? "bg-primary/5" : ""}`}>
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isUnread ? "bg-primary" : "bg-transparent"}`} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] font-semibold text-[var(--foreground)]">{n.title}</span>
                          <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">{timeAgo(n.created_at)}</span>
                        </span>
                        {cat && categoryLabel[cat] && (
                          <span className="mt-0.5 inline-block rounded-full bg-[var(--muted)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{categoryLabel[cat]}</span>
                        )}
                        <span className="mt-0.5 block text-xs text-[var(--muted-foreground)] line-clamp-2">{n.body}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
