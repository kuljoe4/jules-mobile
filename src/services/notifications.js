// ─── Browser Notifications ───────────────────────────────────────────────────
function loadNotify() { return SafeStorage.loadNotify(); }
function saveNotify(v) { SafeStorage.saveNotify(v); }

function requestNotificationPermission() {
  if (!("Notification" in window)) return Promise.resolve(false);
  if (Notification.permission === "granted") return Promise.resolve(true);
  return Notification.requestPermission().then(p => p === "granted");
}

async function sendNotification(title, body, tag) {
  if (!loadNotify() || !("Notification" in window) || Notification.permission !== "granted") return;
  const icon = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%2307090c%22/><text y=%22.9em%22 x=%2250%25%22 font-size=%2270%22 text-anchor=%22middle%22 fill=%22%2306b6d4%22 font-family=%22monospace%22 font-weight=%22900%22>J</text></svg>";

  // Try SW notification first (more robust in mobile/background)
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, { body, tag, icon });
        return;
      }
    } catch (e) { console.warn("[Notify] SW notification failed, falling back", e); }
  }

  // Fallback to standard Notification constructor
  try {
    new Notification(title, { body, tag, icon });
  } catch (e) {
    console.error("[Notify] Notification constructor failed", e);
  }
}
