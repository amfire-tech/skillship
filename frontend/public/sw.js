/*
 * File:    frontend/public/sw.js
 * Purpose: Service worker for Web Push. Shows a browser notification when the
 *          backend pushes an alert (even with the dashboard tab closed) and
 *          focuses/open the dashboard when the user clicks it.
 * Owner:   Pranav
 */

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Skillship", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "Skillship";
  const data = payload.data || {};
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: "/logo-icon.png",
      badge: "/logo-icon.png",
      data,
      tag: data.category || "skillship-alert",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(target).catch(() => {});
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
      return undefined;
    })
  );
});
