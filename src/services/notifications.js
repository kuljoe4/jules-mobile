import { SafeStorage } from './storage.js';
import { sanitizeErrorMessage } from './api.js';

// ─── Browser Notifications ───────────────────────────────────────────────────
function loadNotify() { return SafeStorage.loadNotify(); }
function saveNotify(v) { SafeStorage.saveNotify(v); }

export const requestNotificationPermission = async () => {
  if (typeof window === "undefined" || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try {
    return await Notification.requestPermission();
  } catch (err) {
    return 'denied';
  }
};

async function sendNotification(title, body, tag) {
  if (!loadNotify()) return;
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;

  // Security: Sanitizes notification fields (title, body, tag) to prevent control character / null-byte injection,
  // unexpected non-string payloads, and notification payload bloat.
  const cleanTitle = typeof title === "string" ? title.replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, 100) : "";
  const cleanBody = typeof body === "string" ? body.replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, 200) : "";
  const cleanTag = typeof tag === "string" ? tag.replace(/[\x00-\x1F\x7F]/g, "").replace(/\s/g, "").trim().slice(0, 100) : undefined;

  if (!cleanTitle) return;

  // Cross-tab deduplication: Check if this exact notification was sent recently (within 5 seconds)
  const dedupKey = `jac_notif_ack_${cleanTitle}_${cleanTag || ""}`;
  try {
    const lastSent = parseInt(localStorage.getItem(dedupKey) || "0", 10);
    if (Date.now() - lastSent < 5000) return; // Skip if already shown by another tab recently
    localStorage.setItem(dedupKey, Date.now().toString());
  } catch (e) {
    // Ignore storage errors, just proceed with notification
  }

  const icon = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%2307090c%22/><text y=%22.9em%22 x=%2250%25%22 font-size=%2270%22 text-anchor=%22middle%22 fill=%22%2306b6d4%22 font-family=%22monospace%22 font-weight=%22900%22>J</text></svg>";

  // Try SW notification first (more robust in mobile/background)
  if ("serviceWorker" in navigator) {
    try {
      // Race the service worker ready promise against a short timeout (800ms)
      // because if the SW is stuck waiting for a client to close, it will hang forever.
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error("SW ready timeout")), 800))
      ]);
      if (reg && reg.showNotification) {
        await reg.showNotification(cleanTitle, { body: cleanBody, tag: cleanTag, icon });
        return;
      }
    } catch (e) {
      console.warn("[Notify] SW notification failed or timed out, falling back:", sanitizeErrorMessage(e.toString()));
    }
  }

  // Fallback to standard Notification constructor
  try {
    new Notification(cleanTitle, { body: cleanBody, tag: cleanTag, icon });
  } catch (e) {
    console.error("[Notify] Notification constructor failed", sanitizeErrorMessage(e.toString()));
  }
}

export { sendNotification };
