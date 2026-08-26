const SettingsView = ({ onBack, isDesktop, settings, personas, setPersonas, todayCount, apiKey, setApiKey, githubToken, setGithubToken, ghRateLimitedReset }) => {
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
    apiTimeout, setApiTimeout,
    leanDirective, setLeanDirective,
    plan
  } = settings;

  const [tab, setTab] = useState("general");
  const [comparisonMode, setComparisonMode] = useState("compare"); // "current", "simplified", "compare"
  const [hasSaved, setHasSaved] = useState(false);
  const saveTimer = useRef(null);

  const [isAdding, setIsAdding] = useState(false);
  const [editingPersona, setEditingPersona] = useState(null);
  const [newName, setNewName] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [newColor, setNewColor] = useState("#ffffff");
  const [showKey, setShowKey] = useState(false);
  const [showGhKey, setShowGhKey] = useState(false);
  const [bucketTimeframe, setBucketTimeframe] = useState("overall");

  const triggerSaveFeedback = () => {
    setHasSaved(true);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setHasSaved(false), 2000);
  };
  const [snap, setSnap] = useState(NET.snapshot());
  const [storage, setStorage] = useState(null);

  useEffect(() => NET.subscribe(s => setSnap(s)), []);
  useEffect(() => { getStorageInfo().then(setStorage); }, []);

  const { total, totalIn, totalOut, log } = snap;
  const webEst = total * 9 + 2.4;
  const reduction = total > 0 ? Math.round(((webEst - total) / webEst) * 100) : 0;

  const TABS = [
    { id: "general", label: "GENERAL", ic: "settings" },
    { id: "personas",label: "PERSONAS", ic: "tasks" },
    { id: "network", label: "NETWORK", ic: "layers" },
    { id: "storage", label: "STORAGE", ic: "database" },
    { id: "api",     label: "API KEY", ic: "key" },
    { id: "design",  label: "DESIGN LAB", ic: "layout_toggle" },
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0}}>
      <div style={{padding:"12px 16px 0",borderBottom:`1px solid ${T.border}33`,background:T.surface,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          {!isDesktop&&<button onClick={onBack} title="Go back" aria-label="Go back" style={{background:"none",border:"none",cursor:"pointer",display:"flex"}}><Ic n="back" s={18} c={T.text}/></button>}
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.text,letterSpacing:"0.05em",fontWeight:700,flex:1}}>APP SETTINGS</div>
          {isDesktop && (
            <button onClick={onBack} title="Close Settings" aria-label="Close Settings" style={{background:"none",border:"none",cursor:"pointer",display:"flex",padding:4,opacity:0.8}}>
              <Ic n="x" s={18} c={T.text}/>
            </button>
          )}
        </div>
          <div role="tablist" style={{display:"flex", gap:16, position:"relative", borderBottom:`1px solid ${T.border}33`, overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch"}}>
          {TABS.map(t => (
            <button key={t.id} role="tab" aria-selected={tab===t.id?"true":"false"} onClick={() => setTab(t.id)} style={{
              padding:"8px 4px", background:"none", border:"none", cursor:"pointer",
              borderBottom:`2px solid ${tab===t.id?T.brand:"transparent"}`,
              marginBottom: -1, whiteSpace: "nowrap",
              color:tab===t.id?T.text:T.muted, fontFamily:"'JetBrains Mono',monospace",
              fontSize:11, fontWeight:tab===t.id?800:600, letterSpacing:"0.05em", transition:"all .2s cubic-bezier(0.4, 0, 0.2, 1)",
              display:"flex", alignItems:"center", gap:6,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = T.text; }}
            onMouseLeave={(e) => { if (tab !== t.id) e.currentTarget.style.color = T.muted; }}
            >
              <Ic n={t.ic} s={12} c={tab===t.id?T.brand:T.muted} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"20px 24px",WebkitOverflowScrolling:"touch",minHeight:0}}>
        <div style={{maxWidth:560,margin:"0 auto"}}>

          {tab === "api" && (() => {
            const isKeyInvalid = apiKey ? !isValidGoogleApiKey(apiKey) : false;
            const isGhTokenInvalid = githubToken ? !isValidGithubToken(githubToken) : false;
            return (
              <div style={{animation:"fadeIn .2s ease", display:"flex", flexDirection:"column", gap:24}}>
                <div style={{background:T.surfaceHi, padding:20, borderRadius:12, border:`1px solid ${T.border}`}}>
                  <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:16}}>
                    <Ic n="key" s={16} c={T.brand}/>
                    <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:T.text}}>API KEY</span>
                  </div>
                  <div style={{marginBottom:10}}>
                    <label htmlFor="jules_api_key_settings" style={{fontSize:11, color:T.textDim, marginBottom:8, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, display: "block"}}>GOOGLE API KEY</label>
                    <div style={{display:"flex", alignItems:"center", gap:8}}>
                      <input
                        id="jules_api_key_settings"
                        type={showKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => {
                          const newKey = e.target.value.trim();
                          SafeStorage.saveApiKey(newKey);
                          setApiKey(newKey);
                          triggerSaveFeedback();
                        }}
                        placeholder="Paste your API key..."
                        maxLength={200}
                        aria-invalid={isKeyInvalid ? "true" : "false"}
                        aria-describedby={isKeyInvalid ? "settings-api-key-error" : undefined}
                        style={{
                          ...inputSt,
                          fontSize:13,
                          flex:1,
                          borderColor: isKeyInvalid ? T.red : T.border
                        }}
                      />
                      <button onClick={() => setShowKey(!showKey)} title={showKey ? "Hide API Key" : "Show API Key"} aria-label={showKey ? "Hide API Key" : "Show API Key"} style={{background:T.surface, border:`1px solid ${T.border}`, padding:10, borderRadius:8, cursor:"pointer"}}>
                        <Ic n={showKey ? "eye_closed" : "eye"} s={16} c={T.muted}/>
                      </button>
                    </div>
                    {isKeyInvalid && (
                      <div id="settings-api-key-error" role="alert" style={{marginTop:6, fontSize:11, color:T.red, fontFamily:"'JetBrains Mono',monospace", fontWeight:700}}>
                        ⚠️ Invalid API key format detected. Only printable non-space ASCII characters are allowed.
                      </div>
                    )}
                    <div style={{marginTop:6, fontSize:10, color:T.textDim, fontFamily:"'IBM Plex Sans',sans-serif"}}>
                      Your key is stored locally in your browser.
                    </div>
                  </div>
                </div>

                <div style={{background:T.surfaceHi, padding:20, borderRadius:12, border:`1px solid ${T.border}`}}>
                  <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:16}}>
                    <Ic n="git_pull" s={16} c={T.brand}/>
                    <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:T.text}}>GITHUB PAT (OPTIONAL)</span>
                  </div>
                  <div style={{marginBottom:10}}>
                    <label htmlFor="github_pat_settings" style={{fontSize:11, color:T.textDim, marginBottom:8, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, display: "block"}}>GITHUB PERSONAL ACCESS TOKEN</label>
                    <div style={{display:"flex", alignItems:"center", gap:8}}>
                      <input
                        id="github_pat_settings"
                        type={showGhKey ? "text" : "password"}
                        value={githubToken}
                        onChange={(e) => {
                          const newToken = e.target.value.trim();
                          SafeStorage.saveGithubToken(newToken);
                          setGithubToken(newToken);
                          triggerSaveFeedback();
                        }}
                        placeholder="ghp_..."
                        maxLength={200}
                        aria-invalid={isGhTokenInvalid ? "true" : "false"}
                        aria-describedby={isGhTokenInvalid ? "settings-github-token-error" : undefined}
                        style={{
                          ...inputSt,
                          fontSize:13,
                          flex:1,
                          borderColor: isGhTokenInvalid ? T.red : T.border
                        }}
                      />
                      <button onClick={() => setShowGhKey(!showGhKey)} title={showGhKey ? "Hide Token" : "Show Token"} aria-label={showGhKey ? "Hide Token" : "Show Token"} style={{background:T.surface, border:`1px solid ${T.border}`, padding:10, borderRadius:8, cursor:"pointer"}}>
                        <Ic n={showGhKey ? "eye_closed" : "eye"} s={16} c={T.muted}/>
                      </button>
                    </div>
                    {isGhTokenInvalid && (
                      <div id="settings-github-token-error" role="alert" style={{marginTop:6, fontSize:11, color:T.red, fontFamily:"'JetBrains Mono',monospace", fontWeight:700}}>
                        ⚠️ Invalid GitHub token format detected. Only printable non-space ASCII characters are allowed.
                      </div>
                    )}
                    <div style={{marginTop:6, fontSize:10, color:T.textDim, fontFamily:"'IBM Plex Sans',sans-serif"}}>
                      Allows querying public/private GitHub repositories without rate limits. Stored locally in your browser.
                    </div>
                    {ghRateLimitedReset && (
                      <div role="alert" style={{marginTop:8, fontSize:11, color:T.amber, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, background: `${T.amber}10`, padding: 8, borderRadius: 6, border: `1px solid ${T.amber}30`}}>
                        ⚠️ GitHub rate limit exceeded. Public API is limited to 60 req/hr. Reset at {ghRateLimitedReset}. Configure a Personal Access Token to increase this limit.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {tab === "general" && (
            <div style={{animation:"fadeIn .2s ease", display:"flex", flexDirection:"column", gap:24}}>
              <div style={{background:T.surfaceHi, padding:20, borderRadius:12, border:`1px solid ${T.border}`}}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:16}}>
                  <Ic n="refresh" s={16} c={T.brand}/>
                  <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:T.text}}>POLLING & REFRESH</span>
                </div>

                <div style={{marginBottom:20}}>
                  <div style={{fontSize:11, color:T.textDim, marginBottom:8, fontFamily:"'JetBrains Mono',monospace", fontWeight:700}}>SESSION LIST</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {POLL_OPTIONS.map(opt => {
                      const isAct = opt.ms === pollInterval;
                      const c = isAct ? (opt.ms===0 ? T.red : T.brand) : T.muted;
                      return (
                        <PickerBtn key={opt.label} label={opt.label} isAct={isAct} activeColor={c} onClick={()=>{setPollInterval(opt.ms); triggerSaveFeedback();}} />
                      );
                    })}
                  </div>
                </div>

                <div style={{marginBottom:20}}>
                  <div style={{fontSize:11, color:T.textDim, marginBottom:8, fontFamily:"'JetBrains Mono',monospace", fontWeight:700}}>ACTIVE SESSIONS (IN-PROGRESS)</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {POLL_OPTIONS.map(opt => {
                      const isAct = opt.ms === activePollInterval;
                      const c = isAct ? (opt.ms===0 ? T.red : T.brand) : T.muted;
                      return (
                        <PickerBtn key={opt.label} label={opt.label} isAct={isAct} activeColor={c} onClick={()=>{setActivePollInterval(opt.ms); triggerSaveFeedback();}} />
                      );
                    })}
                  </div>
                  <div style={{marginTop:6, fontSize:10, color:T.textDim, fontFamily:"'IBM Plex Sans',sans-serif"}}>
                    Boost polling frequency automatically when any session is active.
                  </div>
                </div>

                <div style={{marginBottom:20}}>
                  <div style={{fontSize:11, color:T.textDim, marginBottom:8, fontFamily:"'JetBrains Mono',monospace", fontWeight:700}}>SESSION DETAIL</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {POLL_OPTIONS.map(opt => {
                      const isAct = opt.ms === actPollInterval;
                      const c = isAct ? (opt.ms===0 ? T.red : T.brand) : T.muted;
                      return (
                        <PickerBtn key={opt.label} label={opt.label} isAct={isAct} activeColor={c} onClick={()=>{setActPollInterval(opt.ms); triggerSaveFeedback();}} />
                      );
                    })}
                  </div>
                </div>

                <div style={{marginBottom:20}}>
                  <div style={{fontSize:11, color:T.textDim, marginBottom:8, fontFamily:"'JetBrains Mono',monospace", fontWeight:700}}>SESSION FETCH LIMIT</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {LIMIT_OPTIONS.map(opt => {
                      const isAct = opt.val === sessionLimit;
                      return (
                        <PickerBtn key={opt.label} label={opt.label} isAct={isAct} onClick={()=>{setSessionLimit(opt.val); triggerSaveFeedback();}} />
                      );
                    })}
                  </div>
                </div>

                <div style={{marginBottom:20}}>
                  <div style={{fontSize:11, color:T.textDim, marginBottom:8, fontFamily:"'JetBrains Mono',monospace", fontWeight:700}}>ACTIVITY HISTORY LIMIT</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {ACTIVITY_LIMIT_OPTIONS.map(opt => {
                      const isAct = opt.val === activityLimit;
                      return (
                        <PickerBtn key={opt.label} label={opt.label} isAct={isAct} onClick={()=>{setActivityLimit(opt.val); triggerSaveFeedback();}} />
                      );
                    })}
                  </div>
                  <div style={{marginTop:6, fontSize:10, color:T.textDim, fontFamily:"'IBM Plex Sans',sans-serif"}}>
                    Controls the maximum number of activity items loaded and stored per session.
                  </div>
                </div>

                <div style={{marginBottom:20}}>
                  <div style={{fontSize:11, color:T.textDim, marginBottom:8, fontFamily:"'JetBrains Mono',monospace", fontWeight:700}}>BROWSER NOTIFICATIONS</div>
                  <div style={{display:"flex", gap:12, alignItems:"center"}}>
                     <button
                       onClick={() => { setNotifications(!notifications); triggerSaveFeedback(); }}
                       style={{
                         padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                         background: notifications ? T.brand : T.surfaceHi,
                         color: notifications ? "#000" : T.muted,
                         fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 800,
                         outline: `1px solid ${notifications ? T.brand : T.border}`,
                         transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)"
                       }}
                     >
                       {notifications ? "ENABLED" : "DISABLED"}
                     </button>
                     <div style={{fontSize:10, color:T.textDim, fontFamily:"'IBM Plex Sans',sans-serif", lineHeight:1.3}}>
                       Notify on status changes like "DONE" or "APPROVE".
                     </div>
                  </div>
                </div>

                <div style={{marginTop:8, background:T.amberDim, border:`1px solid ${T.amber}20`, borderRadius:8, padding:12, fontFamily:"'IBM Plex Sans',sans-serif", fontSize:11, color:T.amber, lineHeight:1.5}}>
                  <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4}}>
                    <Ic n="wifi" s={14} c={T.amber}/>
                    <strong style={{fontSize:10, letterSpacing:"0.05em"}}>ROLLING 24H WINDOW</strong>
                  </div>
                  The session counter uses a sliding 24-hour window. Tasks expire exactly 24 hours after they were created.
                </div>
              </div>

              <div style={{background:T.surfaceHi, padding:20, borderRadius:12, border:`1px solid ${T.border}`}}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:16}}>
                  <Ic n="zap" s={16} c={T.brand}/>
                  <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:T.text}}>LEAN MODE SYSTEM DIRECTIVE</span>
                </div>
                <div>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
                    <label htmlFor="lean_directive_input" style={{fontSize:11, color:T.textDim, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, cursor:"pointer"}}>PROMPT DIRECTIVE</label>
                    <div style={{display:"flex", alignItems:"center", gap:12}}>
                      <span style={{fontSize:10, color:T.muted, fontFamily:"'JetBrains Mono',monospace"}}>{fmtChars(leanDirective.length)}/1kc</span>
                      <button
                        onClick={() => {
                          setLeanDirective(DEFAULT_LEAN_DIRECTIVE);
                          triggerSaveFeedback();
                        }}
                        style={{background:"none", border:"none", cursor:"pointer", color:T.brand, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700}}
                        title="Reset system directive to default"
                        aria-label="Reset system directive to default"
                      >
                        RESET DEFAULT
                      </button>
                    </div>
                  </div>
                  <textarea
                    id="lean_directive_input"
                    value={leanDirective}
                    onChange={(e) => {
                      setLeanDirective(e.target.value);
                      triggerSaveFeedback();
                    }}
                    placeholder="Enter system directive injected when Lean Payload Mode is enabled..."
                    aria-label="Lean Mode System Directive"
                    maxLength={1000}
                    style={{
                      width:"100%",
                      height:90,
                      background:T.surface,
                      border:`1px solid ${T.border}`,
                      borderRadius:8,
                      padding:12,
                      color:T.text,
                      fontSize:12,
                      fontFamily:"'IBM Plex Sans',sans-serif",
                      resize:"vertical",
                      boxSizing:"border-box",
                      outline:"none",
                      lineHeight:1.5
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = T.brand}
                    onBlur={e => e.currentTarget.style.borderColor = T.border}
                  />
                  <div style={{marginTop:6, fontSize:10, color:T.textDim, fontFamily:"'IBM Plex Sans',sans-serif", lineHeight:1.4}}>
                    This directive is automatically appended to session prompts when Lean Payload Mode is toggled ON for a repository.
                  </div>
                </div>
              </div>

              <div style={{background:T.surfaceHi, padding:20, borderRadius:12, border:`1px solid ${T.border}`}}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:16}}>
                  <Ic n="tasks" s={16} c={T.purple}/>
                  <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:T.text}}>PLAN & QUOTA</span>
                </div>

                <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:16}}>
                  {PLANS.map(p=>(
                    <PickerBtn key={p.id} label={p.label} isAct={p.id===planId} onClick={()=>{setPlanId(p.id); triggerSaveFeedback();}} />
                  ))}
                </div>

                {planId==="custom" && (
                  <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:16, background:T.surface, padding:12, borderRadius:8, border:`1px solid ${T.border}`}}>
                    <label htmlFor="custom-daily-limit" style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.textDim, fontWeight:700, cursor:"pointer"}}>DAILY LIMIT:</label>
                    <input
                      id="custom-daily-limit"
                      type="number"
                      value={customDaily}
                      onChange={e=>{setCustomDaily(Math.max(1, parseInt(e.target.value)||1)); triggerSaveFeedback();}}
                      aria-label="Custom daily session limit"
                      style={{...inputSt, width:80, padding:"6px 10px", fontSize:14}}
                    />
                  </div>
                )}

                <div style={{background:T.surface, padding:16, borderRadius:8, border:`1px solid ${T.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,alignItems:"center"}}>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.textDim,fontWeight:700}}>DAILY USAGE</span>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:todayCount.total>=plan.daily?T.red:T.brand,fontWeight:800}}>
                      {todayCount.total} / {plan.daily} <span style={{fontSize:10, opacity:0.9}}>SESSIONS</span>
                    </span>
                  </div>
                  <div style={{height:4,background:T.line,borderRadius:2,overflow:"hidden"}}>
                    <div style={{
                      height:"100%",borderRadius:2,transition:"width .5s cubic-bezier(0.4, 0, 0.2, 1)",
                      width:`${Math.min(100,(todayCount.total/plan.daily)*100)}%`,
                      background:todayCount.total>=plan.daily?T.red:todayCount.total/plan.daily>0.8?T.amber:T.brand,
                      boxShadow:`0 0 10px ${todayCount.total>=plan.daily?T.red:T.brand}30`,
                    }}/>
                  </div>
                  <div style={{marginTop:12,fontSize:11,color:T.textDim,fontFamily:"'IBM Plex Sans',sans-serif",lineHeight:1.6, opacity:0.8}}>
                    <div style={{marginBottom:6}}>
                      <div>{todayCount.done} Pull Requests created today</div>
                    </div>
                    <div>{plan.model} · {plan.concurrent} concurrent max</div>
                  </div>

                  <QuotaTimeline todayCount={todayCount} plan={plan} />

                  {todayCount.total>=plan.daily && (
                    <div style={{background:T.redDim, border:`1px solid ${T.red}40`, borderRadius:8, padding:12, fontFamily:"'IBM Plex Sans',sans-serif", fontSize:11, color:T.red, lineHeight:1.5, marginTop:16}}>
                      <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4}}>
                        <span style={{fontSize:16}}>⛔</span>
                        <strong style={{fontSize:10, letterSpacing:"0.05em"}}>DAILY LIMIT REACHED</strong>
                      </div>
                      You have used all {plan.daily} sessions for today. The next slot will be recovered at {fmtTime(todayCount.nextResetTs)}.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "network" && (
            <div style={{animation:"fadeIn .2s ease", display:"flex", flexDirection:"column", gap:20}} role="region" aria-label="Network Activity">
              <div style={{background:T.brandDim, border:`1px solid ${T.brand}40`, borderRadius:12, padding:16, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.brand, fontWeight:800, letterSpacing:"0.1em", marginBottom:4}}>CURRENT SESSION BUCKET</div>
                  <div style={{display:"flex", gap:16, alignItems:"baseline"}}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:24, fontWeight:900, color:T.textHi}}>
                      {fmtBytes(snap.session.in + snap.session.out)}
                    </div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.brand, fontWeight:700}}>
                      {snap.duration}
                    </div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.dim, fontWeight:700}}>↑ {fmtBytes(snap.session.out)}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.brand, fontWeight:700}}>↓ {fmtBytes(snap.session.in)}</div>
                </div>
              </div>

              <div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.textDim,letterSpacing:"0.08em",fontWeight:700,marginBottom:12}}>BANDWIDTH USAGE</div>
                <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:12}}>
                  {[
                    { l: "TODAY", in: snap.today.in, out: snap.today.out, c: T.brand },
                    { l: "MONTH", in: snap.month.in, out: snap.month.out, c: T.purple },
                    { l: "OVERALL", in: snap.overall.in, out: snap.overall.out, c: T.amber },
                  ].map(s => (
                    <div key={s.l} style={{background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:12, padding:16}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.dim, letterSpacing:"0.1em", fontWeight:800, marginBottom:8}}>{s.l}</div>
                      <div style={{display:"flex", flexDirection:"column", gap:4}}>
                        <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
                          <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.dim}}>IN</span>
                          <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:900, color:s.c}}>{fmtBytes(s.in)}</span>
                        </div>
                        <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
                          <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.dim}}>OUT</span>
                          <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:900, color:T.textHi}}>{fmtBytes(s.out)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} role="list">
                {[
                  {l:"SESSIONS EFFICIENCY", v:`${reduction}%`,   c:T.brand,  desc:"Data saved vs. standard mobile"},
                  {l:"REQUESTS LOGGED",   v:log.length,        c:T.blue,   desc:"API calls in current session"},
                ].map(s=>(
                  <div key={s.l} style={{background:T.surfaceHi,border:`1px solid ${T.border}`,borderRadius:12,padding:16}} role="listitem">
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.textDim,letterSpacing:"0.1em",marginBottom:6,fontWeight:700}}>{s.l}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:900,color:s.c,marginBottom:4}}>{s.v}</div>
                    <div style={{fontSize:9, color:T.textDim, fontFamily:"'IBM Plex Sans',sans-serif", lineHeight:1.2}}>{s.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{background:T.amberDim,border:`1px solid ${T.amber}20`,borderRadius:12,padding:16,fontFamily:"'IBM Plex Sans',sans-serif",fontSize:12,color:T.amber,lineHeight:1.6, display:"flex", gap:12, alignItems:"center"}}>
                <span style={{fontSize:20}} aria-hidden="true">⚡</span>
                <div>Smart delta-polling is active. Bandwidth is conserved by only fetching session changes.</div>
              </div>

              <div style={{background:T.surfaceHi, padding:20, borderRadius:12, border:`1px solid ${T.border}`}}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:16}}>
                  <Ic n="clock" s={16} c={T.brand}/>
                  <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:T.text}}>API REQUEST TIMEOUT</span>
                </div>
                <div>
                  <div style={{display:"flex", gap:4, flexWrap:"wrap", marginBottom:12}}>
                    {[
                      { label: "15s", ms: 15000 },
                      { label: "30s (DEFAULT)", ms: 30000 },
                      { label: "60s", ms: 60000 },
                      { label: "120s", ms: 120000 }
                    ].map(opt => {
                      const isAct = opt.ms === apiTimeout;
                      return (
                        <PickerBtn key={opt.label} label={opt.label} isAct={isAct} onClick={() => { setApiTimeout(opt.ms); triggerSaveFeedback(); }} />
                      );
                    })}
                  </div>
                  <div style={{fontSize:10, color:T.textDim, fontFamily:"'IBM Plex Sans',sans-serif", lineHeight:1.4}}>
                    Controls how long the client waits for an API response before aborting. Higher limits are recommended on slower networks or for complex tasks.
                  </div>
                </div>
              </div>

              <RecentActivityLog log={log} total={total} />
            </div>
          )}

          {tab === "personas" && (
            <div style={{animation:"fadeIn .2s ease", display:"flex", flexDirection:"column", gap:16}}>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4}}>
                <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.textDim, fontWeight:700, letterSpacing:"0.05em"}}>CUSTOM ROLE PROMPTS</div>
                <div style={{display:"flex", alignItems:"center", gap:12}}>
                  <button onClick={() => {
                    setNewName("");
                    setNewPrompt("");
                    setNewColor("#ff66cc");
                    setIsAdding(true);
                  }} title="Add new custom persona" aria-label="Add new custom persona" style={{background:"none", border:"none", cursor:"pointer", color:T.brand, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700}}>+ ADD CUSTOM</button>
                  <button onClick={() => { if(confirm("Reset all personas to defaults?")) { setPersonas(resetPersonas()); } }} title="Reset all personas to default values" aria-label="Reset all personas to default values" style={{background:"none", border:"none", cursor:"pointer", color:T.red, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700}}>RESET ALL</button>
                </div>
              </div>
              {personas.map(p => (
                <div key={p.id} style={{background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:10, padding:14}}>
                  <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
                    <div style={{width:8, height:8, borderRadius:"50%", background:p.color}}/>
                    <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:800, color:T.textHi}}>{p.label}</span>
                    {p.isCustom && <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.brand, background:`${T.brand}15`, padding:"1px 4px", borderRadius:4, fontWeight:700}}>CUSTOM</span>}
                    <span style={{flex:1}}/>
                    <button onClick={() => {
                      setNewName(p.label);
                      setNewPrompt(p.prompt);
                      setNewColor(p.color || "#ffffff");
                      setEditingPersona(p);
                    }} title={`Edit ${p.label} role prompt`} aria-label={`Edit ${p.label} role prompt`} style={{background:T.brandDim, border:"none", borderRadius:4, padding:"3px 8px", cursor:"pointer", color:T.brand, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700}}>EDIT ROLE</button>
                  </div>
                  <ExpandablePersonaPrompt prompt={p.prompt} />
                </div>
              ))}
            </div>
          )}

          {tab === "storage" && (
            <div style={{animation:"fadeIn .3s cubic-bezier(0.4, 0, 0.2, 1)", display:"flex", flexDirection:"column", gap:24}}>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
                <div style={{background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:12, padding:18, display:"flex", flexDirection:"column"}}>
                  <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:12}}>
                    <Ic n="database" s={14} c={T.purple}/>
                    <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color:T.textDim}}>APP DATA</span>
                  </div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:24, fontWeight:900, color:T.text, marginBottom:16}}>{storage ? fmtBytes((storage.local||0)/1024) : "..."}<span style={{fontSize:10, color:T.textDim, marginLeft:4, fontWeight:500}}>USED</span></div>
                  <button onClick={clearDataOnly} style={{
                    width:"100%", padding:"10px", borderRadius:8, background:`${T.purple}15`, border:`1px solid ${T.purple}30`,
                    color:T.purple, fontSize:10, fontWeight:800, fontFamily:"'JetBrains Mono',monospace", cursor:"pointer",
                    transition:"all .2s cubic-bezier(0.4, 0, 0.2, 1)"
                  }} onMouseEnter={e=>e.currentTarget.style.background=`${T.purple}25`} onMouseLeave={e=>e.currentTarget.style.background=`${T.purple}15`}>CLEAR DATA</button>
                </div>

                <div style={{background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:12, padding:18, display:"flex", flexDirection:"column"}}>
                  <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:12}}>
                    <Ic n="layers" s={14} c={T.blue}/>
                    <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color:T.textDim}}>CACHE</span>
                  </div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:24, fontWeight:900, color:T.text, marginBottom:16}}>{storage ? fmtBytes((storage.cache||0)/1024) : "..."}<span style={{fontSize:10, color:T.textDim, marginLeft:4, fontWeight:500}}>TOTAL</span></div>
                  <button onClick={clearCacheOnly} style={{
                    width:"100%", padding:"10px", borderRadius:8, background:`${T.blue}15`, border:`1px solid ${T.blue}30`,
                    color:T.blue, fontSize:10, fontWeight:800, fontFamily:"'JetBrains Mono',monospace", cursor:"pointer",
                    transition:"all .2s cubic-bezier(0.4, 0, 0.2, 1)"
                  }} onMouseEnter={e=>e.currentTarget.style.background=`${T.blue}25`} onMouseLeave={e=>e.currentTarget.style.background=`${T.blue}15`}>CLEAR CACHE</button>
                </div>
              </div>

              <div style={{background:T.surfaceHi, padding:20, borderRadius:12, border:`1px solid ${T.border}`}}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:16}}>
                  <Ic n="settings" s={16} c={T.brand}/>
                  <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:T.text}}>SESSION CACHING</span>
                </div>
                <div>
                  <div style={{fontSize:11, color:T.textDim, marginBottom:12, fontFamily:"'JetBrains Mono',monospace", fontWeight:700}}>CACHE RECENT SESSION ACTIVITY (MAX)</div>
                  <div style={{display:"flex", alignItems:"center", gap:12}}>
                    {[0, 3, 5, 10, 20].map(v => (
                      <PickerBtn key={v} label={v === 0 ? "OFF" : v} isAct={cacheLimit === v} onClick={() => {setCacheLimit(v); triggerSaveFeedback();}} />
                    ))}
                  </div>
                  <div style={{marginTop:8, fontSize:10, color:T.textDim, fontFamily:"'IBM Plex Sans',sans-serif", lineHeight:1.4}}>
                    Store full activity history for up to {cacheLimit} recently viewed sessions in local storage to eliminate loading latency.
                  </div>
                </div>
              </div>

              <div style={{background:"rgba(255,85,102,0.03)", border:`1px dashed ${T.red}30`, borderRadius:12, padding:24, textAlign:"center"}}>
                <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:T.red, fontWeight:800, marginBottom:8, letterSpacing:"0.1em"}}>DANGER ZONE</div>
                <div style={{fontFamily:"'IBM Plex Sans',sans-serif", fontSize:13, color:T.textDim, marginBottom:20, lineHeight:1.6}}>
                  This will perform a full system purge, including API keys and all local session data. Use with caution.
                </div>
                <button onClick={resetApp} style={{
                  width:"100%", maxWidth:240, padding:"12px 20px", borderRadius:8,
                  background:T.red, border:"none",
                  color:"#000", fontFamily:"'JetBrains Mono',monospace", fontSize:12,
                  fontWeight:900, letterSpacing:"0.1em", cursor:"pointer",
                  boxShadow:`0 8px 24px ${T.red}40`, transition:"transform .2s cubic-bezier(0.4, 0, 0.2, 1)"
                }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.02)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>FULL SYSTEM RESET</button>
              </div>
            </div>
          )}

          {tab === "design" && (
            <div style={{animation:"fadeIn .3s cubic-bezier(0.4, 0, 0.2, 1)", display:"flex", flexDirection:"column", gap:32}}>
              {/* Introduction header */}
              <div style={{background:T.surfaceHi, padding:20, borderRadius:12, border:`1px solid ${T.border}`}}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:12}}>
                  <Ic n="layout_toggle" s={18} c={T.brand}/>
                  <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:800, color:T.text, letterSpacing:"0.05em"}}>DESIGN SYSTEM LAB</span>
                </div>
                <p style={{fontFamily:"'IBM Plex Sans',sans-serif", fontSize:13, color:T.textDim, lineHeight:1.6, margin:0}}>
                  Compare our existing highly-decorated visual treatments against modern, simplified alternative aesthetics built directly on Joe's design tokens and premium font stack.
                </p>
              </div>

              {/* Mode Toggle Pills */}
              <div style={{display:"flex", flexDirection:"column", gap:8}}>
                <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.muted, fontWeight:700, letterSpacing:"0.05em"}}>CHOOSE COMPARISON MODE</div>
                <div style={{display:"flex", gap:6, background:T.surfaceHi, padding:4, borderRadius:24, border:`1px solid ${T.border}`, alignSelf:"flex-start"}}>
                  {[
                    { id: "compare", label: "SIDE-BY-SIDE" },
                    { id: "current", label: "CURRENT STYLE" },
                    { id: "simplified", label: "SIMPLIFIED (DOT+TINT)" }
                  ].map(m => {
                    const isAct = comparisonMode === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setComparisonMode(m.id)}
                        aria-pressed={isAct ? "true" : "false"}
                        style={{
                          padding: "6px 14px", borderRadius: 20, border: "none",
                          background: isAct ? T.brand : "transparent",
                          color: isAct ? "#000" : T.muted,
                          fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 800,
                          cursor: "pointer", transition: "all .15s ease", minHeight: 36
                        }}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 1: Session Card Treatments */}
              <div style={{display:"flex", flexDirection:"column", gap:16}}>
                <div style={{borderBottom:`1px solid ${T.border}`, paddingBottom:8, display:"flex", alignItems:"center", gap:6}}>
                  <Ic n="layers" s={14} c={T.brandLight}/>
                  <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:800, color:T.text, letterSpacing:"0.05em"}}>SESSION CARD STATES</span>
                </div>

                <div style={{display:"grid", gridTemplateColumns:(comparisonMode === "compare") ? "1fr 1fr" : "1fr", gap:20}}>
                  {/* Column 1: Current Treatment */}
                  {(comparisonMode === "compare" || comparisonMode === "current") && (
                    <div style={{display:"flex", flexDirection:"column", gap:12}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.muted, fontWeight:800, letterSpacing:"0.05em", background:`${T.brand}15`, padding:"4px 8px", borderRadius:4, alignSelf:"flex-start"}}>
                        CURRENT LEFT-BORDER TREATMENT
                      </div>

                      {/* Mock Session Cards */}
                      {/* IDLE */}
                      <div style={{
                        background: T.surface, border: `1px solid ${T.border}66`,
                        borderLeft: `2px solid ${T.border}`, borderRadius: 6, padding: "10px 14px",
                        fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, color: T.textDim,
                        opacity: 0.9
                      }}>
                        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4}}>
                          <span style={{fontWeight:600}}>Idle Session</span>
                          <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.dim}}>2m ago</span>
                        </div>
                        <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.muted, opacity:0.6}}>2 ITEMS · 14.5 KB</div>
                      </div>

                      {/* UNREAD */}
                      <div style={{
                        background: `${T.indigo}0a`, border: `1px solid ${T.indigo}20`,
                        borderLeft: `2px solid ${T.indigo}`, borderRadius: 6, padding: "10px 14px",
                        fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, color: T.textDim,
                        position: "relative"
                      }}>
                        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4}}>
                          <span style={{fontWeight:600, color:T.textHi}}>Unread Session</span>
                          <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.dim}}>1m ago</span>
                        </div>
                        <div style={{display:"flex", alignItems:"center", gap:6}}>
                          <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.muted, opacity:0.6}}>5 ITEMS · 42.1 KB</div>
                          <div style={{width:4, height:4, borderRadius:"50%", background:T.indigo, animation:"dot 1s infinite"}}/>
                        </div>
                      </div>

                      {/* WORKING */}
                      <div style={{
                        background: `${T.blue}06`, border: `1px solid ${T.blue}20`,
                        borderLeft: `2px solid ${T.blue}`, borderRadius: 6, padding: "10px 14px",
                        fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, color: T.textDim
                      }}>
                        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4}}>
                          <div style={{display:"flex", alignItems:"center", gap:6}}>
                            <div style={{width:10, height:10, borderRadius:"50%", border:`1px solid ${T.brand}`, animation:"spin 3s linear infinite"}}/>
                            <span style={{fontWeight:600}}>Working Session</span>
                          </div>
                          <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.dim}}>just now</span>
                        </div>
                        <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.muted, opacity:0.6}}>12 ITEMS · 108 KB</div>
                      </div>

                      {/* SELECTED */}
                      <div style={{
                        background: `${T.brand}20`, border: `1px solid ${T.brand}30`,
                        borderLeft: `2px solid ${T.brand}`, borderRadius: 6, padding: "10px 14px",
                        fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, color: T.textHi,
                        transform: "translateX(4px) scale(1.005)", transition: "all .2s ease"
                      }}>
                        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4}}>
                          <span style={{fontWeight:700}}>Selected Session</span>
                          <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.brandLight}}>selected</span>
                        </div>
                        <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.textDim, opacity:0.8}}>8 ITEMS · 92 KB</div>
                      </div>
                    </div>
                  )}

                  {/* Column 2: Dot + Tint Treatment */}
                  {(comparisonMode === "compare" || comparisonMode === "simplified") && (
                    <div style={{display:"flex", flexDirection:"column", gap:12}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.brandLight, fontWeight:800, letterSpacing:"0.05em", background:`${T.brandDim}`, padding:"4px 8px", borderRadius:4, alignSelf:"flex-start"}}>
                        DOT + TINT TREATMENT (RECOMMENDED)
                      </div>

                      {/* Mock Session Cards */}
                      {/* IDLE */}
                      <div style={{
                        background: T.surface, border: "1px solid transparent",
                        borderRadius: 6, padding: "10px 14px",
                        fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, color: T.textDim,
                        opacity: 0.9, transition: "all .2s ease"
                      }}>
                        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4}}>
                          <span style={{fontWeight:500}}>Idle Session</span>
                          <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.dim}}>2m ago</span>
                        </div>
                        <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.dim}}>2 ITEMS · 14.5 KB</div>
                      </div>

                      {/* UNREAD */}
                      <div style={{
                        background: "rgba(165,180,252,0.06)", border: `1px solid ${T.indigo}15`,
                        borderRadius: 6, padding: "10px 14px",
                        fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, color: T.textDim,
                        transition: "all .2s ease"
                      }}>
                        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4}}>
                          <div style={{display:"flex", alignItems:"center", gap:6}}>
                            <div style={{width:6, height:6, borderRadius:"50%", background:T.indigo, boxShadow:`0 0 6px ${T.indigo}`}}/>
                            <span style={{fontWeight:600, color:T.textHi}}>Unread Session</span>
                          </div>
                          <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.dim}}>1m ago</span>
                        </div>
                        <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.indigoLight, opacity:0.8}}>5 ITEMS · 42.1 KB</div>
                      </div>

                      {/* WORKING */}
                      <div style={{
                        background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)",
                        borderRadius: 6, padding: "10px 14px",
                        fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, color: T.textDim,
                        transition: "all .2s ease"
                      }}>
                        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4}}>
                          <div style={{display:"flex", alignItems:"center", gap:6}}>
                            <div style={{width:6, height:6, borderRadius:"50%", background:"#34d399", boxShadow:"0 0 6px #34d399"}}/>
                            <span style={{fontWeight:600}}>Working Session</span>
                          </div>
                          <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.dim}}>just now</span>
                        </div>
                        <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#34d399", opacity:0.8}}>12 ITEMS · 108 KB</div>
                      </div>

                      {/* SELECTED */}
                      <div style={{
                        background: "rgba(6,182,212,0.10)", border: `1px solid ${T.brand}25`,
                        borderRadius: 6, padding: "10px 14px",
                        fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, color: T.textHi,
                        transition: "all .2s ease"
                      }}>
                        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4}}>
                          <div style={{display:"flex", alignItems:"center", gap:6}}>
                            <div style={{width:6, height:6, borderRadius:"50%", background:T.brandLight, boxShadow:`0 0 6px ${T.brandLight}`}}/>
                            <span style={{fontWeight:700}}>Selected Session</span>
                          </div>
                          <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.brandLight}}>selected</span>
                        </div>
                        <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.brandLight, opacity:0.9}}>8 ITEMS · 92 KB</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Three Matched Pairs */}
              <div style={{display:"flex", flexDirection:"column", gap:24}}>
                <div style={{borderBottom:`1px solid ${T.border}`, paddingBottom:8, display:"flex", alignItems:"center", gap:6}}>
                  <Ic n="tasks" s={14} c={T.brandLight}/>
                  <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:800, color:T.text, letterSpacing:"0.05em"}}>THREE MATCHED PAIRS COMPARISON</span>
                </div>

                {/* PAIR 1: CHAT MESSAGE */}
                <div style={{display:"flex", flexDirection:"column", gap:12}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.purple, fontWeight:800, letterSpacing:"0.05em"}}>PAIR 1: CHAT MESSAGE TREATMENT</div>
                  <div style={{display:"grid", gridTemplateColumns:(comparisonMode === "compare") ? "1fr 1fr" : "1fr", gap:20}}>
                    {(comparisonMode === "compare" || comparisonMode === "current") && (
                      <div style={{display:"flex", flexDirection:"column", gap:6}}>
                        <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.muted, opacity:0.6}}>CURRENT STYLE (OVER-DECORATED)</div>
                        {/* Current Chat Bubble Mock */}
                        <div style={{border:`1px solid ${T.border}`, background:T.surface, borderRadius:8, padding:12}}>
                          <div style={{fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: T.brand, fontWeight: 800, marginBottom: 12, display: "flex", alignItems: "center", gap: 8}}>
                            <div style={{width: 20, height: 20, borderRadius: 5, background: T.brandDim, border: `1px solid ${T.brand}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: T.brandLight}}>J</div>
                            <span>JULES RESPONSE</span>
                            <div style={{height: 1, flex: 1, background: `${T.brand}20`}}/>
                            <span style={{color: T.textDim, fontSize: 10, fontWeight: 500}}>12:04 PM</span>
                          </div>
                          <div style={{background: T.surfaceHi, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.brand}`, borderRadius: 6, padding: 12, fontSize: 13, color: T.text, lineHeight: 1.5}}>
                            Let me search the codebase to identify where the timeline styles are located.
                          </div>
                        </div>
                      </div>
                    )}

                    {(comparisonMode === "compare" || comparisonMode === "simplified") && (
                      <div style={{display:"flex", flexDirection:"column", gap:6}}>
                        <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.brandLight, opacity:0.8}}>SIMPLIFIED STYLE (CLEAN & MINIMAL)</div>
                        {/* Simplified Chat Bubble Mock */}
                        <div style={{border:"none", background:"transparent", padding:4}}>
                          <div style={{fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: T.brand, fontWeight: 800, marginBottom: 10, display: "flex", alignItems: "center", gap: 8}}>
                            <div style={{width: 20, height: 20, borderRadius: 5, background: T.brandDim, border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: T.brandLight}}>J</div>
                            <span>JULES RESPONSE</span>
                            <div style={{height: 1, flex: 1, background: `${T.brand}12`}}/>
                            <span style={{color: T.textDim, fontSize: 10, fontWeight: 500}}>12:04 PM</span>
                          </div>
                          <div style={{background: "transparent", border: "none", borderLeft: `3px solid ${T.brand}`, borderRadius: 0, padding: "10px 0 10px 16px", fontSize: 14, color: T.text, lineHeight: 1.6}}>
                            Let me search the codebase to identify where the timeline styles are located.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PAIR 2: PROGRESS UPDATE */}
                <div style={{display:"flex", flexDirection:"column", gap:12, marginTop:12}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.purple, fontWeight:800, letterSpacing:"0.05em"}}>PAIR 2: "REVIEW" PROGRESS TREATMENT</div>
                  <div style={{display:"grid", gridTemplateColumns:(comparisonMode === "compare") ? "1fr 1fr" : "1fr", gap:20}}>
                    {(comparisonMode === "compare" || comparisonMode === "current") && (
                      <div style={{display:"flex", flexDirection:"column", gap:6}}>
                        <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.muted, opacity:0.6}}>CURRENT STYLE (6 VISUAL EFFECTS)</div>
                        {/* Current Review Mock */}
                        <div style={{
                          fontSize:13, color:T.text, lineHeight:1.75, padding:"20px 24px",
                          background:`linear-gradient(165deg, ${T.brand}0d, ${T.surface}44)`,
                          border:`1px solid ${T.brand}35`, borderRadius:12,
                          boxShadow:`0 16px 48px ${T.brandDark}15, inset 0 0 20px ${T.brand}05`,
                        }}>
                          <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:12}}>
                            <span style={{padding:"2px 6px", borderRadius:3, background:T.brandDim, color:T.brandLight, fontSize:10, fontWeight:800, letterSpacing:"0.05em"}}>REVIEW</span>
                            <div style={{height:1, flex:1, background:`linear-gradient(90deg, ${T.brandLight}30, transparent)`}}/>
                          </div>
                          Code changes look fantastic. Ready to proceed to pull request creation and run CI checks.
                        </div>
                      </div>
                    )}

                    {(comparisonMode === "compare" || comparisonMode === "simplified") && (
                      <div style={{display:"flex", flexDirection:"column", gap:6}}>
                        <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.brandLight, opacity:0.8}}>SIMPLIFIED STYLE (1 SIGNAL)</div>
                        {/* Simplified Review Mock */}
                        <div style={{
                          fontSize:14, color:T.text, lineHeight:1.6, padding:0,
                          background:"transparent", border:"none", borderRadius:0,
                          boxShadow:"none", fontFamily:"'IBM Plex Sans',sans-serif"
                        }}>
                          Code changes look fantastic. Ready to proceed to pull request creation and run CI checks.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PAIR 3: SESSION COMPLETED PILL */}
                <div style={{display:"flex", flexDirection:"column", gap:12, marginTop:12}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.purple, fontWeight:800, letterSpacing:"0.05em"}}>PAIR 3: "SESSION COMPLETED" PILL</div>
                  <div style={{display:"grid", gridTemplateColumns:(comparisonMode === "compare") ? "1fr 1fr" : "1fr", gap:20}}>
                    {(comparisonMode === "compare" || comparisonMode === "current") && (
                      <div style={{display:"flex", flexDirection:"column", gap:6, alignItems:"flex-start"}}>
                        <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.muted, opacity:0.6}}>CURRENT STYLE (OVER-DECORATED)</div>
                        {/* Current Pill Mock */}
                        <div style={{
                          display:"inline-flex", alignItems:"center", gap:8, padding:"10px 18px",
                          background:`linear-gradient(135deg, ${T.brand}20, ${T.surfaceHi})`,
                          border:`1px solid ${T.brand}50`, borderRadius:10,
                          color:T.brandLight, fontFamily:"'JetBrains Mono',monospace",
                          fontSize:12, fontWeight:900, textTransform: "uppercase",
                          boxShadow:`0 4px 15px ${T.brand}15, inset 0 0 10px ${T.brand}10`,
                        }}>
                          <Ic n="check" s={16} c={T.brandLight}/>
                          SESSION FINISHED
                        </div>
                      </div>
                    )}

                    {(comparisonMode === "compare" || comparisonMode === "simplified") && (
                      <div style={{display:"flex", flexDirection:"column", gap:6, alignItems:"flex-start"}}>
                        <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.brandLight, opacity:0.8}}>SIMPLIFIED STYLE (CLEAN & DIRECT)</div>
                        {/* Simplified Pill Mock */}
                        <div style={{
                          display:"inline-flex", alignItems:"center", gap:6, padding:"4px 10px",
                          background:T.brandDim, border:`1px solid ${T.brand}40`, borderRadius:4,
                          color:T.brandLight, fontFamily:"'JetBrains Mono',monospace",
                          fontSize:11, fontWeight:800, letterSpacing:"0.08em",
                        }}>
                          <Ic n="check" s={13} c={T.brandLight}/>
                          SESSION FINISHED
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{marginTop:60, paddingBottom:60, textAlign:"center"}}>
            <Btn onClick={onBack} outline sm style={{margin:"0 auto", borderColor:T.borderHi, color:T.textDim}}>
              <Ic n="back" s={12} c={T.muted} />
              EXIT SETTINGS
            </Btn>
          </div>

          {hasSaved && (
            <div style={{
              position:"fixed", bottom:isDesktop?40:80, left:"50%", transform:"translateX(-50%)",
              background:T.brand, color:"#000", padding:"8px 16px", borderRadius:20,
              fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:900,
              boxShadow:`0 8px 24px ${T.brand}40`, zIndex:10000, animation:"fadeIn .2s ease"
            }}>
              ✓ SETTINGS SAVED
            </div>
          )}
        </div>
      </div>

      {isAdding && (
        <Modal
          title="ADD CUSTOM PERSONA"
          onClose={() => setIsAdding(false)}
          actions={
            <div style={{display:"flex", gap:10, width:"100%"}}>
              <button onClick={() => setIsAdding(false)} style={{flex:1, padding:10, borderRadius:8, background:T.surface, border:`1px solid ${T.border}`, color:T.text, fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", cursor:"pointer"}}>CANCEL</button>
              <button onClick={() => {
                if (!newName.trim() || !newPrompt.trim()) return alert("Label and Prompt are required!");
                const id = "custom_" + Date.now();
                saveCustomPersona({ id, label: newName.trim(), prompt: newPrompt.trim(), color: newColor });
                setPersonas(loadPersonas());
                setIsAdding(false);
              }} style={{flex:1, padding:10, borderRadius:8, background:T.brand, border:"none", color:T.brandText, fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", cursor:"pointer"}}>SAVE PERSONA</button>
            </div>
          }
        >
          <div style={{display:"flex", flexDirection:"column", gap:14}}>
            <div>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6}}>
                <label htmlFor="new-persona-label" style={{fontSize:10, color:T.textDim, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, cursor:"pointer"}}>PERSONA LABEL</label>
                <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.textDim, opacity:0.8}}>{newName.length}/100</span>
              </div>
              <input id="new-persona-label" type="text" value={newName} onChange={e => setNewName(e.target.value)} maxLength={100} placeholder="e.g. UX Expert" style={{width:"100%", background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:8, padding:10, color:T.text, fontSize:13, fontFamily:"'JetBrains Mono',monospace", boxSizing:"border-box"}} />
            </div>
            <div>
              <div style={{fontSize:10, color:T.textDim, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, marginBottom:6}}>THEME COLOR</div>
              <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
                {PRESET_COLORS.map(c => {
                  const colorName = COLOR_NAMES[c] || c;
                  const isSelected = newColor === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      title={`Select theme color ${colorName}${isSelected ? " (Selected)" : ""}`}
                      aria-label={`Select theme color ${colorName}${isSelected ? " (Selected)" : ""}`}
                      aria-pressed={isSelected ? "true" : "false"}
                      style={{
                        width:24, height:24, borderRadius:"50%", background:c,
                        border:isSelected ? `2px solid ${T.text}` : "2px solid transparent",
                        cursor:"pointer", transition:"all .15s cubic-bezier(0.4, 0, 0.2, 1)",
                        padding:0, flexShrink:0
                      }}
                    />
                  );
                })}
              </div>
            </div>
            <div>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6}}>
                <label htmlFor="new-persona-prompt" style={{fontSize:10, color:T.textDim, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, cursor:"pointer"}}>SYSTEM PROMPT</label>
                <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.textDim, opacity:0.8}}>{fmtChars(newPrompt.length)}/5kc</span>
              </div>
              <textarea id="new-persona-prompt" value={newPrompt} onChange={e => setNewPrompt(e.target.value)} maxLength={5000} placeholder="Define the role behavior..." style={{width:"100%", height:120, background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:8, padding:10, color:T.text, fontSize:13, fontFamily:"'IBM Plex Sans',sans-serif", resize:"none", boxSizing:"border-box"}} />
            </div>
          </div>
        </Modal>
      )}

      {editingPersona && (
        <Modal
          title={`EDIT PERSONA: ${editingPersona.label.toUpperCase()}`}
          onClose={() => setEditingPersona(null)}
          actions={
            <div style={{display:"flex", gap:10, width:"100%", flexDirection:"column"}}>
              <div style={{display:"flex", gap:10, width:"100%"}}>
                <button onClick={() => setEditingPersona(null)} style={{flex:1, padding:10, borderRadius:8, background:T.surface, border:`1px solid ${T.border}`, color:T.text, fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", cursor:"pointer"}}>CANCEL</button>
                <button onClick={() => {
                  if (!newName.trim() || !newPrompt.trim()) return alert("Label and Prompt are required!");
                  if (editingPersona.isCustom) {
                    saveCustomPersona({ id: editingPersona.id, label: newName.trim(), prompt: newPrompt.trim(), color: newColor });
                  } else {
                    savePersonaPrompt(editingPersona.id, newPrompt.trim());
                  }
                  setPersonas(loadPersonas());
                  setEditingPersona(null);
                }} style={{flex:1, padding:10, borderRadius:8, background:T.brand, border:"none", color:T.brandText, fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", cursor:"pointer"}}>SAVE CHANGES</button>
              </div>
              {editingPersona.isCustom && (
                <button onClick={() => {
                  if (confirm("Delete this custom persona?")) {
                    deleteCustomPersona(editingPersona.id);
                    setPersonas(loadPersonas());
                    setEditingPersona(null);
                  }
                }} style={{width:"100%", padding:10, borderRadius:8, background:`${T.red}15`, border:`1px solid ${T.red}30`, color:T.red, fontSize:11, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", cursor:"pointer"}}>DELETE PERSONA</button>
              )}
            </div>
          }
        >
          <div style={{display:"flex", flexDirection:"column", gap:14}}>
            <div>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6}}>
                <label htmlFor="edit-persona-label" style={{fontSize:10, color:T.textDim, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, cursor: editingPersona.isCustom ? "pointer" : "not-allowed"}}>PERSONA LABEL</label>
                {editingPersona.isCustom && <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.textDim, opacity:0.8}}>{newName.length}/100</span>}
              </div>
              <input id="edit-persona-label" type="text" value={newName} onChange={e => setNewName(e.target.value)} maxLength={100} disabled={!editingPersona.isCustom} placeholder="e.g. UX Expert" style={{width:"100%", background:editingPersona.isCustom ? T.surfaceHi : `${T.surface}88`, border:`1px solid ${T.border}`, borderRadius:8, padding:10, color:editingPersona.isCustom ? T.text : T.textDim, fontSize:13, fontFamily:"'JetBrains Mono',monospace", boxSizing:"border-box", cursor: editingPersona.isCustom ? "text" : "not-allowed"}} />
            </div>
            {editingPersona.isCustom && (
              <div>
                <div style={{fontSize:10, color:T.textDim, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, marginBottom:6}}>THEME COLOR</div>
                <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
                  {PRESET_COLORS.map(c => {
                    const colorName = COLOR_NAMES[c] || c;
                    const isSelected = newColor === c;
                    return (
                      <button
                        key={c}
                        onClick={() => setNewColor(c)}
                        title={`Select theme color ${colorName}${isSelected ? " (Selected)" : ""}`}
                        aria-label={`Select theme color ${colorName}${isSelected ? " (Selected)" : ""}`}
                        aria-pressed={isSelected ? "true" : "false"}
                        style={{
                          width:24, height:24, borderRadius:"50%", background:c,
                          border:isSelected ? `2px solid ${T.text}` : "2px solid transparent",
                          cursor:"pointer", transition:"all .15s cubic-bezier(0.4, 0, 0.2, 1)",
                          padding:0, flexShrink:0
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6}}>
                <label htmlFor="edit-persona-prompt" style={{fontSize:10, color:T.textDim, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, cursor:"pointer"}}>SYSTEM PROMPT</label>
                <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.textDim, opacity:0.8}}>{fmtChars(newPrompt.length)}/5kc</span>
              </div>
              <textarea id="edit-persona-prompt" value={newPrompt} onChange={e => setNewPrompt(e.target.value)} maxLength={5000} placeholder="Define the role behavior..." style={{width:"100%", height:120, background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:8, padding:10, color:T.text, fontSize:13, fontFamily:"'IBM Plex Sans',sans-serif", resize:"none", boxSizing:"border-box"}} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};


// ─── Session List ─────────────────────────────────────────────────────────────
