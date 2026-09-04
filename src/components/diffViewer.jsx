/**
 * DiffViewer Component
 * Renders unified diff patches for code changes made during a session,
 * complete with file collapsing, path/diff copy helpers, payload stats, and debug export.
 */
import { copyToClipboard } from "../utils/format.js";

export const DiffViewer = memo(({ activities = [], isDesktop = false }) => {
  const [collapsed, setCollapsed] = useState(null); // null = auto-collapse all on first load
  const [copiedPaths, setCopiedPaths] = useState({}); // key (pi-gi) -> boolean
  const [copiedDiffs, setCopiedDiffs] = useState({}); // key -> boolean
  const [copiedPlains, setCopiedPlains] = useState({}); // key -> boolean
  const [copiedOverallDebug, setCopiedOverallDebug] = useState(false);

  // Collect up to the last 2 distinct patch artifacts from activities (latest and previous)
  const recentPatches = useMemo(() => {
    const patchList = [];
    const seenPatches = new Set();

    for (let i = activities.length - 1; i >= 0; i--) {
      const a = activities[i];
      if (a.artifacts) {
        for (const art of a.artifacts) {
          const rawPatch = art.changeSet?.gitPatch?.unidiffPatch;
          if (rawPatch) {
            const patchKey = rawPatch.trim();
            if (!seenPatches.has(patchKey)) {
              seenPatches.add(patchKey);
              patchList.push({
                patch: rawPatch,
                gitPatch: art.changeSet.gitPatch,
                ts: a.createTime,
                id: a.id || `act-${i}`
              });
              if (patchList.length >= 2) break;
            }
          }
        }
      }
      if (patchList.length >= 2) break;
    }
    return patchList;
  }, [activities]);

  // Parse each patch into structured file groups
  const patchGroups = useMemo(() => {
    return recentPatches.map(p => ({
      patchMeta: p,
      groups: parseUnidiffPatch(p.gitPatch || p.patch, p.ts)
    }));
  }, [recentPatches]);

  // Flattened total key index set for calculating collapse state
  const allKeys = useMemo(() => {
    const keys = [];
    patchGroups.forEach((pg, pi) => {
      pg.groups.forEach((_, gi) => {
        keys.push(`${pi}-${gi}`);
      });
    });
    return keys;
  }, [patchGroups]);

  const safeCollapsed = useMemo(() => {
    if (collapsed !== null) return collapsed;
    // Collapse all by default
    return new Set(allKeys);
  }, [collapsed, allKeys]);

  const totalFiles = useMemo(() => patchGroups.reduce((acc, pg) => acc + pg.groups.length, 0), [patchGroups]);
  const totalAdds = useMemo(() => patchGroups.reduce((acc, pg) => acc + pg.groups.reduce((a, g) => a + g.adds, 0), 0), [patchGroups]);
  const totalRems = useMemo(() => patchGroups.reduce((acc, pg) => acc + pg.groups.reduce((a, g) => a + g.rems, 0), 0), [patchGroups]);

  const handleCopyPath = (e, file, key) => {
    e.stopPropagation();
    copyToClipboard(file).then((success) => {
      if (success) {
        setCopiedPaths(prev => ({ ...prev, [key]: true }));
        setTimeout(() => {
          setCopiedPaths(prev => ({ ...prev, [key]: false }));
        }, 2000);
      }
    });
  };

  const handleCopyPlain = (e, hunks, key) => {
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
    copyToClipboard(plainText).then((success) => {
      if (success) {
        setCopiedPlains(prev => ({ ...prev, [key]: true }));
        setTimeout(() => {
          setCopiedPlains(prev => ({ ...prev, [key]: false }));
        }, 2000);
      }
    });
  };

  const handleCopyDiff = (e, rawLines, key) => {
    e.stopPropagation();
    const diffText = rawLines.join("\n");
    copyToClipboard(diffText).then((success) => {
      if (success) {
        setCopiedDiffs(prev => ({ ...prev, [key]: true }));
        setTimeout(() => {
          setCopiedDiffs(prev => ({ ...prev, [key]: false }));
        }, 2000);
      }
    });
  };

  if (patchGroups.length === 0) return (
    <div style={{textAlign:"center",padding:"50px 0",fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.textDim}}>
      No diff available yet
    </div>
  );

  const toggleFile = (key) => {
    const next = new Set(safeCollapsed);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setCollapsed(next);
  };

  const toggleAll = (doCollapse) => {
    if (doCollapse) setCollapsed(new Set(allKeys));
    else setCollapsed(new Set());
  };

  return (
    <div style={{display:"flex", flexDirection:"column", gap:16}}>
      {/* Global Header and Controls */}
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 4px", flexWrap:"wrap", gap:8}}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:800, color:T.dim, letterSpacing:"0.08em"}}>
            {recentPatches.length} PATCH{recentPatches.length !== 1 ? 'ES' : ''} ({totalFiles} FILE{totalFiles !== 1 ? 'S' : ''})
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
                patchCount: recentPatches.length,
                totalFiles,
                totalAdds,
                totalRems,
                patches: patchGroups.map((pg, pi) => ({
                  patchIndex: pi + 1,
                  timestamp: pg.patchMeta.ts,
                  formattedTime: fmtTime(parseDateMs(pg.patchMeta.ts)),
                  formattedAgo: fmtAgo(parseDateMs(pg.patchMeta.ts)),
                  fileCount: pg.groups.length,
                  files: pg.groups.map(g => {
                    const bytes = g.rawSize !== undefined ? g.rawSize : (g.rawLines ? g.rawLines.join("\n").length : 0);
                    return {
                      file: g.file,
                      adds: g.adds,
                      rems: g.rems,
                      bytes,
                      formattedSize: fmtBytes(bytes / 1024),
                      hunkCount: g.hunks.length
                    };
                  })
                }))
              };
              copyToClipboard(JSON.stringify(debugReport, null, 2)).then((success) => {
                if (success) {
                  setCopiedOverallDebug(true);
                  setTimeout(() => setCopiedOverallDebug(false), 2000);
                }
              });
            }}
            title={copiedOverallDebug ? "Overall diff debug report copied to clipboard" : "Copy overall diff debug report to clipboard"}
            aria-label={copiedOverallDebug ? "Overall diff debug report copied to clipboard" : "Copy overall diff debug report"}
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
          <PickerBtn label="EXPAND ALL" isAct={safeCollapsed.size === 0} onClick={() => toggleAll(false)} />
          <PickerBtn label="COLLAPSE ALL" isAct={safeCollapsed.size === allKeys.length} onClick={() => toggleAll(true)} />
        </div>
      </div>

      {/* Grouped Patches list (last 3 patches, newest first) */}
      {patchGroups.map((pg, pi) => {
        const patchMs = parseDateMs(pg.patchMeta.ts);
        const timeStr = patchMs ? fmtTime(patchMs) : "";
        const agoStr = patchMs ? fmtAgo(patchMs) : "";
        const pAdds = pg.groups.reduce((a, g) => a + g.adds, 0);
        const pRems = pg.groups.reduce((a, g) => a + g.rems, 0);

        return (
          <div key={pg.patchMeta.id || pi} style={{
            display: "flex", flexDirection: "column", gap: 8,
            padding: "12px", background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.15)"
          }}>
            {/* Patch Header with Timestamp */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingBottom: 8, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 6
            }}>
              <div style={{display: "flex", alignItems: "center", gap: 8}}>
                <span style={{
                  padding: "2px 6px", borderRadius: 4, background: `${T.brand}20`,
                  color: T.brandLight, fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10, fontWeight: 800, letterSpacing: "0.05em"
                }}>
                  {pi === 0 ? "LATEST PATCH" : `PATCH #${patchGroups.length - pi}`}
                </span>
                {patchMs > 0 && (
                  <span style={{
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700,
                    color: T.textHi, display: "inline-flex", alignItems: "center", gap: 4
                  }}>
                    <span>{timeStr}</span>
                    <span style={{color: T.dim, fontSize: 10}}>({agoStr})</span>
                  </span>
                )}
              </div>

              <div style={{display: "flex", alignItems: "center", gap: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 800}}>
                <span style={{color: T.dim}}>{pg.groups.length} file{pg.groups.length !== 1 ? 's' : ''}</span>
                <span style={{color: T.brand}}>+{pAdds}</span>
                <span style={{color: T.red}}>-{pRems}</span>
              </div>
            </div>

            {/* Files in Patch */}
            {pg.groups.map((g, gi) => {
              const fileKey = `${pi}-${gi}`;
              const isCollapsed = safeCollapsed.has(fileKey);
              const parts = g.file.split("/");
              const base = parts.pop();
              const dir = parts.join("/");

              return (
                <div key={fileKey} style={{
                  background: T.bg, border: `1px solid ${isCollapsed ? T.border : T.borderHi}`,
                  borderRadius: 8, overflow: "hidden",
                  boxShadow: isCollapsed ? "none" : "0 4px 20px rgba(0,0,0,0.2), inset 0 0 1px rgba(255,255,255,0.05)",
                  transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)"
                }}>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={!isCollapsed}
                    onClick={() => toggleFile(fileKey)}
                    onKeyDown={e => (e.key === "Enter" || e.key === " ") && toggleFile(fileKey)}
                    style={{
                      padding: "10px 12px", background: isCollapsed ? "transparent" : T.surfaceHi,
                      borderBottom: isCollapsed ? "none" : `1px solid ${T.border}`,
                      display: "flex", flexDirection: "column", gap: 8, cursor: "pointer", userSelect: "none", outline: "none",
                      transition: "background .2s cubic-bezier(0.4, 0, 0.2, 1)"
                    }}
                  >
                    {/* Row 1: Chevron + Fully wrapped path/filename */}
                    <div style={{display: "flex", alignItems: "flex-start", gap: 10}}>
                      <div style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 20, height: 20, borderRadius: 4, background: isCollapsed ? "transparent" : `${T.brand}15`,
                        transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)",
                        flexShrink: 0,
                        alignSelf: "flex-start"
                      }}>
                        <Ic n={isCollapsed ? "chevron_right" : "chevron_down"} s={14} c={isCollapsed ? T.dim : T.brand}/>
                      </div>

                      <div style={{flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1}}>
                        {dir && (
                          <div style={{
                            fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T.dim,
                            opacity: 0.8, letterSpacing: "0.02em",
                            whiteSpace: "normal", wordBreak: "break-all"
                          }}>
                            {dir}/
                          </div>
                        )}
                        <div style={{
                          fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700,
                          color: isCollapsed ? T.textDim : T.textHi,
                          whiteSpace: "normal", wordBreak: "break-all",
                          marginTop: dir ? 1 : 0
                        }}>
                          {base}
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Action copy buttons + changes badges */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 8, paddingLeft: 30, flexWrap: "wrap"
                    }}>
                      {/* Copy Buttons */}
                      <div style={{display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap"}}>
                        <button
                          onClick={(e) => handleCopyPath(e, g.file, fileKey)}
                          title={copiedPaths[fileKey] ? `File path for ${g.file} copied to clipboard` : "Copy file path"}
                          aria-label={copiedPaths[fileKey] ? `File path for ${g.file} copied to clipboard` : `Copy file path for ${g.file}`}
                          style={{
                            background: "none", border: "none", padding: "4px 8px", cursor: "pointer",
                            borderRadius: 4, display: "flex", alignItems: "center", gap: 4,
                            color: copiedPaths[fileKey] ? T.brand : T.muted,
                            fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800,
                            transition: "all .15s cubic-bezier(0.4, 0, 0.2, 1)",
                            outline: "none",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = T.brand; e.currentTarget.style.background = `${T.brand}10`; }}
                          onMouseLeave={e => { e.currentTarget.style.color = copiedPaths[fileKey] ? T.brand : T.muted; e.currentTarget.style.background = "none"; }}
                        >
                          <Ic n="copy" s={11} c={copiedPaths[fileKey] ? T.brand : T.muted}/>
                          {copiedPaths[fileKey] ? "PATH COPIED" : (isDesktop ? "COPY PATH" : "PATH")}
                        </button>

                        <button
                          onClick={(e) => handleCopyDiff(e, g.rawLines, fileKey)}
                          title={copiedDiffs[fileKey] ? `Git diff for ${g.file} copied to clipboard` : "Copy git diff/patch"}
                          aria-label={copiedDiffs[fileKey] ? `Git diff for ${g.file} copied to clipboard` : `Copy git diff for ${g.file}`}
                          style={{
                            background: "none", border: "none", padding: "4px 8px", cursor: "pointer",
                            borderRadius: 4, display: "flex", alignItems: "center", gap: 4,
                            color: copiedDiffs[fileKey] ? T.brand : T.muted,
                            fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800,
                            transition: "all .15s cubic-bezier(0.4, 0, 0.2, 1)",
                            outline: "none",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = T.brand; e.currentTarget.style.background = `${T.brand}10`; }}
                          onMouseLeave={e => { e.currentTarget.style.color = copiedDiffs[fileKey] ? T.brand : T.muted; e.currentTarget.style.background = "none"; }}
                        >
                          <Ic n="copy" s={11} c={copiedDiffs[fileKey] ? T.brand : T.muted}/>
                          {copiedDiffs[fileKey] ? "DIFF COPIED" : (isDesktop ? "COPY DIFF" : "DIFF")}
                        </button>

                        <button
                          onClick={(e) => handleCopyPlain(e, g.hunks, fileKey)}
                          title={copiedPlains[fileKey] ? `Plain code for ${g.file} copied to clipboard` : "Copy plain text code (added lines)"}
                          aria-label={copiedPlains[fileKey] ? `Plain code for ${g.file} copied to clipboard` : `Copy plain code for ${g.file}`}
                          style={{
                            background: "none", border: "none", padding: "4px 8px", cursor: "pointer",
                            borderRadius: 4, display: "flex", alignItems: "center", gap: 4,
                            color: copiedPlains[fileKey] ? T.brand : T.muted,
                            fontSize: 9, fontFamily: "'JetBrains Mono',monospace", fontWeight: 800,
                            transition: "all .15s cubic-bezier(0.4, 0, 0.2, 1)",
                            outline: "none",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = T.brand; e.currentTarget.style.background = `${T.brand}10`; }}
                          onMouseLeave={e => { e.currentTarget.style.color = copiedPlains[fileKey] ? T.brand : T.muted; e.currentTarget.style.background = "none"; }}
                        >
                          <Ic n="copy" s={11} c={copiedPlains[fileKey] ? T.brand : T.muted}/>
                          {copiedPlains[fileKey] ? "PLAIN COPIED" : (isDesktop ? "COPY PLAIN" : "PLAIN")}
                        </button>
                      </div>

                      {/* Badges */}
                      <div style={{display: "flex", alignItems: "center", gap: 6, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 800}}>
                        <div title="File patch payload size" style={{padding: "2px 6px", borderRadius: 4, background: `${T.purple}15`, color: T.purple, border: `1px solid ${T.purple}30`}}>
                          {fmtBytes((g.rawSize !== undefined ? g.rawSize : (g.rawLines ? g.rawLines.join("\n").length : 0)) / 1024)}
                        </div>
                        <div style={{padding: "2px 6px", borderRadius: 4, background: `${T.brand}10`, color: T.brandLight, border: `1px solid ${T.brand}20`}}>+{g.adds}</div>
                        <div style={{padding: "2px 6px", borderRadius: 4, background: `${T.red}10`, color: T.redLight, border: `1px solid ${T.red}20` }}>-{g.rems}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    maxHeight: isCollapsed ? 0 : 20000,
                    opacity: isCollapsed ? 0 : 1,
                    overflow: "hidden",
                    transition: "all .4s cubic-bezier(0.4, 0, 0.2, 1)",
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 11, lineHeight: 1.4
                  }}>
                    {g.hunks.map((h, hi) => (
                      <div key={hi} style={{ borderTop: hi > 0 ? `1px solid ${T.border}40` : "none" }}>
                        <div style={{
                          padding: "3px 12px", background: "rgba(30,41,59,0.5)", color: T.blue, fontSize: 10,
                          fontWeight: 700, borderBottom: `1px solid ${T.border}20`, display: "flex", alignItems: "center", gap: 6
                        }}>
                          <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.blue, opacity: 0.5 }}/>
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
                              display: "flex", background: bg, minHeight: 20,
                              borderLeft: `3px solid ${isAdd ? T.brand : isRem ? T.red : "transparent"}`,
                              transition: "background .1s cubic-bezier(0.4, 0, 0.2, 1)"
                            }}>
                              <div style={{
                                width: 24, flexShrink: 0, display: "flex", alignItems: "center",
                                justifyContent: "center", color: c, opacity: 0.7, fontSize: 11,
                                userSelect: "none", fontWeight: 800, fontFamily: "monospace"
                              }}>
                                {symbol}
                              </div>
                              <div style={{
                                padding: "2px 10px", color: isAdd ? T.textHi : isRem ? T.textHi : T.textDim,
                                whiteSpace: "pre-wrap", wordBreak: "break-all", flex: 1,
                                opacity: (isAdd || isRem) ? 1 : 0.8,
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
      })}
    </div>
  );
});
