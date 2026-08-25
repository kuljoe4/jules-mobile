const PlanView = memo(({ activities, session, apiKey, onApprove, onSendFeedback, busy, allSessions = [], activitiesMap = {} }) => {
  const [stepNotes, setStepNotes]     = useState({}); // stepId → note string
  const [activeNote, setActiveNote]   = useState(null); // stepId currently expanded
  const [globalNote, setGlobalNote]   = useState("");
  const [sending, setSending]         = useState(false);
  const [sent, setSent]               = useState(false);

  // Find the most recent planGenerated activity
  const planAct = useMemo(() => {
    for (let i = activities.length - 1; i >= 0; i--) {
      if (activities[i].planGenerated?.plan) return activities[i];
    }
    return null;
  }, [activities]);

  const plan  = planAct?.planGenerated?.plan;
  const steps = plan?.steps || [];

  // Check if plan already approved in activity history (must be after the plan was generated)
  const approved = useMemo(() => {
    if (!planAct) return false;
    const planTs = parseDateMs(planAct.createTime);
    return activities.some(a => a.planApproved && parseDateMs(a.createTime) >= planTs);
  }, [activities, planAct]);

  const hasFeedback = globalNote.trim() || Object.values(stepNotes).some(n => n.trim());

  const buildFeedbackMessage = () => {
    const parts = ["Please revise the plan based on my feedback:"];
    const stepFeedback = steps
      .filter(st => stepNotes[st.id]?.trim())
      .map((st, i) => `Step ${i + 1} (${st.title}): ${stepNotes[st.id].trim()}`);
    if (stepFeedback.length) parts.push(...stepFeedback);
    if (globalNote.trim()) parts.push("Overall: " + globalNote.trim());
    return parts.join("\n");
  };

  const handleRequestRevision = async () => {
    if (!hasFeedback || sending) return;
    setSending(true);
    try {
      await onSendFeedback(buildFeedbackMessage());
      setStepNotes({});
      setGlobalNote("");
      setActiveNote(null);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } finally { setSending(false); }
  };

  if (!plan) return (
    <div style={{textAlign:"center",padding:"50px 24px",fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.textDim}}>
      {session.state === "PLANNING" ? "Jules is generating a plan…" : "No plan available"}
    </div>
  );

  const pendingApproval = session.state === "AWAITING_PLAN_APPROVAL";
  const annotatedCount  = Object.values(stepNotes).filter(n=>n.trim()).length;

  return (
    <div style={{paddingBottom:16}}>
      <ConflictRadar
        currentSource={session.sourceContext?.source}
        currentBranch={session.sourceContext?.githubRepoContext?.startingBranch}
        currentPrompt={session.prompt}
        allSessions={allSessions}
        activitiesMap={activitiesMap}
        currentSessionId={session.id}
        startTime={parseDateMs(session.createTime)}
      />

      {/* Plan header */}
      <div style={{
        marginBottom:14,padding:"10px 14px",borderRadius:7,
        background:approved?T.brandDim:pendingApproval?T.purpleDim:T.surfaceHi,
        border:`1px solid ${approved?T.brand+"40":pendingApproval?T.purple+"40":T.border}`,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:approved||!pendingApproval?0:8}}>
          <div style={{flex:1,fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,
            color:approved?T.brand:pendingApproval?T.purple:T.muted,letterSpacing:"0.06em"}}>
            {approved?"✓ PLAN APPROVED":pendingApproval?"PLAN READY FOR REVIEW":"PLAN PREVIEW"}
          </div>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.textDim}}>
            {steps.length} step{steps.length!==1?"s":""}
          </span>
        </div>
        {pendingApproval&&!approved&&(
          <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:14,color:T.textDim,lineHeight:1.5}}>
            Review each step below. Tap a step to add feedback, then request a revision or approve.
          </div>
        )}
      </div>

      {/* Steps */}
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
        {steps.map((st, i) => {
          const note     = stepNotes[st.id] || "";
          const isOpen   = activeNote === st.id;
          const hasNote  = note.trim().length > 0;

          return (
            <div key={st.id||i} style={{
              background:T.surface,border:`1px solid ${hasNote?T.amber+"50":T.border}`,
              borderLeft:`2px solid ${hasNote?T.amber:T.purple+"60"}`,
              borderRadius:6,overflow:"hidden",transition:"border-color .15s cubic-bezier(0.4, 0, 0.2, 1)",
            }}>
              {/* Step row */}
              <div style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 12px"}}>
                <div style={{
                  width:24,height:24,borderRadius:4,flexShrink:0,marginTop:1,
                  background:hasNote?T.amberDim:T.purpleDim,
                  border:`1px solid ${hasNote?T.amber+"50":T.purple+"40"}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,
                  color:hasNote?T.amber:T.purple,
                }}>{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:15,fontWeight:500,
                    color:T.text,lineHeight:1.35,marginBottom:st.description?10:0}}>
                    {st.title}
                  </div>
                  {st.description&&(
                    <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:13,color:T.textDim,lineHeight:1.45}}>
                      {st.description}
                    </div>
                  )}
                  {hasNote&&!isOpen&&(
                    <div style={{marginTop:5,padding:"4px 8px",borderRadius:4,
                      background:T.amberDim,border:`1px solid ${T.amber}30`,
                      fontFamily:"'IBM Plex Sans',sans-serif",fontSize:13,color:T.amber,lineHeight:1.4}}>
                      📝 {note}
                    </div>
                  )}
                </div>
                {pendingApproval&&!approved&&(
                  <button onClick={()=>setActiveNote(isOpen?null:st.id)} style={{
                    flexShrink:0,padding:"4px 8px",borderRadius:4,border:"none",cursor:"pointer",
                    background:isOpen?(hasNote?T.amberDim:T.purpleDim):"transparent",
                    outline:`1px solid ${isOpen?(hasNote?T.amber+"40":T.purple+"40"):T.border}`,
                    fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,
                    color:isOpen?(hasNote?T.amber:T.purple):T.muted,
                    transition:"all .12s cubic-bezier(0.4, 0, 0.2, 1)",letterSpacing:"0.06em",
                  }}>{hasNote?"EDIT":"NOTE"}</button>
                )}
              </div>

              {/* Per-step feedback textarea */}
              {isOpen&&pendingApproval&&!approved&&(
                <div style={{padding:"0 12px 12px",borderTop:`1px solid ${T.border}`}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.amber,
                    letterSpacing:"0.08em",marginBottom:5,marginTop:8}}>FEEDBACK FOR STEP {i+1}</div>
                  <textarea
                    value={note}
                    onChange={e=>setStepNotes(prev=>({...prev,[st.id]:e.target.value}))}
                    placeholder={`What should change about this step? (e.g. "Use TypeScript instead of JS", "Skip this — not needed")`}
                    aria-label={`Feedback for Step ${i+1}`}
                    rows={2}
                    maxLength={5000}
                    style={{
                      width:"100%",background:T.surfaceHi,border:`1px solid ${T.amber}40`,
                      borderRadius:5,padding:"8px 10px",color:T.text,
                      fontFamily:"'IBM Plex Sans',sans-serif",fontSize:14,lineHeight:1.4,
                      resize:"vertical",outline:"none",boxSizing:"border-box",
                    }}
                    autoFocus
                  />
                  <button onClick={()=>setActiveNote(null)} style={{
                    marginTop:5,padding:"4px 10px",borderRadius:4,border:`1px solid ${T.border}`,
                    background:"transparent",cursor:"pointer",color:T.textDim,
                    fontFamily:"'JetBrains Mono',monospace",fontSize:11,
                  }}>DONE</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global feedback + actions — only when pending approval */}
      {pendingApproval&&!approved&&(
        <div style={{
          background:T.surface,border:`1px solid ${T.border}`,
          borderRadius:7,padding:"12px 14px",
        }}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.textDim,
            letterSpacing:"0.08em",marginBottom:6}}>OVERALL FEEDBACK (optional)</div>
          <textarea
            value={globalNote}
            onChange={e=>setGlobalNote(e.target.value)}
            placeholder="Any overall comments before approving? (e.g. 'Make sure to run tests', 'Keep changes minimal')"
            aria-label="Overall comments or feedback"
            rows={2}
            maxLength={5000}
            style={{
              width:"100%",background:T.surfaceHi,border:`1px solid ${T.border}`,
              borderRadius:5,padding:"8px 10px",color:T.text,
              fontFamily:"'IBM Plex Sans',sans-serif",fontSize:14,lineHeight:1.4,
              resize:"vertical",outline:"none",boxSizing:"border-box",
              transition:"border-color .18s cubic-bezier(0.4, 0, 0.2, 1)",marginBottom:10,
            }}
          />

          {sent&&(
            <div style={{marginBottom:8,padding:"6px 10px",borderRadius:4,
              background:T.brandDim,border:`1px solid ${T.brand}40`,
              fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.brand}}>
              ✓ Revision request sent — Jules will update the plan
            </div>
          )}

          <div style={{display:"flex",gap:8}}>
            <Btn
              onClick={handleRequestRevision}
              disabled={!hasFeedback||sending||busy}
              color={T.amber} outline sm
              style={{flex:1}}
            >
              {sending?"SENDING…":`REVISE${annotatedCount>0?` (${annotatedCount} step${annotatedCount>1?"s":""})`:globalNote.trim()?" +note":""}`}
            </Btn>
            <Btn
              onClick={onApprove}
              disabled={busy||sending}
              color={T.purple} sm
              style={{flex:1}}
            >
              <Ic n="approve" s={11} c="#000"/>
              {busy?"APPROVING…":"APPROVE PLAN"}
            </Btn>
          </div>
          <div style={{marginTop:7,fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.textDim,textAlign:"center",lineHeight:1.6}}>
            Revise → Jules rewrites the plan · Approve → Jules starts executing
          </div>
        </div>
      )}
    </div>
  );
});

// ─── Diff Viewer ──────────────────────────────────────────────────────────────
// Performance Optimized: Wrapped in React.memo to prevent expensive re-rendering
// and heavy virtual DOM diffing of large multi-line diff hunks on parent state
// updates (such as the 1-second timer ticks or polling updates) when props are unchanged.
const DiffViewer = memo(({ activities = [], isDesktop = false }) => {
  const [collapsed, setCollapsed] = useState(null); // null = auto-collapse all on first load
  const [copiedPaths, setCopiedPaths] = useState({}); // gi -> boolean
  const [copiedDiffs, setCopiedDiffs] = useState({}); // gi -> boolean
  const [copiedPlains, setCopiedPlains] = useState({}); // gi -> boolean

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
        <div style={{display:"flex", gap:6}}>
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

// ─── Setup Screen ─────────────────────────────────────────────────────────────
