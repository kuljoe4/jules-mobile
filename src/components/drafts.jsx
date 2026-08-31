export const DraftsBox = memo(({ onBack, isDesktop, onResume, onCreate, allSessions, activitiesMap, draftsMap = {}, onDraftChange, onSelectSession }) => {
  const [activeTab, setActiveTab] = useState("templates"); // "templates" or "followups"
  const [drafts, setDrafts] = useState(loadDraftsBox());

  const handleDelete = (id) => {
    if (!confirm("Delete this draft?")) return;
    deleteDraftFromBox(id);
    setDrafts(loadDraftsBox());
  };

  const handleClearAll = () => {
    if (!confirm("Clear all drafts?")) return;
    clearDraftsBox();
    setDrafts([]);
  };

  const followupSessions = useMemo(() => {
    return allSessions.filter(s => draftsMap[s.id]);
  }, [allSessions, draftsMap]);

  const handleDeleteFollowup = (id) => {
    if (!confirm("Delete this follow-up message draft?")) return;
    try {
      SafeStorage.clearFollowupDraft(id);
      if (onDraftChange) onDraftChange(id, false);
    } catch (e) {}
  };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0}}>
      <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}33`,background:T.surface,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        {!isDesktop&&<button onClick={onBack} title="Go back" aria-label="Go back" style={{background:"none",border:"none",cursor:"pointer",display:"flex"}}><Ic n="back" s={18} c={T.text}/></button>}
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.text,letterSpacing:"0.05em",fontWeight:700,flex:1}}>DRAFTS BOX</div>
        {activeTab === "templates" && drafts.length > 0 && (
          <button onClick={handleClearAll} title="Clear all saved session setups" aria-label="Clear all saved session setups" style={{background:"none", border:"none", cursor:"pointer", color:T.red, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700}}>CLEAR ALL</button>
        )}
        {isDesktop && (
          <button onClick={onBack} title="Close" aria-label="Close" style={{background:"none",border:"none",cursor:"pointer",display:"flex",padding:4,opacity:0.8}}>
            <Ic n="x" s={18} c={T.text}/>
          </button>
        )}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"20px 24px",WebkitOverflowScrolling:"touch",minHeight:0}}>
        <div style={{maxWidth:560,margin:"0 auto"}}>
          {/* Segment Tab Controls */}
          <div role="tablist" aria-label="Draft categories" style={{display:"flex", gap:6, marginBottom:20, padding: "2px 2px", borderBottom: `1px solid ${T.border}`}}>
            <button role="tab" aria-selected={activeTab==="templates"?"true":"false"} aria-label={`Session setups tab, ${drafts.length} drafts`} onClick={() => setActiveTab("templates")} style={{
              flex: 1, padding: "8px 12px", background: "none", border: "none", cursor: "pointer",
              borderBottom: `2px solid ${activeTab==="templates"?T.brand:"transparent"}`,
              color: activeTab==="templates"?T.text:T.muted, fontFamily: "'JetBrains Mono',monospace",
              fontSize: 11, fontWeight: activeTab==="templates"?800:600, letterSpacing: "0.05em",
              transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6
            }}>
              <Ic n="archive" s={12} c={activeTab==="templates"?T.brand:T.muted}/>
              SESSION SETUPS ({drafts.length})
            </button>
            <button role="tab" aria-selected={activeTab==="followups"?"true":"false"} aria-label={`Follow-up chats tab, ${followupSessions.length} drafts`} onClick={() => setActiveTab("followups")} style={{
              flex: 1, padding: "8px 12px", background: "none", border: "none", cursor: "pointer",
              borderBottom: `2px solid ${activeTab==="followups"?T.brand:"transparent"}`,
              color: activeTab==="followups"?T.text:T.muted, fontFamily: "'JetBrains Mono',monospace",
              fontSize: 11, fontWeight: activeTab==="followups"?800:600, letterSpacing: "0.05em",
              transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6
            }}>
              <Ic n="layers" s={12} c={activeTab==="followups"?T.brand:T.muted}/>
              FOLLOW-UP CHATS ({followupSessions.length})
            </button>
          </div>

          {activeTab === "templates" ? (
            drafts.length === 0 ? (
              <div style={{textAlign:"center",padding:"100px 24px",fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.textDim}}>
                <div style={{width:48, height:48, borderRadius:12, background:T.surfaceHi, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", border:`1px solid ${T.border}`}}>
                  <Ic n="archive" s={20} c={T.dim}/>
                </div>
                NO SAVED SESSIONS
              </div>
            ) : (
              <div style={{display:"flex", flexDirection:"column", gap:16}}>
                {drafts.map(d => (
                  <div key={d.id} style={{
                    background: T.surface,
                    border: "none",
                    borderRadius: 10,
                    padding: "14px 16px",
                    transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    animation: "slideUp .3s ease"
                  }}>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, marginBottom:8}}>
                      <div style={{flex:1, minWidth:0, fontFamily:"'IBM Plex Sans',sans-serif", fontSize:14, fontWeight:600, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                        {d.title || d.prompt}
                      </div>
                      <div style={{display:"flex", alignItems:"center", gap:10, flexShrink:0}}>
                        {(d.updatedAt || d.createdAt) && (
                          <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.dim, opacity:0.65}}>{fmtAgo(d.updatedAt || d.createdAt)}</span>
                        )}
                        <button onClick={() => handleDelete(d.id)} style={{background:"none", border:"none", cursor:"pointer", padding:2, opacity:0.65}} title="Delete Draft" aria-label="Delete Draft">
                          <Ic n="trash" s={13} c={T.red}/>
                        </button>
                      </div>
                    </div>

                    <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:10, fontSize:11, fontFamily:"'JetBrains Mono',monospace", color:T.dim, opacity:0.65}}>
                      <div style={{display:"flex", alignItems:"center", gap:4, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                        <Ic n="code" s={11} c={T.muted}/>
                        <span>{d.source ? d.source.replace("sources/github/","") : "REPOLESS"}</span>
                      </div>
                      <div style={{display:"flex", alignItems:"center", gap:4, flexShrink:0}}>
                        <Ic n="branch" s={11} c={T.muted}/>
                        <span>{d.branch}</span>
                      </div>
                    </div>

                    <div style={{fontFamily:"'IBM Plex Sans',sans-serif", fontSize:13, color:T.textDim, lineHeight:1.5, marginBottom:16, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden"}}>
                      {d.prompt}
                    </div>

                    <ConflictRadar
                      currentSource={d.source}
                      currentBranch={d.branch}
                      currentPrompt={d.prompt}
                      allSessions={allSessions}
                      activitiesMap={activitiesMap}
                    />

                    <div style={{display:"flex", gap:10, marginTop:16}}>
                      <Btn onClick={() => onResume(d)} outline sm style={{flex:1}}>
                        <Ic n="expand" s={12} c={T.brand}/>
                        RESUME
                      </Btn>
                      <Btn onClick={() => onCreate(d)} sm style={{flex:1}}>
                        <Ic n="plus" s={12} c="#000"/>
                        CREATE
                      </Btn>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            followupSessions.length === 0 ? (
              <div style={{textAlign:"center",padding:"100px 24px",fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.textDim}}>
                <div style={{width:48, height:48, borderRadius:12, background:T.surfaceHi, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", border:`1px solid ${T.border}`}}>
                  <Ic n="layers" s={20} c={T.dim}/>
                </div>
                NO UNSENT FOLLOW-UP CHATS
              </div>
            ) : (
              <div style={{display:"flex", flexDirection:"column", gap:16}}>
                {followupSessions.map(s => {
                  const draftText = SafeStorage.loadFollowupDraft(s.id);
                  const repo = s.sourceContext?.githubRepoContext ? s.sourceContext.source?.replace("sources/github/","") : null;
                  const branch = s.sourceContext?.githubRepoContext?.startingBranch || "repoless";
                  return (
                    <div key={s.id} style={{
                      background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:20,
                      transition:"all .2s cubic-bezier(0.4, 0, 0.2, 1)", position:"relative",
                      animation:"slideUp .3s ease"
                    }}>
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12}}>
                        <div style={{flex:1, minWidth:0}}>
                          <div style={{fontFamily:"'IBM Plex Sans',sans-serif", fontSize:15, fontWeight:600, color:T.text, marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
                            {s.title || s.prompt}
                          </div>
                          <div style={{display:"flex", alignItems:"center", gap:8}}>
                            {repo && (
                              <div style={{display:"flex", alignItems:"center", gap:4, opacity:0.7}}>
                                <Ic n="code" s={11} c={T.muted}/>
                                <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.muted, fontWeight:700}}>{repo}</span>
                              </div>
                            )}
                            <div style={{display:"flex", alignItems:"center", gap:4, opacity:0.7}}>
                              <Ic n="branch" s={11} c={T.muted}/>
                              <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.muted, fontWeight:700}}>{branch}</span>
                            </div>
                            {(s.updateTime || s.createTime) && (
                              <div style={{display:"flex", alignItems:"center", gap:4, opacity:0.7}}>
                                <Ic n="clock" s={11} c={T.muted}/>
                                <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.muted, fontWeight:700}}>{fmtAgo(parseDateMs(s.updateTime || s.createTime))}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteFollowup(s.id)} style={{background:"none", border:"none", cursor:"pointer", padding:4, opacity:0.6}} title="Delete Draft" aria-label="Delete Draft">
                          <Ic n="trash" s={14} c={T.red}/>
                        </button>
                      </div>

                      <div style={{
                        fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:T.brandLight,
                        background:"#040507", border:`1px solid ${T.border}`, borderRadius:6,
                        padding:12, marginBottom:16, minHeight:40, maxHeight:120, overflowY:"auto",
                        whiteSpace:"pre-wrap", overflowWrap:"break-word", wordBreak:"break-all"
                      }}>
                        {draftText}
                      </div>

                      <div style={{display:"flex", gap:10}}>
                        <Btn onClick={() => onSelectSession(s)} sm style={{flex:1}}>
                          <Ic n="expand" s={12} c="#000"/>
                          RESUME CHAT
                        </Btn>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
});
// OPTIMIZATION: Wrap RecentActivityLog in React.memo to prevent unnecessary re-renders when parent
// state updates but the network log and totals remain reference-stable.
