import { sanitizeErrorMessage } from "../services/api.js";
import { isValidSessionId } from "../utils/validation.js";

function JulesClient() {
  const [apiKey,setApiKey]     = useState(() => SafeStorage.loadApiKey());
  const [githubToken,setGithubToken] = useState(() => SafeStorage.loadGithubToken());
  const [ghRateLimitedReset, setGhRateLimitedReset] = useState(null);

  const [sessions,setSessions] = useState(() => SafeStorage.loadSessionsList());
  const sessionsRef = useRef(sessions);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);
  const lastStates = useRef(new Map()); // id -> state
  const lastCreatedSessionIdRef = useRef(null);
  const [activitiesMap, setActivitiesMap] = useState(() => SafeStorage.loadActivitiesMap());
  const [activityStatsMap, setActivityStatsMap] = useState(() => SafeStorage.loadActStats());
  const [selected,setSelected] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isDesktop = useIsDesktop();

  const {
    mobileDrawerOpen,
    setMobileDrawerOpen,
    drawerClosing,
    mobileScreen,
    desktopView,
    setDesktop,
    setMobile,
    closeMobileDrawer,
    openMobileDrawer
  } = useNavigation();

  const [justRefreshed, setJustRefreshed] = useState(false);
  const [supplementalSessions, setSupplementalSessions] = useState([]);
  // OPTIMIZATION (Bolt): Direct O(N) loop iteration over primary and supplemental sessions
  // to populate map without temporary intermediate array spread `[...sessions, ...supplementalSessions]` allocations.
  const allSessions = useMemo(() => {
    const map = new Map();
    const len1 = sessions.length;
    const len2 = supplementalSessions.length;
    for (let i = 0; i < len1; i++) {
      const s = sessions[i];
      if (s) map.set(s.id || s.name, s);
    }
    for (let i = 0; i < len2; i++) {
      const s = supplementalSessions[i];
      if (s) map.set(s.id || s.name, s);
    }
    return Array.from(map.values()).sort((a, b) => {
      const aIsNewest = (a.id || a.name) === lastCreatedSessionIdRef.current;
      const bIsNewest = (b.id || b.name) === lastCreatedSessionIdRef.current;
      if (aIsNewest && !bIsNewest) return -1;
      if (!aIsNewest && bIsNewest) return 1;

      if (sessionSort === "CREATETIME") {
        const aTime = parseDateMs(a.createTime);
        const bTime = parseDateMs(b.createTime);
        return bTime - aTime;
      } else {
        const aTime = parseDateMs(a.updateTime || a.createTime);
        const bTime = parseDateMs(b.updateTime || b.createTime);
        return bTime - aTime;
      }
    });
  }, [sessions, supplementalSessions, sessionSort]);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [filterResetTrigger, setFilterResetTrigger] = useState(0);

  const [draftsMap, setDraftsMap] = useState(() => SafeStorage.loadDraftsMap());

  const handleDraftChange = useCallback((id, hasDraft) => {
    setDraftsMap(prev => {
      if (prev[id] === hasDraft) return prev;
      return { ...prev, [id]: hasDraft };
    });
  }, []);

  const [refreshing,setRefreshing] = useState(false);

  const lastFetchTime = useRef(null);
  const deltaPollCountRef = useRef(0);

  const handleSessionLimitChange = useCallback(() => {
    lastFetchTime.current = null; // Force full fetch with new limit
    deltaPollCountRef.current = 0;
  }, []);

  const settings = useAppSettings({
    onSessionLimitChange: handleSessionLimitChange
  });

  const {
    pollInterval, setPollInterval,
    actPollInterval, setActPollInterval,
    activePollInterval, setActivePollInterval,
    sessionLimit, setSessionLimit,
    activityLimit, setActivityLimit,
    cacheLimit, setCacheLimit,
    notifications, setNotifications,
    planId, setPlanId,
    customDaily, setCustomDaily,
    plan
  } = settings;

  const [archivedIds, setArchivedIds] = useState(() => {
    try { return new Set(SafeStorage.loadArchived()); }
    catch { return new Set(); }
  });
  const [ignoredIds, setIgnoredIds] = useState(() => {
    try { return new Set(SafeStorage.loadIgnored()); }
    catch { return new Set(); }
  });
  const [showArchived, setShowArchived] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [repoFilter, setRepoFilterState] = useState(() => SafeStorage.loadRepoFilter());
  const setRepoFilter = useCallback((val) => {
    setRepoFilterState(val);
    SafeStorage.saveRepoFilter(val);
  }, []);
  const [sessionSort, setSessionSortState] = useState(() => SafeStorage.loadSessionSort());
  const setSessionSort = useCallback((val) => {
    setSessionSortState(val);
    SafeStorage.saveSessionSort(val);
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [globalErr, setGlobalErr] = useState(null);
  const sessionsAbortRef = useRef(null);
  const [personas, setPersonas] = useState(loadPersonas);
  const [readMap, setReadMap] = useState(() => {
    try { return SafeStorage.loadReadMap(); }
    catch { return {}; }
  });


  const { todayCount, registerSession, registerSessions } = useQuotaTracker(sessions, plan);

  useEffect(() => {
    SafeStorage.saveSessionsList(sessions);
  }, [sessions]);

  useGlobalEventListeners({
    setApiKey,
    setArchivedIds,
    setActivityStatsMap,
    setSessions,
    setGhRateLimitedReset
  });

  useEffect(() => {
    cleanupActivityStats(allSessions.map(s => s.id));
  }, [allSessions]);

  useEffect(() => {
    SafeStorage.saveArchived(Array.from(archivedIds));
  }, [archivedIds]);

  useEffect(() => {
    SafeStorage.saveIgnored(Array.from(ignoredIds));
  }, [ignoredIds]);

  useEffect(() => {
    SafeStorage.saveReadMap(readMap);
  }, [readMap]);

  const {
    handleBulkDelete,
    handleBulkArchive,
    handleBulkUnarchive,
    handleBulkResume,
    handleBulkPause,
    handleBulkIgnore,
    handlePause,
    handleResume,
    handleArchive,
    handleUnarchive,
    handleIgnore,
    handleDelete
  } = useSessionActions({
    apiKey,
    setSessions,
    setArchivedIds,
    setIgnoredIds,
    setDraftsMap,
    selected,
    setSelected,
    setDesktop,
    setMobile,
    lastStates
  });

  const fetchSupplemental = useCallback(async (ids) => {
    if (!apiKey || ids.length === 0) return;
    try {
      // Security: Validate candidate session IDs to prevent REST API Endpoint Parameter Pollution, URL Path Manipulation, or Control Character Injection.
      const missing = ids.filter(id => isValidSessionId(id) && !sessions.some(s => s.id === id) && !supplementalSessions.some(s => s.id === id));
      if (missing.length === 0) return;

      const batchSize = 5;
      const valid = [];
      for (let i = 0; i < missing.length; i += batchSize) {
        const chunk = missing.slice(i, i + batchSize);
        const results = await Promise.all(chunk.map(id =>
          apiCall(apiKey, `/sessions/${id}`, { _label: `Supp ${id.slice(0,6)}` }).catch(() => null)
        ));
        valid.push(...results.filter(Boolean));
      }
      if (valid.length > 0) setSupplementalSessions(prev => [...prev, ...valid]);
    } catch {}
  }, [apiKey, sessions, supplementalSessions]);

  useEffect(() => {
    if (archivedIds.size > 0) fetchSupplemental(Array.from(archivedIds));
  }, [archivedIds, fetchSupplemental]);

  const fetchSessions = useCallback(async (quiet=false, forceFull=false) => {
    if (!apiKey) return;
    if (sessionsAbortRef.current) {
      sessionsAbortRef.current.abort();
    }
    const controller = new AbortController();
    sessionsAbortRef.current = controller;

    // Periodic full-sync recovery: every 10 delta polls, perform a full fetch to reconcile state
    if (!forceFull && !lastFetchTime.current) {
      deltaPollCountRef.current = 0;
    } else if (!forceFull) {
      deltaPollCountRef.current++;
    }

    const isPeriodicFull = deltaPollCountRef.current >= 10;
    if (isPeriodicFull) {
      deltaPollCountRef.current = 0;
    }

    const isFull = !lastFetchTime.current || forceFull || isPeriodicFull;
    if (!quiet) setRefreshing(true);
    try {
      let incoming = [];
      let pageToken = null;
      let iterations = 0;
      const quotaNeeded = plan.daily || 50;

      // Calculate adaptive pageSize for delta polls using sessionsRef to avoid re-triggering effect on state update
      const currentSessions = sessionsRef.current || [];
      let deltaPageSize = sessionLimit;
      // OPTIMIZATION (Bolt): Replace chained .filter().length and .filter().map() with a single O(N) loop
      // to avoid 3 separate array traversals and 3 intermediate array allocations on every fetch tick.
      let activeCount = 0;
      let localRecentCount = 0;
      const activeIdsToVerify = new Set();

      const lastFetchRefVal = lastFetchTime.current || 0;
      for (let i = 0; i < currentSessions.length; i++) {
        const s = currentSessions[i];
        const isActive = ACTIVE_STATES.has(s.state);
        if (isActive) {
          activeCount++;
          activeIdsToVerify.add(s.id || s.name);
        }
        if (!isFull && parseDateMs(s.updateTime || s.createTime) > lastFetchRefVal) {
          localRecentCount++;
        }
      }

      if (!isFull) {
        deltaPageSize = Math.min(sessionLimit, Math.max(12, localRecentCount + activeCount + 5));
      }

      const seenActiveIds = new Set();

      // Check and process queued sessions before fetching
      const queued = SafeStorage.loadQueuedSessions();
      if (queued.length > 0 && currentSessions.length > 0) {
        let processedAny = false;
        const currentCompletedIds = new Set();
        // OPTIMIZATION (Bolt): Use standard for loop to avoid callback overhead inside the render cycle.
        for (let i = 0; i < currentSessions.length; i++) {
          const s = currentSessions[i];
          if (s.state === "FAILED") {
            currentCompletedIds.add(s.id);
          } else if (s.state === "COMPLETED") {
            // getPR is available globally in the concatenated build, or imported if using modern build tools
            const pr = typeof getPR === 'function' ? getPR(s) : null;
            const isMerged = pr && pr.state === "merged";
            const noPrNeeded = !s.sourceContext?.source || (s.automationMode !== "AUTO_CREATE_PR" && !pr);
            // Either the PR is merged, or there is no PR required for this to be "done"
            if (isMerged || noPrNeeded || typeof getPR !== 'function') {
              currentCompletedIds.add(s.id);
            }
          }
        }

        for (const qsSession of queued) {
           if (qsSession.dependsOnSessionId && currentCompletedIds.has(qsSession.dependsOnSessionId)) {
             try {
                // Dependency met, start the session
                const body = {
                   prompt: qsSession.prompt,
                   requirePlanApproval: qsSession.requirePlanApproval,
                };
                if (qsSession.source) {
                  body.sourceContext = {
                    source: qsSession.source,
                    githubRepoContext: { startingBranch: qsSession.branch }
                  };
                  if (qsSession.autoMode) {
                    body.automationMode = "AUTO_CREATE_PR";
                  }
                }

                await apiCall(apiKey, "/sessions", {
                   method: "POST",
                   body,
                   timeout: 60000,
                   attempts: 1,
                   _label: "Start Queued Session"
                });
                SafeStorage.deleteQueuedSession(qsSession.id);
                processedAny = true;
             } catch (err) {
                console.error("Failed to start queued session", qsSession, sanitizeErrorMessage(err.message || String(err)));
             }
           }
        }
        if (processedAny) {
           forceFull = true;
           // If we're forcing a full fetch, we should update our loop control variables
           isFull = true;
           deltaPageSize = sessionLimit;
        }
      }

      do {
        const pageSize = isFull ? sessionLimit : deltaPageSize;
        const qs = `pageSize=${pageSize}${pageToken ? `&pageToken=${pageToken}` : ""}`;
        const d = await apiCall(apiKey, `/sessions?${qs}`, {
          _label:`Sessions ${isFull ? "full" : "Δ"} p${iterations+1}`,
          signal: controller.signal,
          timeout: loadApiTimeout()
        });
        const batch = d.sessions || [];
        incoming = [...incoming, ...batch];
        pageToken = d.nextPageToken;

        // Register seen active IDs in this batch
        batch.forEach(s => {
          const sid = s.id || s.name;
          if (activeIdsToVerify.has(sid)) seenActiveIds.add(sid);
        });

        const windowStart = Date.now() - 24 * 3600000;
        const hasOlderThanWindow = batch.length > 0 && parseDateMs(batch[batch.length-1].createTime) < windowStart;

        // Register batch for quota tracking immediately
        registerSessions(batch);

        // Guard against race conditions if superseded by a newer request
        if (sessionsAbortRef.current !== controller) break;

        // Update sessions state instantly for incremental/one-by-one rendering
        const currentBatch = batch;
        const currentIsFirstPageOfFull = isFull && (iterations === 0);
        setSessions(prev => {
          const selectedId = selected?.id || selected?.name;
          const prevSelected = selectedId ? prev.find(s => (s.id || s.name) === selectedId) : null;
          let adjustedBatch = currentBatch;
          if (prevSelected) {
            adjustedBatch = currentBatch.map(s => {
              if ((s.id || s.name) === selectedId) {
                const sTs = parseDateMs(s.updateTime || s.createTime);
                const prevTs = parseDateMs(prevSelected.updateTime || prevSelected.createTime);
                if (prevTs > sTs) {
                  return prevSelected;
                }
              }
              return s;
            });
          }

          let merged = [];
          if (currentIsFirstPageOfFull) {
            let oldestTs = 0;
            if (adjustedBatch.length > 0) {
              // OPTIMIZATION (Bolt): Replace Math.min(...array.map(...)) with standard for loop
              // to prevent maximum call stack size exceeded errors on large arrays and avoid intermediate allocations.
              let minTs = Infinity;
              for (let i = 0; i < adjustedBatch.length; i++) {
                const s = adjustedBatch[i];
                const ts = parseDateMs(s.updateTime || s.createTime);
                if (ts < minTs) minTs = ts;
              }
              oldestTs = minTs === Infinity ? 0 : minTs;
            }
            const batchIds = new Set(adjustedBatch.map(s => s.id || s.name));
            const preserved = prev.filter(s => {
              if (batchIds.has(s.id || s.name)) return false;
              const ts = parseDateMs(s.updateTime || s.createTime);
              const isRecent = (Date.now() - parseDateMs(s.createTime || s.updateTime)) < 300000;
              return ts >= oldestTs || ACTIVE_STATES.has(s.state) || isRecent;
            });
            merged = [...adjustedBatch, ...preserved];
          } else {
            const batchIds = new Set(adjustedBatch.map(s => s.id || s.name));
            merged = [
              ...adjustedBatch,
              ...prev.filter(s => !batchIds.has(s.id || s.name))
            ];
          }

          // Sort: Newly created first, then active first, then by selected sort (update/create time)
          const sorted = [...merged].sort((a, b) => {
            const aIsNewest = (a.id || a.name) === lastCreatedSessionIdRef.current;
            const bIsNewest = (b.id || b.name) === lastCreatedSessionIdRef.current;
            if (aIsNewest && !bIsNewest) return -1;
            if (!aIsNewest && bIsNewest) return 1;

            const aActive = ACTIVE_STATES.has(a.state);
            const bActive = ACTIVE_STATES.has(b.state);
            if (aActive && !bActive) return -1;
            if (!aActive && bActive) return 1;

            if (sessionSort === "CREATETIME") {
              const aTime = parseDateMs(a.createTime);
              const bTime = parseDateMs(b.createTime);
              return bTime - aTime;
            } else {
              const aTime = parseDateMs(a.updateTime || a.createTime);
              const bTime = parseDateMs(b.updateTime || b.createTime);
              return bTime - aTime;
            }
          });

          // ── No-Op Re-render Check ──
          if (prev.length === sorted.length) {
            let identical = true;
            for (let i = 0; i < sorted.length; i++) {
              const p = prev[i];
              const s = sorted[i];
              if ((p.id || p.name) !== (s.id || s.name) || p.state !== s.state || p.updateTime !== s.updateTime) {
                identical = false;
                break;
              }
            }
            if (identical) {
              return prev;
            }
          }

          // ── Status Notifications ──
          if (loadNotify()) {
            currentBatch.forEach(s => {
              const lastState = lastStates.current.get(s.id || s.name);
              if (lastState && lastState !== s.state) {
                const label = s.title || s.prompt || s.id || s.name;
                if (s.state === "AWAITING_PLAN_APPROVAL") sendNotification("PLAN READY", `Session: ${label}`, s.id || s.name);
                else if (s.state === "AWAITING_USER_FEEDBACK") sendNotification("INPUT NEEDED", `Session: ${label}`, s.id || s.name);
                else if (s.state === "COMPLETED") sendNotification("SESSION DONE", `Session: ${label}`, s.id);
                else if (s.state === "FAILED") sendNotification("SESSION FAILED", `Session: ${label}`, s.id);
              }
              lastStates.current.set(s.id, s.state);
            });
          }

          return sorted;
        });

        iterations++;

        if (!isFull) {
          // Check if batch reached items older than lastFetchTime with a 30s clock-skew buffer
          const bufferMs = 30000;
          const thresholdTs = (lastFetchTime.current || Date.now()) - bufferMs;

          // OPTIMIZATION (Bolt): Replace Math.min(...array.map(...)) with standard for loop
          let batchMinTs = 0;
          if (batch.length > 0) {
            let minTs = Infinity;
            for (let i = 0; i < batch.length; i++) {
              const s = batch[i];
              const ts = parseDateMs(s.updateTime || s.createTime);
              if (ts < minTs) minTs = ts;
            }
            batchMinTs = minTs === Infinity ? 0 : minTs;
          }

          const reachedOlder = batch.length > 0 && batchMinTs <= thresholdTs;
          const allActiveAccountedFor = activeIdsToVerify.size === seenActiveIds.size;

          if (reachedOlder && allActiveAccountedFor) {
            break;
          }
        }

        if (hasOlderThanWindow) break;
        if (incoming.length >= Math.max(sessionLimit, quotaNeeded * 2)) break;
        if (iterations > 15) break;
      } while (pageToken);

      // Targeted safety check for any active sessions missing from delta pages
      if (!isFull && activeIdsToVerify.size > seenActiveIds.size && sessionsAbortRef.current === controller) {
        const checkValidId = typeof isValidSessionId === "function" ? isValidSessionId : (id) => !!id && typeof id === "string";
        const missingActiveIds = [...activeIdsToVerify].filter(id => !seenActiveIds.has(id) && checkValidId(id));
        if (missingActiveIds.length > 0) {
          console.warn(`[FetchSessions] ${missingActiveIds.length} active sessions fell outside delta pages. Fetching targeted updates...`, missingActiveIds);
          const checked = await Promise.all(missingActiveIds.map(id =>
            apiCall(apiKey, `/sessions/${id}`, { _label: `Targeted ${id.slice(0,6)}`, signal: controller.signal }).catch(() => null)
          ));
          const validUpdates = checked.filter(Boolean);
          if (validUpdates.length > 0 && sessionsAbortRef.current === controller) {
            setSessions(prev => {
              const updatedMap = new Map(validUpdates.map(s => [s.id || s.name, s]));
              return prev.map(s => updatedMap.get(s.id || s.name) || s);
            });
          }
        }
      }

      if (sessionsAbortRef.current !== controller) return;

      setGlobalErr(null); // Clear error on success

      // Update lastFetchTime with the latest numerical millisecond timestamp
      if (incoming.length > 0) {
        // OPTIMIZATION (Bolt): Use standard for loop instead of .reduce() to avoid callback allocations
        let latestTs = 0;
        for (let i = 0; i < incoming.length; i++) {
          const s = incoming[i];
          const ts = parseDateMs(s.updateTime || s.createTime);
          if (ts > latestTs) latestTs = ts;
        }
        if (latestTs > 0) {
          lastFetchTime.current = Math.max(lastFetchTime.current || 0, latestTs);
        }
      } else if (forceFull) {
        lastFetchTime.current = null;
      }

      if (!quiet) {
        setJustRefreshed(true);
        setTimeout(() => setJustRefreshed(false), 2000);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("[FetchSessions] Error:", sanitizeErrorMessage(err.message || String(err)));
      if (!quiet) setGlobalErr(err.message);
    } finally {
      if (sessionsAbortRef.current === controller) {
        if (!quiet) setRefreshing(false);
      }
    }
  }, [apiKey, sessionLimit, plan.daily]);

  useEffect(() => { if (apiKey) fetchSessions(); }, [apiKey, fetchSessions]);

  useEffect(() => {
    const handleResume = () => {
      if (document.visibilityState === "visible") {
        fetchSessions(true);
      }
    };
    window.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);

    return () => {
      if (sessionsAbortRef.current) sessionsAbortRef.current.abort();
      window.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("focus", handleResume);
    };
  }, [fetchSessions]);

  // Combined polling: use activePollInterval if any session is in progress, else pollInterval
  const isBoosted = useMemo(() => sessions.some(s => ACTIVE_STATES.has(s.state)) && activePollInterval > 0, [sessions, activePollInterval]);
  const effectivePollInterval = useMemo(() => {
    if (!apiKey) return 0;
    return isBoosted ? activePollInterval : pollInterval;
  }, [apiKey, isBoosted, activePollInterval, pollInterval]);

  const countdown = useAutoPoll(effectivePollInterval, useCallback(() => fetchSessions(true), [fetchSessions]));

  const handleSessionUpdate = useCallback(updated => {
    const lastState = lastStates.current.get(updated.id);
    if (loadNotify() && lastState && lastState !== updated.state) {
      const label = updated.title || updated.prompt || updated.id;
      if (updated.state === "AWAITING_PLAN_APPROVAL") sendNotification("PLAN READY", `Session: ${label}`, updated.id);
      else if (updated.state === "AWAITING_USER_FEEDBACK") sendNotification("INPUT NEEDED", `Session: ${label}`, updated.id);
      else if (updated.state === "COMPLETED") sendNotification("SESSION DONE", `Session: ${label}`, updated.id);
      else if (updated.state === "FAILED") sendNotification("SESSION FAILED", `Session: ${label}`, updated.id);
    }
    lastStates.current.set(updated.id, updated.state);
    setSessions(prev => prev.map(s=>s.id===updated.id?updated:s));
  }, []);

  const handleStatsUpdate = useCallback((id, stats) => {
    setActivityStatsMap(prev => ({ ...prev, [id]: stats }));
  }, []);

  const handleSelect = useCallback(s => {
    setSelected(s);
    // If selected from supplemental, ensure it doesn't duplicate if primary list updates
    const ts = s.updateTime || s.createTime;
    setReadMap(prev => ({ ...prev, [s.id || s.name]: ts }));
    if (mobileDrawerOpen) closeMobileDrawer();
    if (isDesktop) setDesktop("detail"); else setMobile("detail");
  }, [isDesktop, mobileDrawerOpen, closeMobileDrawer]);

  const handleOpenSplitSession = useCallback((draft) => {
    setSelectedDraft(draft);
    if (mobileDrawerOpen) closeMobileDrawer();
    if (isDesktop) setDesktop("new"); else setMobile("new");
  }, [isDesktop, mobileDrawerOpen, closeMobileDrawer, setDesktop, setMobile]);

  const handleCreate = useCallback(rawS => {
    if (!rawS) return;
    const s = normalizeSession(rawS);
    if (!s.createTime) s.createTime = new Date().toISOString();
    if (!s.updateTime) s.updateTime = new Date().toISOString();
    const sid = s.id || s.name;
    lastCreatedSessionIdRef.current = sid;
    registerSession(s);
    lastStates.current.set(sid, s.state);
    setSessions(prev => [s, ...prev]);
    setSelected(s);

    // Reset filters to guarantee the newly created session is visible
    setShowArchived(false);
    setSearchQuery("");
    setStatusFilter("ALL");
    setFilterResetTrigger(prev => prev + 1);

    if (isDesktop) setDesktop("detail"); else setMobile("detail");
  }, [isDesktop, registerSession]);

  const saveKey = k => {
    SafeStorage.saveApiKey(k);
    lastFetchTime.current = null;
    setApiKey(k);
  };

  if (!apiKey) {
    return (
      <Shell>
        <SetupScreen onSave={saveKey}/>
      </Shell>
    );
  }

  // ── Desktop layout: sidebar + main ──────────────────────────────────────────
  if (isDesktop) {
    return (
      <Shell desktop>
        {/* Sidebar */}
        <div style={{
          width: sidebarCollapsed ? 68 : 320,
          flexShrink: 0,
          borderRight: `1px solid ${T.border}`,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          background: T.surface,
          zIndex: 10
        }}>
          <SessionList
            onBulkDelete={handleBulkDelete} onBulkArchive={handleBulkArchive} onBulkUnarchive={handleBulkUnarchive} onBulkIgnore={handleBulkIgnore} onBulkPause={handleBulkPause} onBulkResume={handleBulkResume}
            onSelect={handleSelect} onRefresh={()=>fetchSessions(false)}
            refreshing={refreshing} justRefreshed={justRefreshed} selectedId={selected?.id}
            isDesktop onNew={()=>setDesktop("new")}
            onDrafts={()=>setDesktop("drafts")}
            onSettings={()=>setDesktop("settings")}
            pollInterval={effectivePollInterval}
            sessionLimit={sessionLimit}
            countdown={countdown}
            plan={plan} todayCount={todayCount}
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            archivedIds={archivedIds} showArchived={showArchived} setShowArchived={setShowArchived}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            repoFilter={repoFilter} setRepoFilter={setRepoFilter}
            sessionSort={sessionSort} setSessionSort={setSessionSort}
            activitiesMap={activitiesMap}
            activityStatsMap={activityStatsMap}
            sessions={allSessions}
            error={globalErr} clearError={() => setGlobalErr(null)}
            isBoosted={isBoosted}
            readMap={readMap}
            draftsMap={draftsMap}
            ignoredIds={ignoredIds}
            filterResetTrigger={filterResetTrigger}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
          />
        </div>
        {/* Main panel */}
        <div style={{flex:1,display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden",minWidth:0}}>
          {desktopView==="empty"&&(
            <div style={{
              flex:1, display:"flex", flexDirection:"column", height:"100%", overflowY:"auto",
              background:`radial-gradient(ellipse 700px 350px at 50% 15%, rgba(6,182,212,0.08), transparent 70%), ${T.bg}`,
              position:"relative"
            }}>
              {/* Header Top Bar Contract */}
              <div style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"14px 28px", borderBottom:`1px solid ${T.border}`, background:T.surface,
                flexShrink:0
              }}>
                <div style={{display:"flex", alignItems:"center", gap:8, fontSize:12, color:T.muted, fontFamily:"'JetBrains Mono',monospace"}}>
                  <span style={{color:T.dim}}>Workspace</span>
                  <span style={{color:T.dim}}>·</span>
                  <span style={{color:T.textHi, fontWeight:700}}>Jules Agent</span>
                </div>
                <div style={{display:"flex", alignItems:"center", gap:8}}>
                  <Btn sm outline color={T.muted} onClick={()=>setDesktop("drafts")}>
                    <Ic n="layers" s={13} c={T.muted}/>
                    <span>Drafts</span>
                  </Btn>
                  <Btn sm outline color={T.muted} onClick={()=>setDesktop("settings")}>
                    <Ic n="settings" s={13} c={T.muted}/>
                    <span>Settings</span>
                  </Btn>
                  <Btn sm color={T.brand} onClick={()=>setDesktop("new")}>
                    <Ic n="plus" s={13} c="#07090e"/>
                    <span>New Session</span>
                  </Btn>
                </div>
              </div>

              {/* Main Hub Canvas */}
              <div style={{
                flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                padding:"48px 32px", maxWidth:880, margin:"0 auto", width:"100%", boxSizing:"border-box"
              }}>
                {/* Agent Insignia */}
                <div style={{
                  width:68, height:68, borderRadius:16,
                  background:"linear-gradient(135deg, #22d3ee, #0891b2)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:32, fontWeight:900, color:"#07090e",
                  boxShadow:`0 8px 32px rgba(6,182,212,0.35)`,
                  marginBottom:22
                }}>J</div>

                {/* Typography Heading */}
                <h1 style={{
                  fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:24, fontWeight:700,
                  color:T.textHi, letterSpacing:"-0.03em", textAlign:"center", margin:0, marginBottom:10
                }}>
                  Autonomous Coding Agent Workspace
                </h1>

                <p style={{
                  fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, lineHeight:1.6,
                  color:T.muted, textAlign:"center", maxWidth:560, margin:"0 0 32px"
                }}>
                  Monitor real-time task execution, review proposed implementation plans, inspect unified patches, and track pull requests across repositories.
                </p>

                {/* Primary Action Buttons */}
                <div style={{display:"flex", gap:12, alignItems:"center", marginBottom:42}}>
                  <Btn color={T.brand} onClick={()=>setDesktop("new")} style={{minWidth:160, padding:"12px 24px"}}>
                    <Ic n="plus" s={15} c="#07090e"/>
                    <span>Create Session</span>
                  </Btn>
                  <Btn outline color={T.muted} onClick={()=>setDesktop("drafts")} style={{minWidth:140, padding:"12px 20px"}}>
                    <Ic n="layers" s={15} c={T.muted}/>
                    <span>Saved Drafts</span>
                  </Btn>
                </div>

                {/* 3 Metrics Cards */}
                <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:14, width:"100%", marginBottom:36}}>
                  <div style={{
                    background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:"16px 18px",
                    display:"flex", flexDirection:"column", gap:6, boxShadow:"0 1px 4px rgba(0,0,0,0.25)"
                  }}>
                    <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                      <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.dim, fontWeight:700}}>ACTIVE AGENTS</span>
                      <Ic n="tasks" s={14} c={T.brand}/>
                    </div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:22, fontWeight:800, color:T.textHi}}>
                      {allSessions.filter(s => ACTIVE_STATES.has(s.state)).length}
                    </div>
                    <span style={{fontSize:11.5, color:T.muted}}>Tasks currently in progress</span>
                  </div>

                  <div style={{
                    background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:"16px 18px",
                    display:"flex", flexDirection:"column", gap:6, boxShadow:"0 1px 4px rgba(0,0,0,0.25)"
                  }}>
                    <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                      <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.dim, fontWeight:700}}>DAILY CAPACITY</span>
                      <Ic n="clock" s={14} c={T.amber}/>
                    </div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:22, fontWeight:800, color:T.textHi}}>
                      {todayCount.total} <span style={{fontSize:14, color:T.dim, fontWeight:500}}>/ {plan?.daily || 15}</span>
                    </div>
                    <span style={{fontSize:11.5, color:T.muted}}>Daily tasks initiated</span>
                  </div>

                  <div style={{
                    background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:"16px 18px",
                    display:"flex", flexDirection:"column", gap:6, boxShadow:"0 1px 4px rgba(0,0,0,0.25)"
                  }}>
                    <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                      <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.dim, fontWeight:700}}>PULL REQUESTS</span>
                      <Ic n="git_pull" s={14} c={T.purple}/>
                    </div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:22, fontWeight:800, color:T.textHi}}>
                      {allSessions.filter(s => getPR(s)).length}
                    </div>
                    <span style={{fontSize:11.5, color:T.muted}}>PR branches generated</span>
                  </div>
                </div>

                {/* Quick Task Starters */}
                <div style={{width:"100%", marginBottom:32}}>
                  <div style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12
                  }}>
                    <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.textDim, fontWeight:700, letterSpacing:"0.06em"}}>
                      QUICK TASK STARTERS
                    </span>
                    <span style={{fontSize:11, color:T.muted}}>1-click prompt presets</span>
                  </div>
                  <div style={{display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:10}}>
                    {[
                      {
                        title: "Fix Bug & Add Regression Tests",
                        prompt: "Investigate and resolve the reported issue. Write comprehensive regression tests verifying the fix.",
                        icon: "check",
                        color: T.emerald
                      },
                      {
                        title: "Refactor Module Architecture",
                        prompt: "Refactor this module to improve separation of concerns, extract reusable utility functions, and ensure clean types.",
                        icon: "code",
                        color: T.brand
                      },
                      {
                        title: "Security & Dependency Hardening",
                        prompt: "Audit input validation, sanitize API payloads, and patch security vulnerabilities across services.",
                        icon: "key",
                        color: T.purple
                      },
                      {
                        title: "Implement Feature Prototype",
                        prompt: "Build an end-to-end prototype for the new feature with clean component hierarchy and error boundaries.",
                        icon: "tasks",
                        color: T.blue
                      }
                    ].map(preset => (
                      <button
                        key={preset.title}
                        onClick={() => {
                          setSelectedDraft({ prompt: preset.prompt });
                          setDesktop("new");
                        }}
                        style={{
                          background:T.surface, border:`1px solid ${T.border}`, borderRadius:8,
                          padding:"12px 14px", textAlign:"left", cursor:"pointer",
                          display:"flex", alignItems:"flex-start", gap:10,
                          transition:"all .15s ease"
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = T.surfaceHi;
                          e.currentTarget.style.borderColor = T.borderHi;
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = T.surface;
                          e.currentTarget.style.borderColor = T.border;
                          e.currentTarget.style.transform = "none";
                        }}
                      >
                        <div style={{
                          width:26, height:26, borderRadius:6, background:`${preset.color}15`,
                          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1
                        }}>
                          <Ic n={preset.icon} s={13} c={preset.color}/>
                        </div>
                        <div style={{flex:1, minWidth:0}}>
                          <div style={{
                            fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12.5, fontWeight:700,
                            color:T.text, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"
                          }}>
                            {preset.title}
                          </div>
                          <div style={{
                            fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:11, color:T.muted,
                            lineHeight:1.4, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden"
                          }}>
                            {preset.prompt}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shortcuts Cheatsheet Bar */}
                <div style={{
                  display:"flex", alignItems:"center", gap:16, flexWrap:"wrap", justifyContent:"center",
                  padding:"10px 18px", background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:8
                }}>
                  <div style={{display:"flex", alignItems:"center", gap:6}}>
                    <kbd style={{background:T.surface, border:`1px solid ${T.borderHi}`, borderRadius:4, padding:"2px 6px", fontFamily:"'JetBrains Mono',monospace", fontSize:10.5, color:T.textDim}}>N</kbd>
                    <span style={{fontSize:11, color:T.muted}}>New Session</span>
                  </div>
                  <span style={{color:T.dim}}>·</span>
                  <div style={{display:"flex", alignItems:"center", gap:6}}>
                    <kbd style={{background:T.surface, border:`1px solid ${T.borderHi}`, borderRadius:4, padding:"2px 6px", fontFamily:"'JetBrains Mono',monospace", fontSize:10.5, color:T.textDim}}>/</kbd>
                    <span style={{fontSize:11, color:T.muted}}>Search List</span>
                  </div>
                  <span style={{color:T.dim}}>·</span>
                  <div style={{display:"flex", alignItems:"center", gap:6}}>
                    <kbd style={{background:T.surface, border:`1px solid ${T.borderHi}`, borderRadius:4, padding:"2px 6px", fontFamily:"'JetBrains Mono',monospace", fontSize:10.5, color:T.textDim}}>D</kbd>
                    <span style={{fontSize:11, color:T.muted}}>Saved Drafts</span>
                  </div>
                  <span style={{color:T.dim}}>·</span>
                  <div style={{display:"flex", alignItems:"center", gap:6}}>
                    <kbd style={{background:T.surface, border:`1px solid ${T.borderHi}`, borderRadius:4, padding:"2px 6px", fontFamily:"'JetBrains Mono',monospace", fontSize:10.5, color:T.textDim}}>Esc</kbd>
                    <span style={{fontSize:11, color:T.muted}}>Clear View</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {desktopView==="detail"&&selected&&(
            <SessionDetail key={selected.id} session={selected} apiKey={apiKey}
              personas={personas}
              allSessions={allSessions}
              activitiesMap={activitiesMap}
              onBack={()=>setDesktop("empty")} onDelete={handleDelete}
              onSessionUpdate={handleSessionUpdate}
              onStatsUpdate={handleStatsUpdate}
              isDesktop
              pollInterval={actPollInterval} setPollInterval={setActPollInterval}
              cacheLimit={cacheLimit} activityLimit={activityLimit}
              isArchived={archivedIds.has(selected.id)}
              onArchive={handleArchive} onUnarchive={handleUnarchive}
              onIgnore={handleIgnore}
              onPause={handlePause} onResume={handleResume}
              onDraftChange={handleDraftChange}
              onOpenSplitSession={handleOpenSplitSession}/>
          )}
          {desktopView==="new"&&(
            <NewSession
              apiKey={apiKey} personas={personas}
              onBack={()=>setDesktop("empty")}
              onCreate={handleCreate}
              isDesktop plan={plan} todayCount={todayCount}
              allSessions={allSessions} activitiesMap={activitiesMap}
              initialDraft={selectedDraft}
              onDraftSaved={() => { setSelectedDraft(null); if (desktopView === "new") setDesktop("drafts"); }}
            />
          )}

          {desktopView==="drafts"&&(
            <DraftsBox
              onBack={()=>setDesktop("empty")}
              isDesktop
              allSessions={allSessions}
              activitiesMap={activitiesMap}
              draftsMap={draftsMap}
              onDraftChange={handleDraftChange}
              onSelectSession={handleSelect}
              onStartNewSession={() => { setSelectedDraft(null); setDesktop("new"); }}
              onResume={(d) => { setSelectedDraft(d); setDesktop("new"); }}
              onCreate={async (d) => {
                setSelectedDraft(d);
                setDesktop("new");
              }}
            />
          )}

          {desktopView==="network"&&( <NetworkMonitor onBack={()=>setDesktop("empty")} isDesktop/> )} {desktopView==="settings"&&(
            <SettingsView onBack={()=>setDesktop("empty")} isDesktop
              apiKey={apiKey} setApiKey={setApiKey}
              githubToken={githubToken} setGithubToken={setGithubToken}
              ghRateLimitedReset={ghRateLimitedReset}
              settings={settings}
              personas={personas} setPersonas={setPersonas}
              todayCount={todayCount} />
          )}
        </div>
      </Shell>
    );
  }

  // ── Mobile layout: single panel + bottom nav + slide-over drawer ────────────
  return (
    <Shell>
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column",minHeight:0,position:"relative"}}>
        {/* Mobile Slide-Over Sidebar Drawer */}
        {mobileDrawerOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Sessions sidebar drawer"
            aria-expanded={!drawerClosing}
            style={{
              position:"absolute", inset:0, zIndex:1000, display:"flex"
            }}
          >
            {/* Dark Backdrop */}
            <div
              onClick={closeMobileDrawer}
              style={{
                position:"absolute", inset:0, background:"rgba(0,0,0,0.65)",
                backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)",
                animation: drawerClosing ? "fadeOut .22s cubic-bezier(0.4, 0, 0.2, 1) forwards" : "fadeIn .2s ease"
              }}
            />
            {/* Drawer Container */}
            <div style={{
              position:"relative", width:"100%", maxWidth:"100%", height:"100%",
              background:T.surface, borderRight:`1px solid ${T.borderHi}`,
              boxShadow:"0 0 30px rgba(0,0,0,0.8)", zIndex:1001, display:"flex",
              flexDirection:"column",
              animation: drawerClosing ? "slideLeft .22s cubic-bezier(0.4, 0, 0.2, 1) forwards" : "slideRight .25s cubic-bezier(0.4, 0, 0.2, 1)"
            }}>
              <SessionList sessions={allSessions} sessionSort={sessionSort} setSessionSort={setSessionSort} onBulkDelete={handleBulkDelete} onBulkArchive={handleBulkArchive} onBulkUnarchive={handleBulkUnarchive} onBulkIgnore={handleBulkIgnore} onBulkPause={handleBulkPause} onBulkResume={handleBulkResume} onSelect={handleSelect} onRefresh={()=>fetchSessions(false)}
                refreshing={refreshing} justRefreshed={justRefreshed} selectedId={selected?.id} isDesktop={false}
                onNew={() => { setSelectedDraft(null); closeMobileDrawer(); setMobile("new"); }}
                onDrafts={() => { closeMobileDrawer(); setMobile("drafts"); }}
                onSettings={() => { closeMobileDrawer(); setMobile("settings"); }}
                pollInterval={effectivePollInterval}
                sessionLimit={sessionLimit}
                countdown={countdown}
                plan={plan} todayCount={todayCount}
                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                archivedIds={archivedIds} showArchived={showArchived} setShowArchived={setShowArchived}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                repoFilter={repoFilter} setRepoFilter={setRepoFilter}
                activitiesMap={activitiesMap}
                activityStatsMap={activityStatsMap}
                error={globalErr} clearError={() => setGlobalErr(null)}
                isBoosted={isBoosted}
                readMap={readMap}
                draftsMap={draftsMap}
                ignoredIds={ignoredIds}
                filterResetTrigger={filterResetTrigger}
                onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
              />
            </div>
          </div>
        )}

        {mobileScreen==="detail"&&(!selected ? (
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,padding:32}}>
            <div style={{width:48,height:48,borderRadius:11,background:T.brandDim,border:`1px solid ${T.brand}25`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:26,fontWeight:900,color:T.brand}}>J</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.textDim,textAlign:"center",lineHeight:2}}>
              SELECT A SESSION
            </div>
            <button
              onClick={openMobileDrawer}
              aria-label="Open sessions sidebar drawer"
              title="Open sessions sidebar drawer"
              style={{
                marginTop:8, padding:"10px 18px", borderRadius:8, border:"none",
                background:T.brand, color:"#000", fontFamily:"'JetBrains Mono',monospace",
                fontSize:12, fontWeight:900, cursor:"pointer", display:"flex", alignItems:"center", gap:8
              }}
            >
              <Ic n="layout_toggle" s={16} c="#000"/> OPEN SESSIONS SIDEBAR
            </button>
          </div>
        ) : (
          <SessionDetail key={selected.id} session={selected} apiKey={apiKey}
            personas={personas}
            allSessions={allSessions}
            activitiesMap={activitiesMap}
            onBack={openMobileDrawer}
            onDelete={handleDelete} onSessionUpdate={handleSessionUpdate}
            onStatsUpdate={handleStatsUpdate}
            isDesktop={false}
            pollInterval={actPollInterval} setPollInterval={setActPollInterval}
            cacheLimit={cacheLimit} activityLimit={activityLimit}
            isArchived={archivedIds.has(selected.id)}
            onArchive={handleArchive} onUnarchive={handleUnarchive}
            onIgnore={handleIgnore}
            onPause={handlePause} onResume={handleResume}
            onDraftChange={handleDraftChange}
            onOpenSplitSession={handleOpenSplitSession}
            onToggleMobileDrawer={mobileDrawerOpen ? closeMobileDrawer : openMobileDrawer}/>
        ))}
        {mobileScreen==="new"&&(
          <NewSession
            apiKey={apiKey} personas={personas}
            onBack={()=>setMobile("detail")}
            onCreate={handleCreate}
            isDesktop={false} plan={plan} todayCount={todayCount}
            allSessions={allSessions} activitiesMap={activitiesMap}
            initialDraft={selectedDraft}
            onDraftSaved={() => { setSelectedDraft(null); if (mobileScreen === "new") setMobile("drafts"); }}
          />
        )}

        {mobileScreen==="drafts"&&(
          <DraftsBox
            onBack={()=>setMobile("detail")}
            isDesktop={false}
            allSessions={allSessions}
            activitiesMap={activitiesMap}
            draftsMap={draftsMap}
            onDraftChange={handleDraftChange}
            onSelectSession={handleSelect}
            onStartNewSession={() => { setSelectedDraft(null); setMobile("new"); }}
            onResume={(d) => { setSelectedDraft(d); setMobile("new"); }}
            onCreate={async (d) => {
              setSelectedDraft(d);
              setMobile("new");
            }}
          />
        )}

        {mobileScreen==="network"&&( <NetworkMonitor onBack={()=>setMobile("detail")} isDesktop={false}/> )} {mobileScreen==="settings"&&(
          <SettingsView onBack={()=>setMobile("detail")} isDesktop={false}
            apiKey={apiKey} setApiKey={setApiKey}
            githubToken={githubToken} setGithubToken={setGithubToken}
            ghRateLimitedReset={ghRateLimitedReset}
            settings={settings}
            personas={personas} setPersonas={setPersonas}
            todayCount={todayCount} />
        )}
      </div>
      <nav aria-label="Main navigation" style={{
        display:"flex", alignItems:"center", height:58,
        borderTop:`1px solid ${T.border}`, background:"rgba(13,17,23,0.94)",
        backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
        transform:"translateZ(0)", flexShrink:0, zIndex:40
      }}>
        {[
          {id:"list",    n:"tasks", label:"SESSIONS", onClick:() => {
            setShowArchived(false);
            if (mobileDrawerOpen && !showArchived) closeMobileDrawer();
            else openMobileDrawer();
          }},
          {id:"archive", n:"archive", label:"ARCHIVE", onClick:() => {
            setShowArchived(true);
            if (mobileDrawerOpen && showArchived) closeMobileDrawer();
            else openMobileDrawer();
          }},
          {id:"new",     n:"plus",  label:"NEW", onClick:() => { if (mobileDrawerOpen) closeMobileDrawer(); setSelectedDraft(null); setMobile("new"); }},
          {id:"drafts",  n:"layers", label:"DRAFTS", onClick:() => { if (mobileDrawerOpen) closeMobileDrawer(); setMobile("drafts"); }},
          {id:"settings",n:"settings", label:"SETTINGS", onClick:() => { if (mobileDrawerOpen) closeMobileDrawer(); setMobile("settings"); }},
        ].map(({id,n,label,onClick})=>{
          const isAct = (id === "list" && mobileDrawerOpen && !showArchived) ||
                        (id === "archive" && mobileDrawerOpen && showArchived) ||
                        (!mobileDrawerOpen && mobileScreen === id && id !== "list" && id !== "archive");

          const hasAlert = sessions.some(s=>["AWAITING_PLAN_APPROVAL","AWAITING_USER_FEEDBACK"].includes(s.state));
          const buttonTitle = `${label}${hasAlert ? " (attention needed)" : ""}${isAct ? " (active view)" : ""}`;
          return (
            <button
              key={id}
              onClick={onClick}
              aria-label={buttonTitle}
              aria-current={isAct ? "page" : undefined}
              title={buttonTitle}
              style={{
                flex:1, height:"100%", minHeight:48, background:"none", border:"none",
                cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center",
                justifyContent:"center", gap:3, padding:"6px 0",
                transition:"all .15s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
            >
              <div style={{position:"relative", display:"flex", alignItems:"center", justifyContent:"center"}}>
                <Ic n={n} s={20} c={isAct?T.brandLight:T.muted}/>
                {hasAlert&&<div style={{position:"absolute",top:-2,right:-4,width:7,height:7,borderRadius:"50%",background:T.purple,border:`1.5px solid ${T.surface}`}}/>}
              </div>
              <span style={{
                fontFamily:"'JetBrains Mono',monospace", fontSize:9.5,
                color:isAct?T.brandLight:T.muted, fontWeight:isAct?700:500, letterSpacing:"0.05em"
              }}>
                {label}
              </span>
              {isAct && (
                <div style={{
                  width:16, height:2, borderRadius:1, background:T.brand,
                  position:"absolute", bottom:2, boxShadow:`0 0 6px ${T.brand}`
                }}/>
              )}
            </button>
          );
        })}
      </nav>
    </Shell>
  );
}
