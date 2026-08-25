const useQuotaTracker = (sessions, plan) => {
  const [sessionRegistry, setSessionRegistry] = useState(() => {
    try {
      const reg = SafeStorage.loadSessionRegistry();
      // Prune old entries on load (older than 48h)
      const now = Date.now();
      const cutoff = now - 48 * 3600000;
      const pruned = {};
      Object.entries(reg).forEach(([id, time]) => {
        if (parseDateMs(time) > cutoff) pruned[id] = time;
      });
      return pruned;
    } catch { return {}; }
  });

  useEffect(() => {
    SafeStorage.saveSessionRegistry(sessionRegistry);
  }, [sessionRegistry]);

  const registerSessions = useCallback((incoming) => {
    if (incoming.length > 0) {
      setSessionRegistry(prev => {
        const next = { ...prev };
        let changed = false;
        incoming.forEach(s => {
          if (!next[s.id]) {
            next[s.id] = s.createTime;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, []);

  const registerSession = useCallback((s) => {
    setSessionRegistry(prev => ({ ...prev, [s.id]: s.createTime }));
  }, []);

  const todayCount = useMemo(() => {
    // Rolling 24h Window Logic using SessionRegistry for accuracy
    const now = Date.now();
    const windowStart = now - 24 * 3600000;

    const allKnown = Object.entries(sessionRegistry).map(([id, time]) => ({
      id, ts: parseDateMs(time)
    })).filter(s => s.ts >= windowStart);

    allKnown.sort((a, b) => a.ts - b.ts);

    let resetIn = "24h 0m";
    let nextResetTs = null;
    const upcomingResets = [];
    const recentResets = [];

    if (allKnown.length > 0) {
      nextResetTs = allKnown[0].ts + 24 * 3600000;
      const msLeft = nextResetTs - now;
      const h = Math.floor(msLeft / 3600000);
      const m = Math.floor((msLeft % 3600000) / 60000);
      resetIn = `${h}h ${m}m`;

      allKnown.slice(0, 4).forEach(s => {
        const rTs = s.ts + 24 * 3600000;
        const diff = rTs - now;
        upcomingResets.push({
          ts: rTs,
          in: `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`
        });
      });
    }

    // ── Find the last 2 resets that happened ───────────────────────────
    const windowEnd = now - 24 * 3600000;
    const recentlyDone = Object.entries(sessionRegistry)
      .map(([id, time]) => ({ id, ts: parseDateMs(time) }))
      .filter(s => s.ts < windowEnd)
      .sort((a, b) => b.ts - a.ts); // sort descending (newest reset first)

    recentlyDone.slice(0, 2).forEach(s => {
      const resetTs = s.ts + 24 * 3600000;
      recentResets.push({ ts: resetTs, ago: fmtAgo(resetTs) });
    });

    const windowIds = new Set(allKnown.map(s => s.id));
    // OPTIMIZATION (Bolt): Pre-index PR status for sessions in the 24h window in a single pass
    // to avoid redundant getPR property scanning during quota filter evaluations.
    let prCreated = 0;
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      const sid = s.id || s.name;
      if (sid && windowIds.has(sid) && getPR(s)) {
        prCreated++;
      }
    }

    // Sort upcoming by ts
    upcomingResets.sort((a, b) => a.ts - b.ts);

    return { total: allKnown.length, done: prCreated, resetIn, nextResetTs, upcomingResets, recentResets };
  }, [sessions, sessionRegistry, plan?.daily]);

  return { todayCount, registerSession, registerSessions };
};

// ─── App Settings hook ────────────────────────────────────────────────────────
/**
 * useAppSettings
 *
 * Custom hook that encapsulates all application settings state, their synchronization
 * with browser storage (SafeStorage), and computed plan configurations.
 * This decouples settings management from the main JulesClient component.
 */
