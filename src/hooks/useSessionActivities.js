import { useState, useRef, useCallback } from 'react';
import { apiCall } from '../services/api.js';
import { SafeStorage } from '../services/storage.js';
import { getActivitiesSize, getApproxBytes, fastDeepEqual } from '../utils/performance.js';
import { isValidSessionId } from '../utils/validation.js';
import { parseDateMs } from '../utils/date.js';

// Helper for generating deterministic map keys to correctly deduplicate incoming
// activities with locally optimistically created temp objects.
export const getActivityKey = (act) => {
  if (!act) return "";
  if (act._temp && act.id && !act.id.startsWith("temp-")) return act.id;
  if (act.id) return act.id;
  if (act._tempKey) return act._tempKey;
  const t = act.createTime || "";
  const desc = act.progressUpdated?.description || act.userMessaged?.userMessage || act.agentMessaged?.agentMessage || act.description || act.title || "";
  return `${t}-${desc.slice(0, 30)}`;
};

export const useSessionActivities = ({
  session,
  apiKey,
  busy,
  activityLimit = 1000,
  cacheLimit = 5,
  onStatsUpdate,
  isDeletedRef,
  setIsDeleted,
  setErr,
  setJustUpdated,
  initialActivities = []
}) => {
  const [isStale, setIsStale] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncPhase, setSyncProgress] = useState("IDLE");
  const [syncStats, setSyncPhaseStats] = useState({ count: 0, pages: 0, bytes: 0, newItems: 0, newBytes: 0, loaded: 0, total: 0 });

  const [activities, setActivities] = useState(initialActivities);
  const actMapRef = useRef(new Map());
  const activitiesAbortRef = useRef(null);
  const lastTsRef = useRef(null);
  const notFoundSinceRef = useRef(null);

  // Initialize map on mount if we have initial activities
  const isInitializedRef = useRef(false);
  if (!isInitializedRef.current && initialActivities.length > 0) {
    initialActivities.forEach(a => actMapRef.current.set(getActivityKey(a), a));
    isInitializedRef.current = true;
  }

  const loadActivities = useCallback(async (sinceTs = null) => {
    // Security: Validate session ID to prevent endpoint path manipulation or parameter pollution
    if (!isValidSessionId(session?.id) || isDeletedRef.current) {
      console.error("[LoadActivities] Aborting request due to invalid session ID:", session?.id);
      return;
    }
    if (activitiesAbortRef.current) {
      activitiesAbortRef.current.abort();
    }
    const controller = new AbortController();
    activitiesAbortRef.current = controller;

    setIsSyncing(true); setIsStale(true);
    setSyncProgress(sinceTs ? (busy ? "SYNC" : "FETCH") : "CACHE");
    setSyncPhaseStats({ count: 0, pages: 0, bytes: 0, newItems: 0, newBytes: 0, loaded: 0, total: 0 });
    let currentPages = 0;
    let currentCount = 0;
    let currentBytes = 0;
    let currentLoaded = 0;
    let currentTotal = 0;
    let newItems = 0;
    let newBytes = 0;

    try {
      let pageToken = null;
      let changed = false;
      let latestTs = lastTsRef.current;

      do {
        currentPages++;
        if (!sinceTs) setSyncProgress("FETCH");
        const pageSize = Math.min(activityLimit, 100);
        // The /activities API does not support createTime query parameter
        const qs = `pageSize=${pageSize}${pageToken ? "&pageToken=" + pageToken : ""}`;


        const d = await apiCall(apiKey, `/sessions/${session.id}/activities?${qs}`, {
          _label: `Acts ${sinceTs ? "Δ" : "full"} ${session.id?.slice(0, 6)}`,
          signal: controller.signal,
          onProgress: ({ loaded, total }) => {
            currentLoaded = loaded;
            currentTotal = total;
            setSyncPhaseStats(prev => ({ ...prev, loaded: currentLoaded, total: currentTotal }));
          }
        });

        if (activitiesAbortRef.current !== controller) return;

        const incoming = d.activities || [];
        const batchBytes = getActivitiesSize(incoming);

        currentCount += incoming.length;
        currentBytes += batchBytes;

        for (const act of incoming) {
          const k = getActivityKey(act);
          const existing = actMapRef.current.get(k);
          // Upsert: update if content changed or is new
          if (!existing || !fastDeepEqual(existing, act)) {
            const actSize = getApproxBytes(act);
            newItems++;
            newBytes += actSize;
            actMapRef.current.set(k, act);
            changed = true;
            if (!latestTs || act.createTime > latestTs) latestTs = act.createTime;
          }
        }
        setSyncPhaseStats({ count: currentCount, pages: currentPages, bytes: currentBytes, newItems, newBytes, loaded: currentLoaded, total: currentTotal });

        pageToken = d.nextPageToken;

        // Respect activityLimit
        if (actMapRef.current.size >= activityLimit) {
          pageToken = null;
        }

        // On incremental loads (sinceTs), we don't need to follow tokens as new
        // activities are added to the end of the history.
        if (sinceTs) break;

      } while (pageToken);

      if (activitiesAbortRef.current !== controller) return;

      if (latestTs) lastTsRef.current = latestTs;
      if (changed) {
        setSyncProgress("SYNC");
        let sorted = Array.from(actMapRef.current.values())
          .filter(a => !a._temp)
          .sort((a, b) => parseDateMs(a.createTime) - parseDateMs(b.createTime));

        // Enforce limit if we exceeded it during this load
        if (sorted.length > activityLimit) {
          sorted = sorted.slice(-activityLimit);
          // Sync map back
          actMapRef.current = new Map();
          sorted.forEach(a => actMapRef.current.set(getActivityKey(a), a));
        }
        setActivities(sorted);
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 3000);
        setIsStale(false);

        // Persist stats
        try {
          const size = getActivitiesSize(sorted);
          const stats = { count: sorted.length, size };
          const allStats = SafeStorage.loadActStats();
          allStats[session.id] = stats;
          SafeStorage.saveActStats(allStats);
          onStatsUpdate?.(session.id, stats);
          window.dispatchEvent(new CustomEvent("jac_stats_updated", { detail: allStats }));
        } catch (e) { console.error("Failed to save stats", e); }
      }

      // Success! Reset 404 counter
      notFoundSinceRef.current = null;

      // Update Session Cache
      if (cacheLimit > 0) {
        try {
          const cache = SafeStorage.loadSessionCache();
          cache[session.id] = { activities: Array.from(actMapRef.current.values()).filter(a => !a._temp).sort((a, b) => parseDateMs(a.createTime) - parseDateMs(b.createTime)).slice(-activityLimit), ts: Date.now() };
          // Strict LRU Strategy
          let keys = Object.keys(cache);
          if (keys.length > cacheLimit) {
            keys.sort((a, b) => (cache[a].ts || 0) - (cache[b].ts || 0));
            while (keys.length > cacheLimit) {
              delete cache[keys.shift()];
            }
          }
          SafeStorage.saveSessionCache(cache);
        } catch {}
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (err.message && err.message.includes("404")) {
        if (!notFoundSinceRef.current) {
          notFoundSinceRef.current = Date.now();
        } else if (Date.now() - notFoundSinceRef.current > 45000) { // 45 seconds tolerance
          isDeletedRef.current = true;
          setIsDeleted(true);
        }
        // Do not display raw 404 errors in the UI for recently created or transiently missing sessions
        return;
      }
      console.error("[LoadActivities] Error:", err);
      setErr(err.message);
    } finally {
      if (activitiesAbortRef.current === controller) {
        setIsSyncing(false); setIsStale(false);
        setSyncProgress("DONE");
        setTimeout(() => setSyncProgress("IDLE"), 2000);
        activitiesAbortRef.current = null;
      }
    }
  }, [apiKey, session?.id, activityLimit, cacheLimit]);

  return {
    activities,
    setActivities,
    isStale,
    setIsStale,
    isSyncing,
    syncPhase,
    syncStats,
    loadActivities,
    actMapRef,
    lastTsRef,
    notFoundSinceRef,
    activitiesAbortRef,
    getActivityKey // Expose for optimistic updates
  };
};
