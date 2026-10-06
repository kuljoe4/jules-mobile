const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isBulkSelected === nextProps.isBulkSelected &&
    prevProps.selectionMode === nextProps.selectionMode &&
    prevProps.index === nextProps.index &&
    prevProps.lastReadTs === nextProps.lastReadTs &&
    prevProps.hasFollowupDraft === nextProps.hasFollowupDraft &&
    prevProps.latestCompletedTime === nextProps.latestCompletedTime &&
    prevProps.s.id === nextProps.s.id &&
    prevProps.s.state === nextProps.s.state &&
    prevProps.s.title === nextProps.s.title &&
    prevProps.s.prompt === nextProps.s.prompt &&
    prevProps.s.updateTime === nextProps.s.updateTime &&
    prevProps.s.createTime === nextProps.s.createTime &&
    prevProps.activities === nextProps.activities &&
    prevProps.stats === nextProps.stats
  );
};

// OPTIMIZATION (Bolt): Support reference-stable `onSelect` callback in SessionCard alongside `onPress`.
// Passing a stable `onSelect` prop directly from SessionList avoids creating inline closures on every
// render pass (such as 1-second countdown ticks), allowing React.memo on SessionCard to successfully skip re-renders.
const SessionCard = memo(({ s, onPress, onSelect, isSelected, isBulkSelected, onToggleSelect, selectionMode, index, activities = [], stats, lastReadTs, latestCompletedTime, hasFollowupDraft }) => {
  const cardRef = useRef(null);
  const [ghPrNonce, setGhPrNonce] = useState(0);

  const handleClick = useCallback(() => {
    if (onSelect) onSelect(s);
    else if (onPress) onPress(s);
  }, [onSelect, onPress, s]);

  const isActuallyDone = useMemo(() => {
    return getIsActuallyDone(s.state, activities);
  }, [activities, s.state]);
  const currentState = isActuallyDone ? "COMPLETED" : s.state;

  const driftDetected = useMemo(() => {
    if (currentState === "COMPLETED") return false;
    if (!latestCompletedTime) return false;
    const currentStart = parseDateMs(s.createTime);
    return latestCompletedTime > currentStart;
  }, [s.createTime, latestCompletedTime, currentState]);

  const isWorking = ACTIVE_STATES.has(currentState);
  const isFinished = currentState === "COMPLETED" || currentState === "FAILED";
  const updateTs = s.updateTime || s.createTime;
  const isUnread = isFinished && (!lastReadTs || updateTs > lastReadTs);

  const m    = STATUS_META[currentState] || STATUS_META.QUEUED;
  const rawRepo = s.sourceContext?.githubRepoContext ? s.sourceContext.source?.replace("sources/github/","") : null;
  const repo = useMemo(() => {
    if (!rawRepo) return null;
    const name = rawRepo.includes("/") ? rawRepo.split("/")[1] : rawRepo;
    if (!name) return rawRepo;
    return name.length > 16 ? `${name.slice(0, 7)}…${name.slice(-6)}` : name;
  }, [rawRepo]);
  const pri  = useMemo(() => getPRInfo(s, activities), [s, activities, ghPrNonce]);
  const b    = useMemo(() => getBranchInfo(s, activities), [s, activities, ghPrNonce]);
  // OPTIMIZATION (Bolt): Removed dead/unused `checkStatus` calculation. `activeCheck` evaluates `b.checks` directly,
  // avoiding redundant `getCheckStatus` calls and array traversals on every session card render pass.

  const activeCheck = useMemo(() => {
    const isFresh = parseDateMs(s.updateTime || s.createTime) > (Date.now() - 15 * 60 * 1000);
    const isRelevantSession = isSelected || isWorking || (isFinished && isFresh);
    if (!isRelevantSession) return null;

    if (b?.checks && (b.checksSource === "base" || b.working === b.base)) {
      if (b.checks.state === "success") return null;
      return b.checks;
    }
    return null;
  }, [b, isSelected, isWorking, isFinished, s.updateTime, s.createTime]);

  const titleStyle = useMemo(() => {
    if (!activeCheck) {
      return {
        color: isSelected ? T.textHi : T.textDim,
        background: "transparent",
        padding: "0",
        borderRadius: 0,
        border: "none"
      };
    }
    const isFailure = activeCheck.state === "failure";
    const highlightColor = isFailure ? T.red : T.amber;
    return {
      color: isSelected ? T.textHi : highlightColor,
      background: `${highlightColor}15`,
      padding: "2px 6px",
      borderRadius: 4,
      border: `1px solid ${highlightColor}30`
    };
  }, [activeCheck, isSelected]);

  const ahead = useMemo(() => getAheadCount(activities), [activities]);

  const pr = useMemo(() => getPR(s), [s]);
  const prUrl = pr?.url;
  const context = s.sourceContext?.githubRepoContext;
  const base = context?.startingBranch || "main";

  // Check for group hashtag in prompt
  const groupMatch = s.prompt?.match(/#group-([a-zA-Z0-9]+)/);
  const groupId = groupMatch ? groupMatch[1] : null;

  useEffect(() => {
    const h = (e) => {
      const detail = e.detail || {};
      if (detail.url && prUrl && detail.url === prUrl) {
        setGhPrNonce(n => n + 1);
      } else if (detail.key && repo && b?.working) {
        const expectedKey = `${repo}:${base}:${b.working}`;
        if (detail.key === expectedKey) {
          setGhPrNonce(n => n + 1);
        }
      } else if (!detail.url && !detail.key) {
        setGhPrNonce(n => n + 1);
      }
    };
    window.addEventListener("gh-pr-updated", h);
    return () => window.removeEventListener("gh-pr-updated", h);
  }, [prUrl, repo, base, b?.working]);

  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected]);

  const activityStats = useMemo(() => {
    if (stats) return stats;
    return {
      count: activities.length,
      size: getActivitiesSize(activities)
    };
  }, [activities, stats]);

  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (activityStats.count > 0) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 20000);
      return () => clearTimeout(t);
    }
  }, [activityStats.count, activityStats.size]);

  const isVHighActivity = activityStats.count >= 300 || activityStats.size >= 5 * 1024 * 1024;
  const isHighActivity = activityStats.count >= 200 || activityStats.size >= 1 * 1024 * 1024;
  const highActivityStyle = isVHighActivity
    ? { color: T.red, fontWeight: 800, background: `${T.red}20`, padding: "1px 4px", borderRadius: 3, opacity: 1 }
    : isHighActivity
    ? { color: T.amber, fontWeight: 800, background: `${T.amber}20`, padding: "1px 4px", borderRadius: 3, opacity: 1 }
    : {};

  const bg = isSelected ? T.brandDim : T.surface;
  const borderColor = isSelected ? `${T.brand}55` : T.border;

  return (
    <button ref={cardRef} onClick={handleClick}
      aria-label={`Session ${index}: ${s.title || s.prompt}. Status: ${m.label}. ${isUnread ? "New activity." : ""}`}
      style={{
        width:"100%", background:bg, textAlign:"left", cursor:"pointer",
        border: `1px solid ${borderColor}`,
        borderRadius:8, padding:"12px 14px", marginBottom:8, transition:"all .18s cubic-bezier(0.16, 1, 0.3, 1)",
        position:"relative",
        minHeight:52,
        outline:"none",
        boxShadow: isSelected ? `0 0 16px ${T.brand}14, inset 0 0 0 1px ${T.brand}30` : "0 1px 3px rgba(0,0,0,0.25)",
        zIndex: isSelected ? 2 : 1,
      }}
      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.background = T.surfaceHi; } }}
      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface; } }}
      onFocus={e => e.currentTarget.style.borderColor = T.brand}
      onBlur={e => e.currentTarget.style.borderColor = borderColor}
    >
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"nowrap",width:"100%",overflow:"hidden"}}>

        <div style={{ position: "relative", width: 16, height: 16, flexShrink: 0, marginRight: 2 }}>
        {selectionMode ? (
          <button
            onClick={(e) => { e.stopPropagation(); if (onToggleSelect) onToggleSelect(s.id); }}
            title={isBulkSelected ? "Deselect session" : "Select session"}
            aria-label={isBulkSelected ? "Deselect session" : "Select session"}
            aria-checked={isBulkSelected}
            role="checkbox"
            style={{
              width: 18, height: 18, borderRadius: 4, flexShrink: 0,
              border: `1px solid ${isBulkSelected ? T.brand : T.border}`,
              background: isBulkSelected ? T.brand : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all .15s ease",
            }}
          >
            {isBulkSelected && <Ic n="check" s={11} c="#07090e" />}
          </button>
        ) : (
          <div style={{width:16, height:16, display:"flex", alignItems:"center", fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.muted,fontWeight:700,opacity:0.4,flexShrink:0}}>{index}</div>
        )}
        {!selectionMode && (
          <button
            title="Select session"
            aria-label="Select session"
            onClick={(e) => { e.stopPropagation(); if (onToggleSelect) onToggleSelect(s.id); }}
            style={{ position: "absolute", inset: -6, opacity: 0, cursor: "pointer", border: "none", background: "transparent" }}
          />
        )}
      </div>

        <div
          title={m.label}
          aria-label={`Status: ${m.label}`}
          style={{display:"flex",alignItems:"center",justifyContent:"center",width:18,height:18,background:"transparent",flexShrink:0}}
        >
          <div style={{ display: "flex", animation: currentState === "IN_PROGRESS" ? "spin 2.5s linear infinite" : "none" }}>
            <Ic n={m.icon} s={12} c={m.color}/>
          </div>
        </div>
        <div
          title={activeCheck ? `Base branch check status: ${activeCheck.label || activeCheck.state}` : undefined}
          style={{
            flex:1, minWidth:0, fontFamily:"'Plus Jakarta Sans','IBM Plex Sans',sans-serif", fontSize:13, fontWeight:600,
            lineHeight:1.35, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            letterSpacing:"-0.01em",
            transition: "all .15s ease",
            ...titleStyle
          }}
        >
          {s.title||s.prompt}
        </div>
        {activeCheck && (
          <div
            title={`Checks: ${activeCheck.label || activeCheck.state}`}
            aria-label={`Checks: ${activeCheck.label || activeCheck.state}`}
            style={{display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}
          >
            {activeCheck.state === "success" && <Ic n="check" s={11} c="#34d399"/>}
            {activeCheck.state === "failure" && <Ic n="x" s={11} c={T.red}/>}
            {(activeCheck.state === "pending" || (activeCheck.state !== "success" && activeCheck.state !== "failure")) && (
              <div style={{display:"flex", animation:"spin 2s linear infinite"}}>
                <Ic n="refresh" s={10} c={T.amber}/>
              </div>
            )}
          </div>
        )}
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,color:T.muted,fontWeight:500,opacity:0.6,flexShrink:0,marginLeft:activeCheck ? 2 : "auto"}}>
          {fmtAgo(parseDateMs(s.updateTime||s.createTime))}
        </div>
      </div>

      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:"6px 10px", marginLeft:24, flexWrap:"nowrap", overflow:"hidden"}}>
        <div style={{display:"flex", alignItems:"center", gap:6, flexWrap:"nowrap", minWidth:0, flex:"1 1 auto", overflow:"hidden"}}>
          {groupId && (
            <div title={`Group: ${groupId}`} style={{display:"flex", alignItems:"center", gap:3, flexShrink:0, color:T.brand}}>
              <Ic n="layers" s={9} c={T.brand}/>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,fontWeight:700}}>#{groupId}</span>
              <span style={{color:T.dim, fontSize:9, padding:"0 2px"}}>·</span>
            </div>
          )}
          {repo && (
            <div title={rawRepo} style={{display:"flex", alignItems:"center", gap:3, color:T.muted, flexShrink:1, minWidth:0, overflow:"hidden"}}>
              <Ic n="code" s={10} c={T.dim}/>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{repo}</span>
            </div>
          )}
          {pri && (
            <div style={{display:"flex", alignItems:"center", gap:3, color:pri.state==="merged"?T.purple:T.brand, flexShrink:0}}>
              <span style={{color:T.dim, fontSize:9, padding:"0 2px"}}>·</span>
              <Ic n={pri.state==="merged"?"git_merge":"git_pull"} s={10} c={pri.state==="merged"?T.purple:T.brand}/>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,fontWeight:700}}>#{pri.number}</span>
              {pri.ahead > 0 && <span aria-label={`${pri.ahead} commits ahead`} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8.5,fontWeight:700,color:T.brandLight,marginLeft:2}}>↑{pri.ahead}</span>}
            </div>
          )}
          {(!pri || pri.state === "closed") && b?.isNew && (
            <div style={{display:"flex", alignItems:"center", gap:3, color:T.blue, flexShrink:1, minWidth:0, overflow:"hidden"}}>
              <span style={{color:T.dim, fontSize:9, padding:"0 2px"}}>·</span>
              <Ic n="branch" s={10} c={T.blue}/>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.working}</span>
              {b.ahead > 0 && <span aria-label={`${b.ahead} commits ahead`} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8.5,fontWeight:700,color:T.brandLight,marginLeft:2}}>↑{b.ahead}</span>}
            </div>
          )}
          {driftDetected && (
            <div
              title="Repository base branch has updated (STALE)"
              aria-label="Repository base branch has updated (STALE)"
              style={{
                display:"flex", alignItems:"center", gap:2, color:T.amber, flexShrink:0
              }}
            >
              <span style={{color:T.dim, fontSize:9, padding:"0 2px"}}>·</span>
              <Ic n="wifi" s={9} c={T.amber}/>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700}}>outdated</span>
            </div>
          )}
          {hasFollowupDraft && (
            <div
              title="Has unsent follow-up message draft"
              aria-label="Has unsent follow-up message draft"
              style={{
                display:"flex", alignItems:"center", gap:2, color:T.amberLight, flexShrink:0
              }}
            >
              <span style={{color:T.dim, fontSize:9, padding:"0 2px"}}>·</span>
              <Ic n="layers" s={9} c={T.amberLight}/>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700}}>draft</span>
            </div>
          )}
          {isUnread && <div style={{width:5,height:5,borderRadius:"50%",background:T.brandLight,boxShadow:`0 0 6px ${T.brandLight}`,animation:"dot 1.2s infinite",flexShrink:0,marginLeft:4}}/>}
        </div>

        <div style={{
          display:"flex", alignItems:"center", gap:3,
          background: flash ? `${T.brand}20` : "transparent",
          padding: "1px 4px", borderRadius: 4,
          transition: flash ? "none" : "background 5s cubic-bezier(0.4, 0, 0.2, 1)",
          color: T.muted,
          fontWeight: 500,
          opacity: 0.75,
          flexShrink: 0,
          marginLeft: "auto",
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 9.5
        }}>
          <span style={highActivityStyle}>{activityStats.count}</span>
          <span>/</span>
          <span style={highActivityStyle}>{fmtBytes(activityStats.size/1024)}</span>
        </div>
      </div>
    </button>
  );
}, areEqual);
