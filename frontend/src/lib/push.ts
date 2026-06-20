/*
 * File:    frontend/src/lib/push.ts
 * Purpose: Browser Web Push helpers — register the service worker, subscribe /
 *          unsubscribe the current browser, and report permission state. The
 *          VAPID public key comes from the backend so there's one source of
 *          truth. All free (Web Push + VAPID, no third-party service).
 * Owner:   Pranav
 */

import { API_BASE, getToken } from "@/lib/auth";

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function permissionState(): NotificationPermission | "unsupported" {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registerSW(): Promise<ServiceWorkerRegistration> {
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  return reg;
}

async function authed(path: string, body: unknown): Promise<Response> {
  const token = await getToken();
  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
}

/** Ask permission, subscribe this browser, and register it with the backend. */
export async function enablePush(): Promise<{ ok: boolean; reason?: string }> {
  if (!pushSupported()) return { ok: false, reason: "This browser doesn't support push notifications." };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, reason: "Notifications are blocked. Allow them in your browser to get alerts." };
  }

  const token = await getToken();
  if (!token) return { ok: false, reason: "Session expired." };

  const keyRes = await fetch(`${API_BASE}/notifications/push/public-key/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!keyRes.ok) return { ok: false, reason: "Couldn't reach the server." };
  const { public_key: publicKey } = await keyRes.json();
  if (!publicKey) return { ok: false, reason: "Push isn't configured on the server yet." };

  const reg = await registerSW();
  const existing = await reg.pushManager.getSubscription();
  const subscription =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // Cast: lib.dom types the key as BufferSource; our Uint8Array satisfies it.
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    }));

  const res = await authed("/notifications/push/subscribe/", subscription.toJSON());
  if (!res.ok) return { ok: false, reason: "Couldn't save your subscription." };
  return { ok: true };
}

/** Unsubscribe this browser and tell the backend to forget it. */
export async function disablePush(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await authed("/notifications/push/unsubscribe/", { endpoint: sub.endpoint }).catch(() => {});
    await sub.unsubscribe().catch(() => {});
  }
}

/** True when this browser already has an active push subscription. */
export async function isSubscribed(): Promise<boolean> {
  if (!pushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return !!sub;
}
