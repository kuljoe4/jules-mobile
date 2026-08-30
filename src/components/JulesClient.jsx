import { isValidSessionId } from "../utils/validation.js";

function JulesClient() {
  const [apiKey,setApiKey]     = useState(() => SafeStorage.loadApiKey());
  const [githubToken,setGithubToken] = useState(() => SafeStorage.loadGithubToken());
  const [ghRateLimitedReset, setGhRateLimitedReset] = useState(null);

  useEffect(() => {
    const handleGhRateLimit = (e) => {
      setGhRateLimitedReset(e.detail?.resetAt || "soon");
    };
    window.addEventListener("gh-rate-limited", handleGhRateLimit);
    return () => window.removeEventListener("gh-rate-limited", handleGhRateLimit);
  }, []);

  const [sessions,setSessions] = useState(() => SafeStorage.loadSessionsList());
  const lastStates = useRef(new Map()); // id -> state
  const lastCreatedSessionIdRef = useRef(null);
  const [activitiesMap, setActivitiesMap] = useState(() => SafeStorage.loadActivitiesMap());
  const [activityStatsMap, setActivityStatsMap] = useState(() => SafeStorage.loadActStats());
  const [selected,setSelected] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileScreen,setMobileRaw] = useState("detail");
  const [justRefreshed, setJustRefreshed] = useState(false);
  const [supplementalSessions, setSupplementalSessions] = useState([]);
  const allSessions = useMemo(() => {
    const map = new Map();
    [...sessions, ...supplementalSessions].forEach(s => map.set(s.id || s.name, s));
    return Array.from(map.values()).sort((a, b) => {
      const aIsNewest = (a.id || a.name) === lastCreatedSessionIdRef.current;
      const bIsNewest = (b.id || b.name) === lastCreatedSessionIdRef.current;
      if (aIsNewest && !bIsNewest) return -1;
      if (!aIsNewest && bIsNewest) return 1;

      const aTime = parseDateMs(a.updateTime || a.createTime);
      const bTime = parseDateMs(b.updateTime || b.createTime);
      return bTime - aTime;
    });
  }, [sessions, supplementalSessions]);
  const [desktopView,setDesktop]   = useState("empty");
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [filterResetTrigger, setFilterResetTrigger] = useState(0);

  const [draftsMap, setDraftsMap] = useState(() => {
    const map = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("jac_draft_") && !key.startsWith("jac_drafts_box")) {
          const val = localStorage.getItem(key);
          if (val && val.trim()) {
            const id = key.slice("jac_draft_".length);
            map[id] = true;
          }
        }
      }
    } catch (e) {
      console.error("Error scanning follow-up drafts", e);
    }
    return map;
  });

  const handleDraftChange = useCallback((id, hasDraft) => {
    setDraftsMap(prev => {
      if (prev[id] === hasDraft) return prev;
      return { ...prev, [id]: hasDraft };
    });
  }, []);

  const setMobile = useCallback(s => {
    setMobileRaw(s);
  }, []);
  const [refreshing,setRefreshing] = useState(false);
  // OPTIMIZATION (Bolt): Removed global root-level `netSnap` state and subscription from JulesClient.
  // Since netSnap was unused for rendering in JulesClient, every network record (NET.record) previously
  // triggered a full root-level re-render of the entire tree. Removing this redundant subscription isolates
  // network updates strictly to SettingsView and NetworkMonitor, eliminating severe CPU/Virtual DOM churn.

  const lastFetchTime = useRef(null);

  const handleSessionLimitChange = useCallback(() => {
    lastFetchTime.current = null; // Force full fetch with new limit
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
  const [searchQuery, setSearchQuery] = useState("");
  const [globalErr, setGlobalErr] = useState(null);
  const sessionsAbortRef = useRef(null);
  const [personas, setPersonas] = useState(loadPersonas);
  const [readMap, setReadMap] = useState(() => {
    try { return SafeStorage.loadReadMap(); }
    catch { return {}; }
  });

  const isDesktop = useIsDesktop();

  const { todayCount, registerSession, registerSessions } = useQuotaTracker(sessions, plan);

  useEffect(() => {
    SafeStorage.saveSessionsList(sessions);
  }, [sessions]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "jac_key") setApiKey(e.newValue || "");
      if (e.key === SafeStorage.KEYS.ARCHIVED) {
        setArchivedIds(new Set(SafeStorage.loadArchived()));
      }
      if (e.key === SafeStorage.KEYS.ACT_STATS) {
        setActivityStatsMap(SafeStorage.loadActStats());
      }
      if (e.key === SafeStorage.KEYS.SESSIONS_LIST) {
        setSessions(SafeStorage.loadSessionsList());
      }
    };
    const handleCustomStats = (e) => {
      if (e.detail) setActivityStatsMap(e.detail);
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("jac_stats_updated", handleCustomStats);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("jac_stats_updated", handleCustomStats);
    };
  }, []);

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

  const handleArchive = useCallback(id => {
    setArchivedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const handleUnarchive = useCallback(id => {
    setArchivedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleIgnore = useCallback(id => {
    if (!confirm("Are you sure you want to ignore this session? This will remove it from your active list and stop updates.")) return;
    setIgnoredIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setSelected(null);
    setDesktop("empty");
    setMobile("detail");
  }, []);

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

    const isFull = !lastFetchTime.current || forceFull;
    if (!quiet) setRefreshing(true);
    try {
      let incoming = [];
      let pageToken = null;
      let iterations = 0;
      const quotaNeeded = plan.daily || 50;

      do {
        const qs = `pageSize=${sessionLimit}${pageToken ? `&pageToken=${pageToken}` : ""}`;
        const d = await apiCall(apiKey, `/sessions?${qs}`, {
          _label:`Sessions ${isFull?"full":"Δ"} p${iterations+1}`,
          signal: controller.signal,
          timeout: loadApiTimeout()
        });
        const batch = d.sessions || [];
        console.log(`[FetchSessions] Fetched page ${iterations + 1} with ${batch.length} sessions.`);
        incoming = [...incoming, ...batch];
        pageToken = d.nextPageToken;

        const windowStart = Date.now() - 24 * 3600000;
        const hasOlderThanWindow = batch.length > 0 && parseDateMs(batch[batch.length-1].createTime) < windowStart;

        // Register batch for quota tracking immediately
        registerSessions(batch);

        // Guard against race conditions if superseded by a newer request
        if (sessionsAbortRef.current !== controller) break;

        // Update sessions state instantly for incremental/one-by-one rendering!
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
              oldestTs = Math.min(...adjustedBatch.map(s => parseDateMs(s.updateTime || s.createTime)));
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

          // Sort: Newly created first, then active first, then by latest update/create time
          const sorted = [...merged].sort((a, b) => {
            const aIsNewest = (a.id || a.name) === lastCreatedSessionIdRef.current;
            const bIsNewest = (b.id || b.name) === lastCreatedSessionIdRef.current;
            if (aIsNewest && !bIsNewest) return -1;
            if (!aIsNewest && bIsNewest) return 1;

            const aActive = ACTIVE_STATES.has(a.state);
            const bActive = ACTIVE_STATES.has(b.state);
            if (aActive && !bActive) return -1;
            if (!aActive && bActive) return 1;
            const aTime = parseDateMs(a.updateTime || a.createTime);
            const bTime = parseDateMs(b.updateTime || b.createTime);
            return bTime - aTime;
          });

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

          console.log(`[FetchSessions] Populated state with ${sorted.length} sessions total (increment: ${currentBatch.length}).`);
          return sorted;
        });

        iterations++;

        if (!isFull) break;
        if (hasOlderThanWindow) break;
        if (incoming.length >= Math.max(sessionLimit, quotaNeeded * 2)) break;
        if (iterations > 15) break;
      } while (pageToken);

      if (sessionsAbortRef.current !== controller) return;

      setGlobalErr(null); // Clear error on success
      console.log(`[FetchSessions] Loading sequence completed successfully. Total processed: ${incoming.length}`);

      // Update lastFetchTime with the latest timestamp from the incoming results
      if (incoming.length > 0) {
        const latestTs = incoming.reduce((max, s) => {
          const ts = s.updateTime || s.createTime;
          return ts > max ? ts : max;
        }, incoming[0].updateTime || incoming[0].createTime);
        lastFetchTime.current = latestTs;
      } else if (forceFull) {
        lastFetchTime.current = null;
      }

      if (!quiet) {
        setJustRefreshed(true);
        setTimeout(() => setJustRefreshed(false), 2000);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("[FetchSessions] Error:", err);
      if (!quiet) setGlobalErr(err.message);
    } finally {
      if (sessionsAbortRef.current === controller) {
        if (!quiet) setRefreshing(false);
      }
    }
  }, [apiKey, sessionLimit, plan.daily]);

  useEffect(() => { if (apiKey) fetchSessions(); }, [apiKey, fetchSessions]);

  useEffect(() => {
    return () => {
      if (sessionsAbortRef.current) sessionsAbortRef.current.abort();
    };
  }, []);

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

  const handleDelete = useCallback(id => {
    lastStates.current.delete(id);
    setSessions(prev => prev.filter(s=>s.id!==id));
    try { SafeStorage.clearFollowupDraft(id); } catch {}
    setDraftsMap(prev => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSelected(null);
    setDesktop("empty");
    setMobile("detail");
  }, []);

  const handleSelect = useCallback(s => {
    setSelected(s);
    // If selected from supplemental, ensure it doesn't duplicate if primary list updates
    const ts = s.updateTime || s.createTime;
    setReadMap(prev => ({ ...prev, [s.id || s.name]: ts }));
    setMobileDrawerOpen(false);
    if (isDesktop) setDesktop("detail"); else setMobile("detail");
  }, [isDesktop]);

  const handleCreate = useCallback(s => {
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
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,padding:32}}>
              <div style={{width:48,height:48,borderRadius:11,background:T.brandDim,border:`1px solid ${T.brand}25`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:26,fontWeight:900,color:T.brand}}>J</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.textDim,textAlign:"center",lineHeight:2}}>
                SELECT A SESSION ←{"\u00A0"}{"\u00A0"}OR{"\u00A0"}{"\u00A0"}NEW ↖
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
              onDraftChange={handleDraftChange}/>
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
              onResume={(d) => { setSelectedDraft(d); setDesktop("new"); }}
              onCreate={async (d) => {
                setSelectedDraft(d);
                setDesktop("new");
                // The actual creation happens inside NewSession but we can also trigger a direct create here if we want.
                // Resuming into NewSession is safer to allow final tweaks.
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
            style={{
              position:"absolute", inset:0, zIndex:1000, display:"flex",
              animation:"fadeIn .2s ease"
            }}
          >
            {/* Dark Backdrop */}
            <div
              onClick={() => setMobileDrawerOpen(false)}
              style={{
                position:"absolute", inset:0, background:"rgba(0,0,0,0.65)",
                backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)"
              }}
            />
            {/* Drawer Container */}
            <div style={{
          position:"relative", width:"88%", maxWidth:350, height:"100%",
              background:T.surface, borderRight:`1px solid ${T.borderHi}`,
              boxShadow:"0 0 30px rgba(0,0,0,0.8)", zIndex:1001, display:"flex",
              flexDirection:"column", animation:"slideRight .25s cubic-bezier(0.4, 0, 0.2, 1)"
            }}>
              <SessionList sessions={allSessions} onSelect={handleSelect} onRefresh={()=>fetchSessions(false)}
                refreshing={refreshing} justRefreshed={justRefreshed} selectedId={selected?.id} isDesktop={false}
                onNew={() => { setSelectedDraft(null); setMobileDrawerOpen(false); setMobile("new"); }}
                onDrafts={() => { setMobileDrawerOpen(false); setMobile("drafts"); }}
                onSettings={() => { setMobileDrawerOpen(false); setMobile("settings"); }}
                pollInterval={effectivePollInterval}
                sessionLimit={sessionLimit}
                countdown={countdown}
                plan={plan} todayCount={todayCount}
                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                archivedIds={archivedIds} showArchived={showArchived} setShowArchived={setShowArchived}
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
              onClick={() => setMobileDrawerOpen(true)}
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
            onBack={() => setMobileDrawerOpen(true)}
            onDelete={handleDelete} onSessionUpdate={handleSessionUpdate}
            onStatsUpdate={handleStatsUpdate}
            isDesktop={false}
            pollInterval={actPollInterval} setPollInterval={setActPollInterval}
            cacheLimit={cacheLimit} activityLimit={activityLimit}
            isArchived={archivedIds.has(selected.id)}
            onArchive={handleArchive} onUnarchive={handleUnarchive}
            onIgnore={handleIgnore}
            onDraftChange={handleDraftChange}
            onToggleMobileDrawer={() => setMobileDrawerOpen(!mobileDrawerOpen)}/>
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
      <nav style={{display:"flex",borderTop:`1px solid ${T.border}`,background:T.surface,transform:"translateZ(0)",flexShrink:0}}>
        {[
          {id:"list",    n:"tasks", label:"SESSIONS", onClick:() => {
            setShowArchived(false);
            setMobileDrawerOpen(true);
          }},
          {id:"archive", n:"archive", label:"ARCHIVE", onClick:() => {
            setShowArchived(true);
            setMobileDrawerOpen(true);
          }},
          {id:"new",     n:"plus",  label:"NEW", onClick:() => { setSelectedDraft(null); setMobile("new"); }},
          {id:"drafts",  n:"layers", label:"DRAFTS", onClick:() => setMobile("drafts")},
          {id:"settings",n:"settings", label:"SETTINGS", onClick:() => setMobile("settings")},
        ].map(({id,n,label,onClick})=>{
          const isAct = (id === "list" && mobileDrawerOpen && !showArchived) ||
                        (id === "archive" && mobileDrawerOpen && showArchived) ||
                        (!mobileDrawerOpen && mobileScreen === id && id !== "list" && id !== "archive");

          const hasAlert = sessions.some(s=>["AWAITING_PLAN_APPROVAL","AWAITING_USER_FEEDBACK"].includes(s.state));
          return (
            <button key={id} onClick={onClick} style={{flex:1,padding:"11px 0 13px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{position:"relative"}}>
                <Ic n={n} s={22} c={isAct?T.brand:T.muted}/>
                {hasAlert&&<div style={{position:"absolute",top:-2,right:-4,width:7,height:7,borderRadius:"50%",background:T.purple,border:`1.5px solid ${T.surface}`,animation:"dot 1.5s ease-in-out infinite"}}/>}
              </div>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:isAct?T.brand:T.muted,fontWeight:isAct?700:400,letterSpacing:"0.07em"}}>{label}</span>
            </button>
          );
        })}
      </nav>
    </Shell>
  );
}
