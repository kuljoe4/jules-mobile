const NewSession = ({ apiKey, personas, onBack, onCreate, isDesktop, plan, todayCount, allSessions = [], activitiesMap = {}, initialDraft = null, onDraftSaved = null }) => {
  const {
    draft,
    sources,
    loadingSrc,
    source, setSource,
    sourceSearch, setSourceSearch,
    showSources, setShowSources,
    branch, setBranch,
    branches,
    showBranches, setShowBranches,
    defaultBranch,
    prompt, setPrompt,
    autoMode, setAutoMode,
    reqApproval, setReqApp,
    selectedPersonas,
    submitting,
    err, setErr,
    savedFlash,
    expanded, setExpanded,
    showConfirm, setShowConfirm,
    sourceInteracted, setSourceInteracted,
    srcObj,
    getSourceDisplay,
    filteredSources,
    filteredBranches,
    togglePersona,
    handleClearDraft,
    handleSaveToBox,
    handleCreate
  } = useNewSessionFlow({ apiKey, personas, onCreate, initialDraft, onDraftSaved });

  const isBranchInvalid = branch ? !isValidGitBranchName(branch) : false;

  // OPTIMIZATION (Bolt): Memoize payloadEst calculation with useMemo to avoid allocating
  // new objects and executing JSON.stringify on every single render pass of NewSession
  // (e.g., during repository search typing, persona toggles, or confirmation modal updates).
  const payloadEst = useMemo(() => {
    return (JSON.stringify({ prompt, source, branch }).length / 1024).toFixed(1);
  }, [prompt, source, branch]);

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0,position:"relative"}}>
      {showConfirm && (
        <Modal
          onClose={() => setShowConfirm(false)}
          icon="tasks"
          title="CONFIRM SESSION"
          subtitle="Ready to assign this task to Jules?"
          actions={
            <>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex:1, padding:"14px", borderRadius:10, border:`1px solid ${T.border}`,
                  background:"transparent", color:T.muted, cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700,
                  transition:"all .2s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceHi}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >CANCEL</button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                style={{
                  flex:2, padding:"14px", borderRadius:10, border:"none",
                  background:T.brand, color:"#000", cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:900,
                  boxShadow:`0 8px 24px ${T.brand}40`, transition:"transform .2s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "none"}
              >
                {submitting ? "STARTING..." : "START SESSION →"}
              </button>
            </>
          }
        >
          <div style={{display:"flex", flexDirection:"column", gap:16, marginBottom:28}}>
            <div style={{
              background:T.surfaceHi, borderRadius:10, padding:12,
              border: `1px solid ${T.border}`,
              transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)"
            }}>
              <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.brand, fontWeight:800, letterSpacing:"0.1em", marginBottom:6}}>TARGET REPOSITORY</div>
              <div style={{position:"relative"}}>
                <input
                  value={sourceSearch}
                  onChange={e=>{setSourceSearch(e.target.value); setShowSources(true); setSourceInteracted(true);}}
                  onFocus={()=>{setShowSources(true); setSourceInteracted(true);}}
                  placeholder="Search repositories..."
                  aria-label="Search target repository"
                  maxLength={500}
                  onKeyDown={e => {
                    if (e.key === "Escape") {
                      setShowSources(false);
                      if (srcObj) setSourceSearch(getSourceDisplay(srcObj));
                      else if (source === "") setSourceSearch("No repo (repoless)");
                    }
                  }}
                  style={{
                    ...inputSt,
                    paddingRight:36, fontSize:13, padding: "8px 10px",
                    background: "transparent",
                    border: (!sourceInteracted && !showSources && !showBranches) ? `1px solid ${T.brand}` : `1px solid ${T.border}`,
                    boxShadow: (!sourceInteracted && !showSources && !showBranches) ? `0 0 15px ${T.brand}40` : "none",
                    animation: (!sourceInteracted && !showSources && !showBranches) ? "pulseRepo 1s infinite ease-in-out" : "none",
                  }}
                />
                <div style={{position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", display:"flex", alignItems:"center", pointerEvents:"none"}}>
                  <Ic n="code" s={14} c={showSources?T.brand:T.muted}/>
                </div>

                {showSources && (
                  <>
                    <Backdrop onClick={()=>{
                      setShowSources(false);
                      if (srcObj) setSourceSearch(getSourceDisplay(srcObj));
                      else if (source === "") setSourceSearch("No repo (repoless)");
                    }} zIndex={2100}/>
                    <div style={{
                      position:"absolute", bottom:"100%", left:0, right:0, zIndex:2101,
                      marginBottom:4, background:T.surfaceHi, border:`1px solid ${T.borderHi}`,
                      borderRadius:6, maxHeight:180, overflowY:"auto",
                      boxShadow:"0 -10px 25px rgba(0,0,0,0.5)",
                    }}>
                      {filteredSources.length === 0 && (
                        <div style={{padding:"12px", textAlign:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.textDim}}>
                          NO REPOSITORIES FOUND
                        </div>
                      )}
                      {filteredSources.map((s, idx) => {
                        const sName = s === null ? "" : s.name;
                        const isSelected = sName === source;
                        return (
                          <button
                            key={s === null ? "_repoless" : s.name}
                            onClick={()=>{
                              setSource(sName);
                              setSourceSearch(getSourceDisplay(s));
                              setShowSources(false);
                              setSourceInteracted(true);
                            }}
                            style={{
                              width:"100%", padding:"10px 12px", background:"none", border:"none",
                              textAlign:"left", cursor:"pointer", display:"flex", alignItems:"center", gap:8,
                              borderBottom:idx < filteredSources.length - 1 ? `1px solid ${T.border}` : "none",
                              transition:"background .1s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                            onMouseEnter={e=>e.currentTarget.style.background=T.dim}
                            onMouseLeave={e=>e.currentTarget.style.background="none"}
                          >
                            <Ic n="code" s={12} c={isSelected?T.brand:T.muted}/>
                            <span style={{
                              flex:1, fontFamily:"'IBM Plex Sans',sans-serif", fontSize:14,
                              color:isSelected?T.brand:T.text, fontWeight:isSelected?600:400,
                              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                            }}>{getSourceDisplay(s)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {source && (
              <div style={{background:T.surfaceHi, borderRadius:10, padding:12, border:`1px solid ${T.border}`}}>
                <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.blue, fontWeight:800, letterSpacing:"0.1em", marginBottom:6}}>STARTING BRANCH</div>
                <div style={{position:"relative"}}>
                  <input
                    value={branch}
                    onChange={e=>{setBranch(e.target.value); setShowBranches(true);}}
                    onFocus={()=>setShowBranches(true)}
                    placeholder={defaultBranch || "main"}
                    aria-label="Starting branch"
                    maxLength={250}
                    onKeyDown={e => {
                      if (e.key === "Escape") {
                        setShowBranches(false);
                        setBranch(branch);
                      }
                    }}
                    aria-invalid={isBranchInvalid ? "true" : "false"}
                    aria-describedby={isBranchInvalid ? "new-session-branch-error" : undefined}
                    style={{
                      ...inputSt,
                      paddingRight:36,
                      fontSize:13,
                      padding: "8px 10px",
                      borderColor: isBranchInvalid ? T.red : T.border
                    }}
                  />
                  {isBranchInvalid && (
                    <div id="new-session-branch-error" role="alert" style={{marginTop:6, fontSize:11, color:T.red, fontFamily:"'JetBrains Mono',monospace", fontWeight:700}}>
                      ⚠️ Invalid Git branch name format. Spaces, consecutive dots (..), and characters like ~, ^, :, ?, *, [, \ are not allowed.
                    </div>
                  )}
                  <div style={{position:"absolute", right:10, top: isBranchInvalid ? "20px" : "50%", transform:"translateY(-50%)", display:"flex", alignItems:"center", pointerEvents:"none"}}>
                    <Ic n="branch" s={14} c={showBranches?T.brand:T.muted}/>
                  </div>

                  {showBranches && (
                    <>
                      <Backdrop onClick={()=>{
                        setShowBranches(false);
                        setBranch(branch);
                      }} zIndex={2100}/>
                      <div style={{
                        position:"absolute", bottom:"100%", left:0, right:0, zIndex:2101,
                        marginBottom:4, background:T.surfaceHi, border:`1px solid ${T.borderHi}`,
                        borderRadius:6, maxHeight:150, overflowY:"auto",
                        boxShadow:"0 -10px 25px rgba(0,0,0,0.5)",
                      }}>
                        {filteredBranches.length === 0 && (
                          <div style={{padding:"12px", textAlign:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.textDim}}>
                            NO BRANCHES FOUND
                          </div>
                        )}
                        {filteredBranches.map(b => (
                          <button
                            key={b}
                            onClick={()=>{setBranch(b); setShowBranches(false);}}
                            style={{
                              width:"100%", padding:"10px 12px", background:"none", border:"none",
                              textAlign:"left", cursor:"pointer", display:"flex", alignItems:"center", gap:8,
                              borderBottom:`1px solid ${T.border}33`, transition:"background .1s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                            onMouseEnter={e=>e.currentTarget.style.background=T.dim}
                            onMouseLeave={e=>e.currentTarget.style.background="none"}
                          >
                            <Ic n="branch" s={12} c={b===branch?T.brand:T.muted}/>
                            <span style={{
                              flex:1, fontFamily:"'IBM Plex Sans',sans-serif", fontSize:14,
                              color:b===branch?T.brand:T.text, fontWeight:b===branch?600:400,
                              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                            }}>{b}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div style={{background:T.surfaceHi, borderRadius:10, padding:16, border:`1px solid ${T.border}`}}>
              <ConflictRadar
                currentSource={source}
                currentBranch={branch || defaultBranch}
                currentPrompt={prompt}
                allSessions={allSessions}
                activitiesMap={activitiesMap}
              />
              <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.purple, fontWeight:800, letterSpacing:"0.1em", marginBottom:8, marginTop: 12}}>PROMPT SUMMARY</div>
              <div style={{fontFamily:"'IBM Plex Sans',sans-serif", fontSize:14, color:T.textDim, lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden", marginBottom: selectedPersonas.size > 0 ? 12 : 0}}>
                {prompt}
              </div>
              {selectedPersonas.size > 0 && (
                <div style={{display:"flex", gap:4, flexWrap:"wrap", paddingTop:8, borderTop:`1px solid ${T.border}`}}>
                  {Array.from(selectedPersonas).map(id => {
                    const p = personas.find(x => x.id === id);
                    return p ? (
                      <span key={id} style={{fontSize:9, fontWeight:800, color:p.color, background:`${p.color}15`, padding:"2px 6px", borderRadius:4, border:`1px solid ${p.color}30`}}>
                        {p.label}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {(autoMode || reqApproval) && (
              <div style={{display:"flex", gap:10}}>
                {autoMode && (
                  <div style={{flex:1, display:"flex", alignItems:"center", gap:6, padding:"8px 12px", background:T.brandDim, border:`1px solid ${T.brand}30`, borderRadius:8}}>
                    <Ic n="check" s={12} c={T.brand}/>
                    <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.brand, fontWeight:800}}>AUTO PR</span>
                  </div>
                )}
                {reqApproval && (
                  <div style={{flex:1, display:"flex", alignItems:"center", gap:6, padding:"8px 12px", background:T.purpleDim, border:`1px solid ${T.purple}30`, borderRadius:8}}>
                    <Ic n="plan" s={12} c={T.purple}/>
                    <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.purple, fontWeight:800}}>PLAN REVIEW</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
      <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}33`,background:T.surface,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        {!isDesktop&&<button onClick={onBack} title="Go back" aria-label="Go back" style={{background:"none",border:"none",cursor:"pointer",display:"flex"}}><Ic n="back" s={18} c={T.text}/></button>}
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.text,letterSpacing:"0.05em",fontWeight:700,flex:1}}>NEW SESSION</div>
        {/* Draft indicator */}
        {draft&&(prompt||branch!=="main")&&!savedFlash&&(
          <button onClick={handleClearDraft} title="Clear saved draft" aria-label="Clear saved draft" style={{
            display:"flex",alignItems:"center",gap:5,padding:"3px 9px",borderRadius:20,
            background:T.amberDim,border:`1px solid ${T.amber}40`,cursor:"pointer",
            fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.amber,letterSpacing:"0.07em",
          }}>
            <span style={{width:4,height:4,borderRadius:"50%",background:T.amber,flexShrink:0}}/>
            DRAFT
          </button>
        )}
        {savedFlash&&(
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.textDim,padding:"3px 9px"}}>CLEARED</span>
        )}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px 20px",WebkitOverflowScrolling:"touch",minHeight:0}}>
        <div style={{maxWidth:560,margin:"0 auto"}}>
          {err&&<div id="new-session-error" role="alert" style={{padding:"8px 12px",borderRadius:5,marginBottom:12,background:T.redDim,border:`1px solid ${T.red}40`,fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:T.red}}>{err}</div>}

          <Field label="TASK PROMPT *" htmlFor="new-session-prompt-textarea" style={{marginBottom:12}}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: -18, right: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.textDim, opacity: 0.8 }}>
                {fmtChars(prompt.length)}
              </div>
              <textarea
                id="new-session-prompt-textarea"
                value={prompt}
                onChange={e=>setPrompt(e.target.value)}
                placeholder="Describe the coding task for Jules to execute…"
                aria-label="Describe the coding task for Jules to execute"
                aria-invalid={err ? "true" : "false"}
                aria-describedby={err ? "new-session-error" : undefined}
                rows={6} maxLength={20000} style={{
                  ...inputSt, resize:"vertical", lineHeight:1.5,
                  paddingBottom: 40,
                  borderColor: err ? T.red : T.border,
                  ...(expanded ? {
                    position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:1000,
                    margin:0, borderRadius:0, height:"100vh", padding:"60px 24px 80px"
                  } : {})
                }}/>
              <div style={{
                position:expanded?"fixed":"absolute", bottom:expanded?24:8, right:expanded?24:8, zIndex:1001,
                display:"flex", gap:8,
                padding: "2px 6px", borderRadius: 6,
                background: expanded ? T.surfaceHi : "rgba(11, 14, 20, 0.6)",
                backdropFilter: expanded ? "none" : "blur(4px)",
              }}>
                {prompt.trim() && (
                   <button onClick={()=>setPrompt("")} title="Clear Prompt" aria-label="Clear Prompt" style={{background:"transparent", border:"none", padding:4, cursor:"pointer", display:"flex", alignItems:"center"}}>
                     <Ic n="x" s={14} c={T.red}/>
                   </button>
                )}
                <button onClick={()=>setExpanded(!expanded)} title={expanded?"Minimize":"Expand"} aria-label={expanded?"Minimize":"Expand"} style={{background:"transparent", border:"none", padding:4, cursor:"pointer", display:"flex", alignItems:"center"}}>
                  <Ic n={expanded?"chevron_down":"expand"} s={14} c={T.brand}/>
                </button>
              </div>
            </div>
          </Field>

          <div style={{marginBottom:12}}>
            <div style={{marginBottom:8,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.textDim,fontWeight:700,letterSpacing:"0.12em"}}>ROLES & FOCUS</div>
            <MultiPersonaPicker personas={personas} selectedIds={selectedPersonas} onToggle={togglePersona} style={{marginBottom:8}} />

            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[
                {label:"AUTO PR",    val:autoMode,   set:setAutoMode, hint:"Create PR when done", disabled:!source},
                {label:"APPROVE PLAN",val:reqApproval,set:setReqApp,  hint:"Review plan first"},
              ].map(opt=>(
                <button
                  key={opt.label}
                  onClick={()=>!opt.disabled&&opt.set(v=>!v)}
                  disabled={opt.disabled}
                  title={`${opt.label}: ${opt.hint}`}
                  aria-label={`${opt.label}: ${opt.hint}`}
                  aria-pressed={opt.val ? "true" : "false"}
                  style={{
                    flex:"1 1 100px",padding:"8px",borderRadius:5,cursor:opt.disabled?"default":"pointer",
                    background:opt.val?T.brandDim:T.surfaceHi,
                    border:`1px solid ${opt.val?T.brand+"50":T.border}`,
                    display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                    opacity:opt.disabled?0.4:1,
                  }}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:opt.val?T.brand:T.muted,letterSpacing:"0.08em"}}>{opt.label}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.textDim}}>{opt.hint}</div>
                </button>
              ))}
            </div>
          </div>


          <div style={{padding:"8px 12px",borderRadius:5,marginBottom:8,background:T.brandDim,border:`1px solid ${T.brand}30`,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.brand,lineHeight:1.7}}>
            ⚡ PAYLOAD: ~{payloadEst}KB<span style={{color:T.textDim}}> · web baseline ~180KB</span>
          </div>

          {plan&&(
            <div style={{
              padding:"8px 12px",borderRadius:5,marginBottom:12,
              background:todayCount.total>=plan.daily?T.redDim:T.surfaceHi,
              border:`1px solid ${todayCount.total>=plan.daily?T.red+"40":T.border}`,
              fontFamily:"'JetBrains Mono',monospace",fontSize:11,lineHeight:1.7,
              color:todayCount.total>=plan.daily?T.red:T.muted,
            }}>
              {todayCount.total>=plan.daily
                ? `⛔ Daily limit reached (${plan.daily} tasks on ${plan.label} plan). Next recovery at ${fmtTime(todayCount.nextResetTs)} (in ${todayCount.resetIn}).`
                : (
                  <>
                    <div>📋 {plan.label} plan · {todayCount.total}/{plan.daily} tasks started · {todayCount.done} PRs created</div>
                    {todayCount.nextResetTs && <div style={{fontSize:11, color:T.amber, marginTop:4, fontWeight:700}}>Next slot recovered at {fmtTime(todayCount.nextResetTs)} ({todayCount.resetIn})</div>}
                  </>
                )
              }
            </div>
          )}

          {(() => {
            const isOverQuota = plan && todayCount.total >= plan.daily;
            let startBtnTitle = undefined;
            if (!prompt.trim()) {
              startBtnTitle = "Please enter a task prompt first";
            } else if (submitting) {
              startBtnTitle = "Assigning task to Jules...";
            } else if (loadingSrc) {
              startBtnTitle = "Loading repositories...";
            } else if (isOverQuota) {
              startBtnTitle = `Daily quota limit reached (${todayCount.total} of ${plan.daily} started). Reset in ${todayCount.resetIn || "24h"}.`;
            } else {
              startBtnTitle = "Assign task to Jules";
            }

            let draftBtnTitle = undefined;
            if (!prompt.trim()) {
              draftBtnTitle = "Please enter a task prompt first";
            } else if (submitting) {
              draftBtnTitle = "Submitting task...";
            } else {
              draftBtnTitle = "Save current session draft";
            }

            return (
              <div style={{display:"flex", gap:10}}>
                <Btn onClick={handleSaveToBox} disabled={!prompt.trim()||submitting} outline title={draftBtnTitle} aria-label={draftBtnTitle} style={{flex:1}}>
                  <Ic n="archive" s={14} c={T.brand}/>
                  SAVE DRAFT
                </Btn>
                <Btn onClick={() => setShowConfirm(true)} disabled={!prompt.trim()||submitting||loadingSrc||isOverQuota} title={startBtnTitle} aria-label={startBtnTitle} style={{flex:2}}>
                  {submitting?"SENDING…":"ASSIGN TO JULES →"}
                </Btn>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

// ─── Drafts Box ───────────────────────────────────────────────────────────────
