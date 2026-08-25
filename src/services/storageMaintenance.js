// ─── Daily session counter ────────────────────────────────────────────────────


async function clearCacheOnly() {
  if (!confirm("Clear Service Worker cache? This will redownload all assets on next load.")) return;
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    alert("Cache cleared.");
  } catch (err) { alert("Error: " + err.message); }
}

async function clearDataOnly() {
  if (!confirm("Clear all settings, keys, and session data? You will be logged out.")) return;
  localStorage.clear();
  sessionStorage.clear();
  location.reload();
}

async function resetApp() {
  if (!confirm("FULL RESET: Clear all local data, settings, and cache?")) return;
  try {
    localStorage.clear();
    sessionStorage.clear();
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    location.reload(true);
  } catch (err) {
    alert("Error: " + err.message);
    location.reload();
  }
}

async function getStorageInfo() {
  let used = 0, quota = 0, cache = 0, local = 0;

  // 1. LocalStorage Estimation
  try {
    let str = "";
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      str += k + localStorage.getItem(k);
    }
    local = str.length * 2; // UTF-16 characters are 2 bytes
  } catch (err) { console.warn("[Storage] LocalStorage estimate failed", err); }

  // 2. Navigator Storage API
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      used = est.usage || 0;
      quota = est.quota || 0;
      if (est.usageDetails && est.usageDetails.caches) {
        cache = est.usageDetails.caches;
      }
    }
  } catch (err) { console.warn("[Storage] Estimate API failed", err); }

  // 3. Manual Cache Fallback (for browsers without usageDetails)
  if (cache === 0 && "caches" in window) {
    try {
      const keys = await caches.keys();
      for (const key of keys) {
        const c = await caches.open(key);
        const reqs = await c.keys();
        for (const r of reqs) {
          const res = await c.match(r);
          if (res) {
            const cl = res.headers.get("content-length");
            if (cl) cache += parseInt(cl, 10);
            // Note: Opaque responses will have 0 content-length and cannot be measured here.
          }
        }
      }
    } catch (err) { console.warn("[Storage] Manual cache scan failed", err); }
  }

  // Final adjusted total (API used often doesn't include localStorage)
  const totalUsed = Math.max(used, cache) + local;

  return { used: totalUsed, quota, cache, local };
}
