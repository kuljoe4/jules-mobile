const FILTERS = ["ALL","QUEUED","PLANNING","AWAITING_PLAN_APPROVAL","AWAITING_USER_FEEDBACK","IN_PROGRESS","PAUSED","COMPLETED","FAILED","HAS_DRAFT"];
const FILTER_LABELS = { AWAITING_PLAN_APPROVAL:"APPROVE", AWAITING_USER_FEEDBACK:"INPUT", PAUSED:"PAUSED", ALL:"ALL", HAS_DRAFT:"HAS DRAFT" };

const SessionList = ({ sessions, onSelect, onRefresh, refreshing, justRefreshed, selectedId, isDesktop, onNew, onDrafts, onSettings, pollInterval, sessionLimit, countdown, plan, todayCount, searchQuery, setSearchQuery, archivedIds, showArchived, setShowArchived, activitiesMap = {}, activityStatsMap = {}, error, clearError, isBoosted, readMap, draftsMap = {}, ignoredIds = new Set(), filterResetTrigger, sidebarCollapsed, setSidebarCollapsed, onCloseMobileDrawer, onToggleMobileDrawer, statusFilter: propStatusFilter, setStatusFilter: propSetStatusFilter, repoFilter: propRepoFilter, setRepoFilter: propSetRepoFilter }) => {
  const [localFilter, setLocalFilter] = useState("ALL");
  const [localRepoFilter, setLocalRepoFilter] = useState("ALL");

  const filter = propStatusFilter !== undefined ? propStatusFilter : localFilter;
  const setFilter = propSetStatusFilter || setLocalFilter;

  const repoFilter = propRepoFilter !== undefined ? propRepoFilter : localRepoFilter;
  const setRepoFilter = propSetRepoFilter || setLocalRepoFilter;

  const [repoPickerOpen, setRepoPickerOpen] = useState(false);
  const [scrolled, handleScroll] = useScrollThreshold();

  useEffect(() => {
    if (filterResetTrigger) {
      setFilter("ALL");
      setRepoFilter("ALL");
    }
  }, [filterResetTrigger, setFilter, setRepoFilter]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef(null);

  const toggleSearch = () => {
    if (searchOpen || searchQuery) {
      setSearchOpen(false);
      setSearchQuery("");
    } else {
      setSearchOpen(true);
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const active = document.activeElement;
      if (active && (
        active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.tagName === "SELECT" ||
        active.isContentEditable
      )) {
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);
  // OPTIMIZATION (Bolt): Pre-aggregate repository session counts in a single O(N) pass alongside availableRepos.
  // This turns count lookups inside the repo picker JSX rendering loop into constant O(1) property reads,
  // avoiding O(N * R) full array filter traversals and string replacements on every render tick.
  const { availableRepos, repoCountsMap } = useMemo(() => {
    const counts = {};
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i];
      const repo = s.sourceContext?.githubRepoContext ? s.sourceContext.source?.replace("sources/github/", "") : (s.sourceContext?.source || null);
      if (repo) {
        counts[repo] = (counts[repo] || 0) + 1;
      }
    }
    const repos = Object.keys(counts).sort();
    return { availableRepos: repos, repoCountsMap: counts };
  }, [sessions]);

  const baseFiltered = useMemo(() => {
    let list = sessions.filter(s => archivedIds.has(s.id) === showArchived && !ignoredIds.has(s.id));
    if (repoFilter !== "ALL") {
      list = list.filter(s => {
        const repo = s.sourceContext?.githubRepoContext ? s.sourceContext.source?.replace("sources/github/", "") : (s.sourceContext?.source || null);
        return repo === repoFilter;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => (s.title||"").toLowerCase().includes(q) || (s.prompt||"").toLowerCase().includes(q) || (s.id||"").toLowerCase().includes(q));
    }
    return list;
  }, [sessions, archivedIds, showArchived, searchQuery, ignoredIds, repoFilter]);
  const filtered = useMemo(() => {
    if (filter === "ALL") return baseFiltered;
    if (filter === "HAS_DRAFT") return baseFiltered.filter(s => draftsMap[s.id]);
    return baseFiltered.filter(s => s.state === filter);
  }, [filter, baseFiltered, draftsMap]);
  const active = useMemo(() => sessions.filter(s=>ACTIVE_STATES.has(s.state)).length, [sessions]);

  // Pre-aggregate filter counts in a single O(N) pass to avoid O(N * K) full array filters on every render tick
  const filterCountsMap = useMemo(() => {
    const counts = { ALL: baseFiltered.length, HAS_DRAFT: 0 };
    for (let i = 0; i < baseFiltered.length; i++) {
      const s = baseFiltered[i];
      if (draftsMap[s.id]) {
        counts.HAS_DRAFT = (counts.HAS_DRAFT || 0) + 1;
      }
      if (s.state) {
        counts[s.state] = (counts[s.state] || 0) + 1;
      }
    }
    return counts;
  }, [baseFiltered, draftsMap]);

  const hasDrafts = useMemo(() => {
    return Object.keys(draftsMap).length > 0 || loadDraftsBox().length > 0;
  }, [draftsMap]);

  const latestCompletedTimeByRepo = useMemo(() => {
    const map = {};
    sessions.forEach(other => {
      if (other.state === "COMPLETED") {
        const repo = other.sourceContext?.source;
        if (repo) {
          const completionTime = parseDateMs(other.updateTime || other.createTime);
          if (!map[repo] || completionTime > map[repo]) {
            map[repo] = completionTime;
          }
        }
      }
    });
    return map;
  }, [sessions]);

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0}}>
      <div style={{
        padding: sidebarCollapsed ? "12px 8px" : (scrolled ? "8px 16px 8px" : "12px 16px 0"),
        background: T.surface, borderBottom: `1px solid ${T.border}33`, flexShrink: 0,
        transition: "padding .2s cubic-bezier(0.4, 0, 0.2, 1), background .2s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 5, contain: "layout"
      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:sidebarCollapsed?"center":"flex-start",gap:sidebarCollapsed?4:8,marginBottom:(scrolled||sidebarCollapsed)?0:10}}>
          <div style={{width:scrolled?20:32,height:scrolled?20:32,borderRadius:6,background:T.brand,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:scrolled?11:18,fontWeight:900,color:"#000",boxShadow:scrolled?"none":`0 0 12px ${T.brandDark}40`,flexShrink:0,transition:"all .2s cubic-bezier(0.4, 0, 0.2, 1)"}}>J</div>
          {!sidebarCollapsed && (
            <div style={{minWidth:0, transition:"all .2s cubic-bezier(0.4, 0, 0.2, 1)", flex: 1}}>
              <div style={{display:"flex", alignItems:"center", gap:6}}>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:scrolled?12:14,fontWeight:700,color:T.text}}>JULES</div>
                {active > 0 && !scrolled && (
                  <span aria-label={`${active} active sessions`} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:800,color:T.amber,background:T.amberDim,padding:"1px 5px",borderRadius:4,border:`1px solid ${T.amber}30`}}>⚡ {active}</span>
                )}
              </div>
              {!scrolled && (
                <div
                  role="status"
                  aria-live="polite"
                  aria-label={`Session list state: ${refreshing ? "Syncing updates" : justRefreshed ? "Up to date" : countdown > 0 ? `Synced, next auto update in ${countdown} seconds` : "Stale, click to sync"}`}
                  style={{display:"flex", alignItems:"center", gap:4, marginTop:1}}
                >
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                    background: refreshing ? T.brandLight : justRefreshed ? "#34d399" : countdown > 0 ? T.brand : T.amber,
                    boxShadow: refreshing ? `0 0 6px ${T.brandLight}` : justRefreshed ? "0 0 6px #34d399" : countdown > 0 ? `0 0 6px ${T.brand}` : `0 0 6px ${T.amber}`,
                    animation: refreshing ? "dot 0.8s infinite alternate" : countdown > 0 ? "none" : "dot 1.5s infinite"
                  }}/>
                  <span style={{
                    fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
                    color: refreshing ? T.brandLight : justRefreshed ? "#34d399" : countdown > 0 ? T.muted : T.amber,
                    letterSpacing:"0.04em"
                  }}>
                    {refreshing ? "SYNCING..." : justRefreshed ? "UP TO DATE" : countdown > 0 ? `SYNCED · ${countdown}S` : "STALE · SYNC"}
                  </span>
                </div>
              )}
            </div>
          )}
          <div style={{marginLeft:"auto",display:"flex",gap:4,alignItems:"center",flexShrink:0}}>
            {!sidebarCollapsed && (
              <>
                <button onClick={toggleSearch} title="Search sessions (Press /)" aria-label="Search sessions (Press forward slash to search)" style={{width:28,height:28,borderRadius:5,background:"transparent",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Ic n="search" s={14} c={searchOpen||searchQuery?T.blue:T.muted}/></button>
                {isDesktop && <button onClick={onNew} title="New Session" aria-label="New Session" style={{width:28,height:28,borderRadius:5,background:"transparent",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Ic n="plus" s={14} c={T.brand}/></button>}
                {isDesktop && (
                  <button
                    onClick={onDrafts}
                    title={hasDrafts ? "Drafts Box (Has saved drafts)" : "Drafts Box"}
                    aria-label={hasDrafts ? "Drafts Box (Has saved drafts)" : "Drafts Box"}
                    style={{
                      width:28,
                      height:28,
                      borderRadius:5,
                      background:"transparent",
                      border:"none",
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"center",
                      cursor:"pointer",
                      position:"relative"
                    }}
                  >
                    <Ic n="layers" s={14} c={hasDrafts ? T.amber : T.muted}/>
                    {hasDrafts && (
                      <span
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: T.amber,
                          boxShadow: `0 0 4px ${T.amber}`
                        }}
                      />
                    )}
                  </button>
                )}
                {isDesktop && (
                  <button onClick={onSettings} title="Settings" aria-label="Settings" style={{width:28,height:28,borderRadius:5,background:"transparent",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Ic n="settings" s={14} c={T.muted}/></button>
                )}
                <div style={{display:"flex", alignItems:"center", gap:4}}>
                  <button
                    onClick={onRefresh}
                    disabled={refreshing}
                    title={`Refresh now ${countdown > 0 ? `(Auto in ${countdown}s)` : ""}`}
                    aria-label="Refresh session list"
                    style={{
                      background:"none", border:"none", cursor:refreshing?"default":"pointer",
                      display:"flex", padding:4, borderRadius:20, transition:"all .15s cubic-bezier(0.4, 0, 0.2, 1)",
                      background:refreshing?T.brandDim:"transparent",
                      position:"relative",
                      outline: countdown > 0 && !refreshing ? `1px solid ${T.brand}10` : "none",
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = "scale(0.9)"}
                    onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                  >
                    {countdown > 0 && !refreshing && (
                      <svg style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)", width: "100%", height: "100%", pointerEvents: "none" }}>
                        <circle
                          cx="50%" cy="50%" r="42%"
                          fill="none" stroke={T.brand} strokeWidth="2"
                          strokeDasharray="100%"
                          strokeDashoffset={`${100 - (countdown / (pollInterval / 1000 || 1)) * 100}%`}
                          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)", opacity: 0.35 }}
                        />
                      </svg>
                    )}
                    <div style={{ display: "flex", animation: refreshing ? "spin 1s linear infinite" : "none" }}>
                      <Ic n={justRefreshed ? "check" : "refresh"} s={16} c={refreshing?T.brand:(justRefreshed?T.brandLight:T.textDim)}/>
                    </div>
                  </button>
                </div>
              </>
            )}
            {onCloseMobileDrawer && (
              <button
                onClick={onCloseMobileDrawer}
                title="Close Drawer"
                aria-label="Close Drawer"
                style={{width:28,height:28,borderRadius:5,background:"transparent",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}
              >
                <Ic n="x" s={14} c={T.muted}/>
              </button>
            )}
            {!isDesktop && onToggleMobileDrawer && !onCloseMobileDrawer && (
              <button
                onClick={onToggleMobileDrawer}
                title="Open Sidebar Drawer"
                aria-label="Open Sidebar Drawer"
                style={{width:28,height:28,borderRadius:5,background:"transparent",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}
              >
                <Ic n="layout_toggle" s={14} c={T.brand}/>
              </button>
            )}
            {isDesktop && setSidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                aria-label={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                style={{width:28,height:28,borderRadius:5,background:"transparent",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}
              >
                <Ic n={sidebarCollapsed ? "chevron_right" : "layout_toggle"} s={14} c={T.muted}/>
              </button>
            )}
          </div>
        </div>
        {error && (
          <div style={{
            background:T.redDim, border:`1px solid ${T.red}40`, borderRadius:6,
            padding:"8px 12px", marginBottom:12, display:"flex", alignItems:"center", gap:10,
            animation:"fadeIn .2s ease"
          }}>
            <Ic n="x" s={14} c={T.red}/>
            <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.red, flex:1}}>{error}</span>
            <button onClick={clearError} title="Clear error" aria-label="Clear error" style={{background:"none", border:"none", cursor:"pointer", padding:2}}><Ic n="x" s={12} c={T.red}/></button>
          </div>
        )}
        {!sidebarCollapsed && (searchOpen || searchQuery) && (
          <div style={{height:scrolled?0:42, overflow:"hidden", opacity:scrolled?0:1, transition:"all .25s cubic-bezier(0.4, 0, 0.2, 1)", marginBottom:scrolled?0:8, padding:scrolled?0:"4px 2px", pointerEvents:scrolled?"none":"auto"}}>
            <div style={{position:"relative", display:"flex", alignItems:"center"}}>
              <div style={{position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none"}}><Ic n="search" s={14} c={T.blue}/></div>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by title, prompt or ID..."
                aria-label="Search by title, prompt or ID"
                maxLength={200}
                style={{...inputSt, paddingLeft:34, paddingRight: searchQuery ? 34 : 48, borderColor:T.blue+"40", background:T.surfaceHi}}
                autoFocus
                onKeyDown={e => {
                  if (e.key === "Escape") {
                    if (searchQuery) {
                      setSearchQuery("");
                    } else {
                      setSearchOpen(false);
                    }
                  }
                }}
              />
              {!searchQuery && (
                <div style={{position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", display:"flex", alignItems:"center"}}>
                  <kbd style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: "9px",
                    fontWeight: 700,
                    color: T.muted,
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: "4px",
                    padding: "2px 4px",
                    lineHeight: 1,
                  }}>ESC</kbd>
                </div>
              )}
              {searchQuery && <button onClick={() => setSearchQuery("")} title="Clear search query" aria-label="Clear search query" style={{position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:4}}><Ic n="x" s={14} c={T.muted}/></button>}
            </div>
          </div>
        )}
        {isDesktop && !sidebarCollapsed && (
          <div style={{display:"flex", gap:4, alignItems:"center", height:scrolled?0:22, overflow:"hidden", opacity:scrolled?0:1, marginBottom:scrolled?0:8, padding:scrolled?0:"4px 2px", transition:"all .25s cubic-bezier(0.4, 0, 0.2, 1)", pointerEvents:scrolled?"none":"auto"}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.textDim, letterSpacing:"0.08em", flexShrink:0, paddingRight:2}}>SESSIONS</span>
            <button onClick={() => setShowArchived(false)} aria-pressed={!showArchived ? "true" : "false"} aria-label="Show active sessions" title="Show active sessions" style={{flexShrink:0, minHeight:36, padding:"0 14px", display:"inline-flex", alignItems:"center", justifyContent:"center", borderRadius:20, border:"none", background:!showArchived ? T.brandDim : "transparent", border:`1px solid ${!showArchived ? T.brand+"60" : T.border}`, color:!showArchived ? T.brand : T.muted, fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:!showArchived?700:400, letterSpacing:"0.05em", cursor:"pointer", transition:"all .12s cubic-bezier(0.4, 0, 0.2, 1)"}}>ACTIVE</button>
            <button onClick={() => setShowArchived(true)} aria-pressed={showArchived ? "true" : "false"} aria-label="Show archived sessions" title="Show archived sessions" style={{flexShrink:0, minHeight:36, padding:"0 14px", display:"inline-flex", alignItems:"center", justifyContent:"center", borderRadius:20, border:"none", background:showArchived ? T.purpleDim : "transparent", border:`1px solid ${showArchived ? T.purple+"60" : T.border}`, color:showArchived ? T.purple : T.muted, fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:showArchived?700:400, letterSpacing:"0.05em", cursor:"pointer", transition:"all .12s cubic-bezier(0.4, 0, 0.2, 1)"}}>ARCHIVED</button>
          </div>
        )}
        {availableRepos.length > 0 && !sidebarCollapsed && (
          <div style={{position:"relative", marginBottom:scrolled?0:6, padding:"0 2px"}}>
            <button
              onClick={() => setRepoPickerOpen(!repoPickerOpen)}
              aria-expanded={repoPickerOpen}
              aria-label={`Filter sessions by repository. Currently selected: ${repoFilter}`}
              title={`Filter by repository (${repoFilter})`}
              style={{
                width:"100%", padding:"5px 10px", borderRadius:6,
                background: repoFilter !== "ALL" ? `${T.brand}15` : T.surfaceHi,
                border: `1px solid ${repoFilter !== "ALL" ? T.brand : T.border}`,
                color: repoFilter !== "ALL" ? T.brandLight : T.textDim,
                fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: "pointer", transition: "all .12s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            >
              <div style={{display:"flex", alignItems:"center", gap:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                <Ic n="code" s={12} c={repoFilter !== "ALL" ? T.brandLight : T.muted}/>
                <span style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                  {repoFilter === "ALL" ? "ALL REPOSITORIES" : repoFilter}
                </span>
              </div>
              <Ic n="chevron_down" s={12} c={T.muted}/>
            </button>
            {repoPickerOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setRepoPickerOpen(false)}/>
                <div style={{
                  position:"absolute", top:"100%", left:2, right:2, zIndex:101, marginTop:4,
                  background:T.surfaceHi, border:`1px solid ${T.borderHi}`, borderRadius:6,
                  maxHeight:180, overflowY:"auto", boxShadow:"0 10px 25px rgba(0,0,0,0.5)", padding:4
                }}>
                  <button
                    onClick={() => { setRepoFilter("ALL"); setRepoPickerOpen(false); }}
                    style={{
                      width:"100%", padding:"8px 10px", background: repoFilter === "ALL" ? `${T.brand}20` : "none",
                      border: "none", borderRadius: 4, textAlign: "left", cursor: "pointer",
                      fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: repoFilter === "ALL" ? 800 : 500,
                      color: repoFilter === "ALL" ? T.brandLight : T.text, display: "flex", alignItems: "center", gap: 6
                    }}
                  >
                    <Ic n="code" s={12} c={repoFilter === "ALL" ? T.brandLight : T.muted}/>
                    ALL REPOSITORIES ({sessions.length})
                  </button>
                  {availableRepos.map(repo => {
                    const isSel = repoFilter === repo;
                    const count = repoCountsMap[repo] || 0;
                    return (
                      <button
                        key={repo}
                        onClick={() => { setRepoFilter(repo); setRepoPickerOpen(false); }}
                        style={{
                          width:"100%", padding:"8px 10px", background: isSel ? `${T.brand}20` : "none",
                          border: "none", borderRadius: 4, textAlign: "left", cursor: "pointer",
                          fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: isSel ? 800 : 500,
                          color: isSel ? T.brandLight : T.text, display: "flex", alignItems: "center", justifyContent: "space-between",
                          transition: "background .1s ease"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = isSel ? `${T.brand}25` : T.dim}
                        onMouseLeave={e => e.currentTarget.style.background = isSel ? `${T.brand}20` : "none"}
                      >
                        <div style={{display:"flex", alignItems:"center", gap:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1, marginRight:8}}>
                          <Ic n="code" s={12} c={isSel ? T.brandLight : T.muted}/>
                          <span style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{repo}</span>
                        </div>
                        <span style={{color:T.muted, fontSize:9, fontWeight:700}}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
        {!sidebarCollapsed && (
          <div style={{position: "relative", maxHeight:scrolled?0:60, opacity:scrolled?0:1, transition:"all .25s cubic-bezier(0.4, 0, 0.2, 1)", pointerEvents:scrolled?"none":"auto"}}>
          {!scrolled && <div style={{position:"absolute", right:0, top:0, bottom:10, width:40, background:`linear-gradient(to left, ${T.bg}, transparent)`, pointerEvents:"none", zIndex:2}}/>}
          <div style={{overflowX:"auto", padding:scrolled?0:"4px 2px 10px", scrollbarWidth:"none", WebkitOverflowScrolling:"touch"}}>
            <div style={{display:"flex",gap:5,minWidth:"max-content",padding:"4px 0", alignItems:"center"}}>
              <div
                role="region"
                aria-label={`Quota usage: ${todayCount.total} of ${plan?.daily || 15} tasks started, ${todayCount.done} PRs created`}
                title={`QUOTA USAGE\nStarted: ${todayCount.total} of ${plan?.daily || 15}\nPRs Created: ${todayCount.done}\nIn Progress: ${todayCount.total - todayCount.done}\nNext Recovery: ${todayCount.nextResetTs ? fmtTime(todayCount.nextResetTs) : "N/A"} (${todayCount.resetIn})`}
                style={{
                  display:"flex", alignItems:"center", gap:9, padding:"6px 14px", borderRadius:22,
                  background:`linear-gradient(135deg, ${T.surfaceHi}, ${T.bg})`,
                  border:`1px solid ${T.borderHi}`, marginRight:10, flexShrink:0, cursor:"help",
                  boxShadow:`0 4px 12px rgba(0,0,0,0.3), inset 0 0 10px ${T.brand}05`,
                  transition:"all .2s cubic-bezier(0.4, 0, 0.2, 1)", position:"relative", overflow:"hidden"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.borderColor = T.brandDark;
                  e.currentTarget.style.boxShadow = `0 6px 16px rgba(0,0,0,0.4), inset 0 0 15px ${T.brand}10`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = T.borderHi;
                  e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.3), inset 0 0 10px ${T.brand}05`;
                }}
              >
                {/* Visual indicator bar */}
                <div style={{
                  position:"absolute", bottom:0, left:0, height:2,
                  width:`${Math.min(100, (todayCount.total / (plan?.daily || 15)) * 100)}%`,
                  background:todayCount.total >= (plan?.daily||15) ? T.red : todayCount.total / (plan?.daily||15) > 0.8 ? T.amber : T.brand,
                  opacity:0.6, transition:"width .5s cubic-bezier(0.4, 0, 0.2, 1)"
                }}/>

                <div style={{
                  width:7, height:7, borderRadius:"50%",
                  background:todayCount.total >= (plan?.daily||15) ? T.red : todayCount.total / (plan?.daily||15) > 0.8 ? T.amber : T.brandLight,
                  boxShadow:`0 0 10px ${todayCount.total / (plan?.daily||15) > 0.8 ? T.amber : T.brandLight}80`,
                  animation: todayCount.total >= (plan?.daily||15) ? "dot 1s infinite" : "none"
                }}/>

                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                    <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:800, color:T.text, letterSpacing:"-0.03em"}}>
                      {todayCount.total}
                    </span>
                    <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.dim, fontWeight:500}}>/</span>
                    <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.dim, fontWeight:700}}>
                      {plan?.daily || 15}
                    </span>
                  </div>

                  <div style={{ width: 1, height: 12, background: T.border, margin: "0 4px" }} />

                  <div style={{ display: "flex", alignItems: "center", gap: 3, background:T.brandDim, padding:"2px 6px", borderRadius:4, border:`1px solid ${T.brand}20` }}>
                    <Ic n="git_pull" s={11} c={T.brandLight}/>
                    <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:900, color:T.brandLight}}>
                      {todayCount.done}
                    </span>
                  </div>
                </div>
              </div>
              {FILTERS.map(f => {
                const cnt = filterCountsMap[f] || 0;
                if (cnt===0 && f!=="ALL" && f!==filter) return null;
                const isAct = f===filter;
                const ac = STATUS_META[f]?.color || T.brand;
                const labelText = FILTER_LABELS[f]||f;
                return (
                  <button
                    key={f}
                    onClick={()=>setFilter(f)}
                    aria-pressed={isAct ? "true" : "false"}
                    aria-label={`Filter by ${labelText}${cnt > 0 ? `, ${cnt} sessions` : ""}`}
                    title={`Filter by ${labelText}${cnt > 0 ? ` (${cnt})` : ""}`}
                    style={{flexShrink:0, minHeight:36, padding:"0 14px", display:"inline-flex", alignItems:"center", justifyContent:"center", borderRadius:20,border:"none",background:isAct?`${ac}20`:"transparent",border:`1px solid ${isAct?`${ac}80`:T.border}`,color:isAct?ac:T.muted,fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,letterSpacing:"0.06em",cursor:"pointer",transition:"background .12s cubic-bezier(0.4, 0, 0.2, 1), color .12s cubic-bezier(0.4, 0, 0.2, 1)"}}
                  >{labelText} {cnt>0?cnt:""}</button>
                );
              })}
            </div>
          </div>
        </div>
        )}
      </div>
      <div onScroll={handleScroll} style={{flex:1,overflowY:"auto",padding:sidebarCollapsed?"8px 4px":"10px 12px",WebkitOverflowScrolling:"touch",minHeight:200}}>
        {refreshing&&sessions.length===0&&<div style={{textAlign:"center",padding:"50px 0",fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.textDim}}>Loading sessions…</div>}
        {!refreshing&&filtered.length===0&&(() => {
          let icon = "tasks", color = T.brand, bg = T.brandDim, titleText = "NO SESSIONS", descText = "No sessions found.", ctaText = null, ctaAction = null;
          if (sessions.length === 0) {
            icon = "database"; color = T.brand; bg = T.brandDim; titleText = "GET STARTED"; descText = "Create your first coding session to begin working with Jules."; ctaText = "CREATE SESSION"; ctaAction = onNew;
          } else if (searchQuery.trim() !== "") {
            icon = "search"; color = T.blue; bg = T.blueDim; titleText = "NO MATCHES"; descText = `No results found for "${searchQuery}".`; ctaText = "CLEAR SEARCH"; ctaAction = () => setSearchQuery("");
          } else if (filter !== "ALL") {
            const meta = STATUS_META[filter] || {}; icon = meta.icon || "tasks"; color = meta.color || T.brand; bg = meta.bg || T.brandDim; titleText = `NO ${meta.label || filter}`; descText = `No sessions are currently in ${meta.label || filter} status.`; ctaText = "SHOW ALL SESSIONS"; ctaAction = () => setFilter("ALL");
          } else if (showArchived) {
            icon = "archive"; color = T.purple; bg = T.purpleDim; titleText = "ARCHIVE EMPTY"; descText = "You have no archived sessions."; ctaText = "VIEW ACTIVE"; ctaAction = () => setShowArchived(false);
          } else {
            icon = "tasks"; color = T.brand; bg = T.brandDim; titleText = "NO ACTIVE SESSIONS"; descText = "There are no active sessions to display."; ctaText = "CREATE SESSION"; ctaAction = onNew;
          }
          return (
            <div role="status" style={{textAlign:"center", padding:"36px 16px", background:T.surface, border:`1px dashed ${T.border}`, borderRadius:12, margin:"12px 4px", display:"flex", flexDirection:"column", alignItems:"center", gap:14, animation:"fadeIn .3s ease"}}>
              <div style={{width:44, height:44, borderRadius:"50%", background:bg, border:`1px solid ${color}30`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 6px 12px rgba(0,0,0,0.15)"}}><Ic n={icon} s={18} c={color}/></div>
              <div>
                <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:900, color, letterSpacing:"0.08em", marginBottom:4}}>{titleText}</div>
                <div style={{fontFamily:"'IBM Plex Sans',sans-serif", fontSize:13, color:T.textDim, lineHeight:1.4, maxWidth:260, margin:"0 auto"}}>{descText}</div>
              </div>
              {ctaText && ctaAction && (
                <button onClick={ctaAction} title={ctaText} aria-label={ctaText} style={{marginTop:4, padding:"8px 16px", borderRadius:6, border:"none", background:color, color:"#000", cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:900, letterSpacing:"0.06em", transition:"all .15s ease", boxShadow:`0 4px 12px ${color}30`}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-1px)"} onMouseLeave={e=>e.currentTarget.style.transform="none"}>{ctaText}</button>
              )}
            </div>
          );
        })()}
        {sidebarCollapsed ? (
          <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:8, paddingTop:4}}>
            <button onClick={onNew} title="New Session" aria-label="New Session" style={{width:36, height:36, borderRadius:8, background:T.brandDim, border:`1px solid ${T.brand}40`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer"}}><Ic n="plus" s={18} c={T.brand}/></button>
            <button onClick={toggleSearch} title="Search Sessions" aria-label="Search Sessions" style={{width:36, height:36, borderRadius:8, background:T.surfaceHi, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer"}}><Ic n="search" s={16} c={T.muted}/></button>
            <button onClick={onDrafts} title="Drafts Box" aria-label="Drafts Box" style={{width:36, height:36, borderRadius:8, background:T.surfaceHi, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative"}}><Ic n="layers" s={16} c={hasDrafts ? T.amber : T.muted}/></button>
            <button onClick={onSettings} title="Settings" aria-label="Settings" style={{width:36, height:36, borderRadius:8, background:T.surfaceHi, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer"}}><Ic n="settings" s={16} c={T.muted}/></button>
            <button onClick={onRefresh} disabled={refreshing} title="Refresh Sessions" aria-label="Refresh Sessions" style={{width:36, height:36, borderRadius:8, background:T.surfaceHi, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer"}}><Ic n={justRefreshed ? "check" : "refresh"} s={16} c={refreshing ? T.brand : T.muted}/></button>

            <div style={{width:24, height:1, background:T.border, margin:"6px 0"}}/>

            {filtered.map((s, i) => {
              const isSelected = s.id === selectedId;
              const meta = STATUS_META[s.state] || STATUS_META.QUEUED;
              return (
                <button
                  key={s.id || s.name}
                  onClick={() => onSelect(s)}
                  title={`${i+1}. ${s.title || s.prompt} (${meta.label})`}
                  aria-label={`Session ${i+1}: ${s.title || s.prompt}. Status: ${meta.label}`}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: isSelected ? `${T.brand}25` : T.surfaceHi,
                    border: isSelected ? "none" : `1px solid ${T.border}`,
                    display: "flex", alignItems: "center", justifyContent:"center",
                    cursor: "pointer", position: "relative",
                    transition: "all .15s ease"
                  }}
                >
                  <Ic n={meta.icon} s={16} c={isSelected ? T.brand : meta.color}/>
                </button>
              );
            })}
          </div>
        ) : (
          filtered.map((s,i)=><SessionCard key={s.id||s.name} index={i+1} s={s} onSelect={onSelect} isSelected={s.id===selectedId} activities={activitiesMap[s.id] || EMPTY_ARR} stats={activityStatsMap[s.id]} lastReadTs={readMap[s.id]} latestCompletedTime={latestCompletedTimeByRepo[s.sourceContext?.source]} hasFollowupDraft={!!draftsMap[s.id]}/>)
        )}
      </div>
    </div>
  );
};

// ─── Quota Tracker hook ────────────────────────────────────────────────────────
/**
 * useQuotaTracker
 *
 * Custom hook that encapsulates the daily quota tracking, session registry management,
 * rolling 24-hour window computations, and upcoming/recent quota resets calculations.
 *
 * Exposes:
 *  - todayCount: { total, done, resetIn, nextResetTs, upcomingResets, recentResets }
 *  - registerSessions(sessionsList)
 *  - registerSession(sessionObj)
 */
