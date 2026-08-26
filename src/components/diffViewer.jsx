/**
 * DiffViewer Component
 * Renders unified diff patches for code changes made during a session,
 * complete with file collapsing, path/diff copy helpers, payload stats, and debug export.
 */
export const DiffViewer = memo(({ activities = [], isDesktop = false }) => {
  const [collapsed, setCollapsed] = useState(null); // null = auto-collapse all on first load
  const [copiedPaths, setCopiedPaths] = useState({}); // gi -> boolean
  const [copiedDiffs, setCopiedDiffs] = useState({}); // gi -> boolean
  const [copiedPlains, setCopiedPlains] = useState({}); // gi -> boolean
  const [copiedOverallDebug, setCopiedOverallDebug] = useState(false);

  const latestPatch = useMemo(() => {
    // Find only the most recent patch artifact
    for (let i = activities.length - 1; i >= 0; i--) {
      const a = activities[i];
      if (a.artifacts) {
        for (const art of a.artifacts) {
          if (art.changeSet?.gitPatch?.unidiffPatch) {
            return {
              patch: art.changeSet.gitPatch.unidiffPatch,
              gitPatch: art.changeSet.gitPatch,
              ts: a.createTime,
              id: a.id || i
            };
          }
        }
      }
    }
    return null;
  }, [activities]);

  const groups = useMemo(() => {
    if (!latestPatch) return [];
    return parseUnidiffPatch(latestPatch.gitPatch || latestPatch.patch, latestPatch.ts);
  }, [latestPatch]);

  const safeCollapsed = useMemo(() => {
    if (collapsed !== null) return collapsed;
    return new Set(groups.map((_, i) => i));
  }, [collapsed, groups]);

  const totalAdds = useMemo(() => groups.reduce((acc, g) => acc + g.adds, 0), [groups]);
  const totalRems = useMemo(() => groups.reduce((acc, g) => acc + g.rems, 0), [groups]);

  const handleCopyPath = (e, file, gi) => {
    e.stopPropagation();
    navigator.clipboard.writeText(file).then(() => {
      setCopiedPaths(prev => ({ ...prev, [gi]: true }));
      setTimeout(() => {
        setCopiedPaths(prev => ({ ...prev, [gi]: false }));
      }, 2000);
    });
  };

  const handleCopyPlain = (e, hunks, gi) => {
    e.stopPropagation();
    const plainLines = [];
    hunks.forEach(h => {
      h.lines.forEach(line => {
        if (line.startsWith("+")) {
          plainLines.push(line.slice(1));
        }
      });
    });
    const plainText = plainLines.join("\n");
    navigator.clipboard.writeText(plainText).then(() => {
      setCopiedPlains(prev => ({ ...prev, [gi]: true }));
      setTimeout(() => {
        setCopiedPlains(prev => ({ ...prev, [gi]: false }));
      }, 2000);
    });
  };

  const handleCopyDiff = (e, rawLines, gi) => {
    e.stopPropagation();
    const diffText = rawLines.join("\n");
    navigator.clipboard.writeText(diffText).then(() => {
      setCopiedDiffs(prev => ({ ...prev, [gi]: true }));
      setTimeout(() => {
        setCopiedDiffs(prev => ({ ...prev, [gi]: false }));
      }, 2000);
    });
  };

  if (groups.length === 0) return (
    <div style={{textAlign:"center",padding:"50px 0",fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.textDim}}>
      No diff available yet
    </div>
  );

  const toggleFile = (idx) => {
    const next = new Set(safeCollapsed);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setCollapsed(next);
  };

  const toggleAll = (doCollapse) => {
    if (doCollapse) setCollapsed(new Set(groups.map((_, i) => i)));
    else setCollapsed(new Set());
  };

  return (
    <div style={{display:"flex", flexDirection:"column", gap:12}}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 4px"}}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:800, color:T.dim, letterSpacing:"0.08em"}}>
            {groups.length} FILE{groups.length!==1?'S':''}
          </div>
          <div style={{display:"flex", alignItems:"center", gap:6, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:800}}>
            <span style={{color:T.brand}}>+{totalAdds}</span>
            <span style={{color:T.red}}>-{totalRems}</span>
          </div>
        </div>
        <div style={{display:"flex", gap:6, alignItems:"center"}}>
          <button
            onClick={() => {
              const debugReport = {
                fileCount: groups.length,
                totalAdds,
                totalRems,
                timestamp: latestPatch?.ts,
                files: groups.map(g => ({
                  file: g.file,
                  adds: g.adds,
                  rems: g.rems,
                  bytes: g.rawLines ? g.rawLines.join("\n").length : 0,
                  formattedSize: fmtBytes((g.rawLines ? g.rawLines.join("\n").length : 0) / 1024),
                  hunkCount: g.hunks.length
                }))
              };
              navigator.clipboard.writeText(JSON.stringify(debugReport, null, 2)).then(() => {
                setCopiedOverallDebug(true);
                setTimeout(() => setCopiedOverallDebug(false), 2000);
              });
            }}
            title="Copy overall diff debug report to clipboard"
            aria-label="Copy overall diff debug report"
            style={{
              padding: "4px 8px", borderRadius: 12, border: `1px solid ${T.purple}40`,
              background: `${T.purple}15`, color: T.purple, cursor: "pointer",
              fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 800,
              display: "inline-flex", alignItems: "center", gap: 4, transition: "all .15s ease"
            }}
          >
            <Ic n="copy" s={10} c={T.purple} />
            {copiedOverallDebug ? "LOG COPIED ✓" : "COPY DEBUG LOG"}
          </button>
          <PickerBtn label="EXPAND" isAct={safeCollapsed.size === 0} onClick={() => toggleAll(false)} />
          <PickerBtn label="COLLAPSE" isAct={safeCollapsed.size === groups.length} onClick={() => toggleAll(true)} />
        </div>
      </div>

      {groups.map((g, gi) => {
        const isCollapsed = safeCollapsed.has(gi);
        const parts = g.file.split("/");
        const base = parts.pop();
        const dir = parts.join("/");

        return (
          <div key={gi} style={{
            background:T.surface, border:`1px solid ${isCollapsed ? T.border : T.borderHi}`,
            borderRadius:8, overflow:"hidden", marginBottom: 4,
            boxShadow: isCollapsed ? "none" : "0 4px 20px rgba(0,0,0,0.2), inset 0 0 1px rgba(255,255,255,0.05)",
            transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)"
          }}>
            <div
              role="button"
              tabIndex={0}
              aria-expanded={!isCollapsed}
              onClick={() => toggleFile(gi)}
              onKeyDown={e => (e.key === "Enter" || e.key === " ") && toggleFile(gi)}
              style={{
                padding:"10px 12px", background: isCollapsed ? "transparent" : T.surfaceHi,
                borderBottom:isCollapsed? "none" : `1px solid ${T.border}`,
                display:"flex", flexDirection:"column", gap:8, cursor:"pointer", userSelect:"none", outline:"none",
                transition: "background .2s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            >
              {/* Row 1: Chevron + Fully wrapped path/filename */}
              <div style={{display:"flex", alignItems:"flex-start", gap:10}}>
                <div style={{
                  display:"flex", alignItems:"center", justifyContent:"center",
                  width:20, height:20, borderRadius:4, background: isCollapsed ? "transparent" : `${T.brand}15`,
                  transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)",
                  flexShrink:0,
                  alignSelf:"flex-start"
                }}>
                  <Ic n={isCollapsed ? "chevron_right" : "chevron_down"} s={14} c={isCollapsed ? T.dim : T.brand}/>
                </div>

                <div style={{flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:1}}>
                  {dir && (
                    <div style={{
                      fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.dim,
                      opacity: 0.8, letterSpacing:"0.02em",
                      whiteSpace:"normal", wordBreak:"break-all"
                    }}>
                      {dir}/
                    </div>
                  )}
                  <div style={{
                    fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700,
                    color:isCollapsed ? T.textDim : T.textHi,
                    whiteSpace:"normal", wordBreak:"break-all",
                    marginTop: dir ? 1 : 0
                  }}>
                    {base}
                  </div>
                </div>
              </div>

              {/* Row 2: Action copy buttons + changes badges */}
              <div style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                gap:8, paddingLeft:30, flexWrap:"wrap"
              }}>
                {/* Copy Buttons */}
                <div style={{display:"flex", alignItems:"center", gap:4, flexWrap:"wrap"}}>
                  <button
                    onClick={(e) => handleCopyPath(e, g.file, gi)}
                    title="Copy file path"
                    aria-label={`Copy file path for ${g.file}`}
                    style={{
                      background: "none", border: "none", padding: "4px 8px", cursor: "pointer",
                      borderRadius: 4, display: "flex", alignItems: "center", gap: 4,
                      color: copiedPaths[gi] ? T.brand : T.muted,
                      fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800,
                      transition: "all .15s cubic-bezier(0.4, 0, 0.2, 1)",
                      outline: "none",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = T.brand; e.currentTarget.style.background = `${T.brand}10`; }}
                    onMouseLeave={e => { e.currentTarget.style.color = copiedPaths[gi] ? T.brand : T.muted; e.currentTarget.style.background = "none"; }}
                  >
                    <Ic n="copy" s={11} c={copiedPaths[gi] ? T.brand : T.muted}/>
                    {copiedPaths[gi] ? "PATH COPIED" : (isDesktop ? "COPY PATH" : "PATH")}
                  </button>

                  <button
                    onClick={(e) => handleCopyDiff(e, g.rawLines, gi)}
                    title="Copy git diff/patch"
                    aria-label={`Copy git diff for ${g.file}`}
                    style={{
                      background: "none", border: "none", padding: "4px 8px", cursor: "pointer",
                      borderRadius: 4, display: "flex", alignItems: "center", gap: 4,
                      color: copiedDiffs[gi] ? T.brand : T.muted,
                      fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800,
                      transition: "all .15s cubic-bezier(0.4, 0, 0.2, 1)",
                      outline: "none",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = T.brand; e.currentTarget.style.background = `${T.brand}10`; }}
                    onMouseLeave={e => { e.currentTarget.style.color = copiedDiffs[gi] ? T.brand : T.muted; e.currentTarget.style.background = "none"; }}
                  >
                    <Ic n="copy" s={11} c={copiedDiffs[gi] ? T.brand : T.muted}/>
                    {copiedDiffs[gi] ? "DIFF COPIED" : (isDesktop ? "COPY DIFF" : "DIFF")}
                  </button>

                  <button
                    onClick={(e) => handleCopyPlain(e, g.hunks, gi)}
                    title="Copy plain text code (added lines)"
                    aria-label={`Copy plain code for ${g.file}`}
                    style={{
                      background: "none", border: "none", padding: "4px 8px", cursor: "pointer",
                      borderRadius: 4, display: "flex", alignItems: "center", gap: 4,
                      color: copiedPlains[gi] ? T.brand : T.muted,
                      fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800,
                      transition: "all .15s cubic-bezier(0.4, 0, 0.2, 1)",
                      outline: "none",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = T.brand; e.currentTarget.style.background = `${T.brand}10`; }}
                    onMouseLeave={e => { e.currentTarget.style.color = copiedPlains[gi] ? T.brand : T.muted; e.currentTarget.style.background = "none"; }}
                  >
                    <Ic n="copy" s={11} c={copiedPlains[gi] ? T.brand : T.muted}/>
                    {copiedPlains[gi] ? "PLAIN COPIED" : (isDesktop ? "COPY PLAIN" : "PLAIN")}
                  </button>
                </div>

                {/* Badges */}
                <div style={{display:"flex", alignItems:"center", gap:6, fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:800}}>
                  <div title="File patch payload size" style={{padding:"2px 6px", borderRadius:4, background:`${T.purple}15`, color:T.purple, border:`1px solid ${T.purple}30`}}>
                    {fmtBytes((g.rawLines ? g.rawLines.join("\n").length : 0) / 1024)}
                  </div>
                  <div style={{padding:"2px 6px", borderRadius:4, background:`${T.brand}10`, color:T.brandLight, border:`1px solid ${T.brand}20`}}>+{g.adds}</div>
                  <div style={{padding:"2px 6px", borderRadius:4, background:`${T.red}10`, color:T.redLight, border:`1px solid ${T.red}20` }}>-{g.rems}</div>
                </div>
              </div>
            </div>

            <div style={{
              maxHeight: isCollapsed ? 0 : 20000,
              opacity: isCollapsed ? 0 : 1,
              overflow: "hidden",
              transition: "all .4s cubic-bezier(0.4, 0, 0.2, 1)",
              fontFamily:"'JetBrains Mono',monospace", fontSize:11, lineHeight:1.4
            }}>
              {g.hunks.map((h, hi) => (
                <div key={hi} style={{ borderTop: hi > 0 ? `1px solid ${T.border}40` : "none" }}>
                  <div style={{
                    padding:"3px 12px", background:"rgba(30,41,59,0.5)", color:T.blue, fontSize:10,
                    fontWeight:700, borderBottom:`1px solid ${T.border}20`, display:"flex", alignItems:"center", gap:6
                  }}>
                    <div style={{ width:4, height:4, borderRadius:"50%", background:T.blue, opacity:0.5 }}/>
                    {h.header}
                  </div>
                  {h.lines.map((line, li) => {
                    const isAdd = line.startsWith("+");
                    const isRem = line.startsWith("-");
                    const c = isAdd ? T.brandLight : isRem ? T.redLight : T.muted;
                    const bg = isAdd ? "rgba(6, 182, 212, 0.08)" : isRem ? "rgba(255, 113, 133, 0.08)" : "transparent";
                    const symbol = isAdd ? "+" : isRem ? "-" : " ";
                    const content = (isAdd || isRem) ? line.slice(1) : line;

                    return (
                      <div key={li} style={{
                        display:"flex", background:bg, minHeight:20,
                        borderLeft:`3px solid ${isAdd ? T.brand : isRem ? T.red : "transparent"}`,
                        transition: "background .1s cubic-bezier(0.4, 0, 0.2, 1)"
                      }}>
                        <div style={{
                          width:24, flexShrink:0, display:"flex", alignItems:"center",
                          justifyContent:"center", color:c, opacity:0.7, fontSize:11,
                          userSelect:"none", fontWeight:800, fontFamily:"monospace"
                        }}>
                          {symbol}
                        </div>
                        <div style={{
                          padding:"2px 10px", color:isAdd?T.textHi:isRem?T.textHi:T.textDim,
                          whiteSpace:"pre-wrap", wordBreak:"break-all", flex:1,
                          opacity: (isAdd||isRem)?1:0.8,
                          fontSize: 11,
                        }}>
                          {content || " "}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});
