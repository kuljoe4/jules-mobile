const ConflictRadar = memo(({ currentSource, currentBranch, currentPrompt, allSessions, activitiesMap, currentSessionId, startTime, limit = 20 }) => {
  const [expanded, setExpanded] = useState(false);
  const [debouncedPrompt, setDebouncedPrompt] = useState(currentPrompt);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPrompt(currentPrompt);
    }, 400);
    return () => clearTimeout(handler);
  }, [currentPrompt]);

  const collisions = useMemo(() => {
    if (!currentSource) return [];

    const currentFiles = new Set(getWorkingSet({ prompt: debouncedPrompt, id: currentSessionId }, activitiesMap[currentSessionId] || []));
    const results = [];
    const relevantSessions = allSessions
      .filter(s => s.id !== currentSessionId)
      .filter(s => s.sourceContext?.source === currentSource)
      .slice(0, limit);

    for (const s of relevantSessions) {
      const isCompleted = s.state === "COMPLETED";
      if (isCompleted) {
        if (!startTime) continue;
        const compTime = parseDateMs(s.updateTime || s.createTime);
        if (compTime <= startTime) continue;
      }

      const acts = activitiesMap[s.id] || [];
      const sFiles = getWorkingSet(s, acts);
      const overlap = sFiles.filter(f => currentFiles.has(f));
      const sameBranch = currentBranch && s.sourceContext?.githubRepoContext?.startingBranch === currentBranch;

      if (overlap.length > 0 || sameBranch) {
        results.push({
          session: s,
          overlap,
          sameBranch,
          risk: overlap.length > 0 ? "HIGH" : "MEDIUM",
          isDrift: isCompleted
        });
      }
    }
    return results;
  }, [currentSource, currentBranch, debouncedPrompt, allSessions, activitiesMap, currentSessionId, startTime, limit]);

  if (collisions.length === 0) {
    if (!currentSource || !currentPrompt.trim()) return null;
    return (
      <div style={{
        marginTop: 12, padding: "8px 14px", background: "rgba(52, 211, 153, 0.05)",
        border: `1px solid rgba(52, 211, 153, 0.2)`, borderRadius: 10,
        display: "flex", alignItems: "center", gap: 8, animation: "fadeIn .3s ease"
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399" }}/>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 800, color: "#34d399", letterSpacing: "0.05em" }}>
          NO CONFLICTS DETECTED · READY TO START
        </span>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: 12, background: "rgba(251, 113, 133, 0.05)",
      border: `1px solid ${T.red}30`, borderRadius: 12,
      overflow: "hidden", animation: "fadeIn .3s ease"
    }}>
      <button
        onClick={() => setExpanded(p => !p)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8, padding: 16,
          textAlign: "left", outline: "none", color: "inherit",
          transition: "background .2s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(251, 113, 133, 0.04)"}
        onMouseLeave={e => e.currentTarget.style.background = "none"}
      >
        <Ic n="wifi" s={16} c={T.red}/>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 900, color: T.red, letterSpacing: "0.05em" }}>
          CONFLICT RADAR
        </span>
        <div style={{ flex: 1, height: 1, background: `${T.red}20` }}/>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T.red, fontWeight: 800, marginRight: 4 }}>
          {collisions.length} ACTIVE RISK{collisions.length !== 1 ? "S" : ""}
        </span>
        <Ic n={expanded ? "chevron_up" : "chevron_down"} s={14} c={T.red}/>
      </button>

      <div id="conflict-radar-detail" style={{
        display: expanded ? "block" : "none",
        maxHeight: expanded ? "2000px" : "0px",
        opacity: expanded ? 1 : 0,
        overflow: "hidden",
        transition: "all .3s cubic-bezier(0.4, 0, 0.2, 1)",
        padding: expanded ? "0 16px 16px" : "0 16px"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {collisions.map((c, i) => (
            <div key={i} style={{
              background: T.surface, padding: 10, borderRadius: 8,
              border: `1px solid ${c.risk === "HIGH" ? T.red + "40" : T.amber + "40"}`,
              position: "relative", overflow: "hidden"
            }}>
              {c.risk === "HIGH" && <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 3, background: T.red }}/>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, paddingLeft: c.risk === "HIGH" ? 6 : 0 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.session.title || c.session.prompt}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <Pill status={c.session.state} small hideLabel />
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.dim }}>{fmtAgo(parseDateMs(c.session.updateTime || c.session.createTime))}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <div style={{
                    background: c.isDrift ? `${T.amber}15` : (c.risk === "HIGH" ? `${T.red}15` : `${T.amber}15`),
                    border: `1px solid ${c.isDrift ? T.amber : (c.risk === "HIGH" ? T.red : T.amber)}30`,
                    borderRadius: 4, padding: "2px 6px", fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 8, color: c.isDrift ? T.amber : (c.risk === "HIGH" ? T.red : T.amber), fontWeight: 800
                  }}>
                    {c.isDrift ? "DRIFT" : c.risk + " RISK"}
                  </div>
                  {c.sameBranch && (
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: T.amber, fontWeight: 700, opacity: 0.8 }}>
                      SAME BASE
                    </div>
                  )}
                </div>
              </div>

              {c.overlap.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6, paddingLeft: c.risk === "HIGH" ? 6 : 0 }}>
                  {c.overlap.map(f => (
                    <span key={f} style={{
                      fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.red,
                      background: `${T.red}10`, padding: "2px 6px", borderRadius: 4,
                      border: `1px solid ${T.red}20`
                    }}>
                      {f.split("/").pop()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12, fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 11, color: T.textDim, lineHeight: 1.5 }}>
          <div style={{ color: T.red, fontWeight: 700, marginBottom: 4, fontSize: 10 }}>⚠️ POTENTIAL MERGE CONFLICTS</div>
          Jules is isolated. These sessions touch the same files or branch. To clear:
          <ul style={{ paddingLeft: 18, marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
            <li>Select a different starting branch for this session</li>
            <li>Wait for conflicting sessions to reach <strong>DONE</strong> state</li>
            <li>Refine prompt to avoid overlapping files</li>
          </ul>
        </div>
      </div>
    </div>
  );
});
