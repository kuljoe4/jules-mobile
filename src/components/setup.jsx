const generateDemoSessions = () => {
  const now = Date.now();
  const sessions = [
    {
      id: "demo-sess-1",
      title: "Refactor Authentication Middleware to Support OAuth PKCE",
      prompt: "Refactor auth middleware in src/services/auth.js to handle PKCE challenge verification and secure session tokens with HTTP-only cookies.",
      state: "AWAITING_PLAN_APPROVAL",
      createTime: new Date(now - 45 * 60 * 1000).toISOString(),
      updateTime: new Date(now - 12 * 60 * 1000).toISOString(),
      sourceContext: {
        source: "sources/github/google/jules-agent-hub",
        githubRepoContext: { owner: "google", repo: "jules-agent-hub", defaultBranch: "main" }
      }
    },
    {
      id: "demo-sess-2",
      title: "Optimize WebSocket Reconnection Backoff and Buffer Drains",
      prompt: "Implement exponential backoff with full jitter for websocket reconnects and drain pending messages on reconnect.",
      state: "IN_PROGRESS",
      createTime: new Date(now - 90 * 60 * 1000).toISOString(),
      updateTime: new Date(now - 4 * 60 * 1000).toISOString(),
      sourceContext: {
        source: "sources/github/google/jules-agent-hub",
        githubRepoContext: { owner: "google", repo: "jules-agent-hub", defaultBranch: "main" }
      }
    },
    {
      id: "demo-sess-3",
      title: "Add Dark Mode Theme Tokens and System Preference Listener",
      prompt: "Support dark mode theme tokens with auto system preference detection.",
      state: "COMPLETED",
      createTime: new Date(now - 180 * 60 * 1000).toISOString(),
      updateTime: new Date(now - 35 * 60 * 1000).toISOString(),
      sourceContext: {
        source: "sources/github/google/jules-agent-hub",
        githubRepoContext: { owner: "google", repo: "jules-agent-hub", defaultBranch: "main" }
      },
      outputs: [
        { githubPullRequest: "https://github.com/google/jules-agent-hub/pull/42" }
      ]
    },
    {
      id: "demo-sess-4",
      title: "Add Multi-Role Access Control and Audit Logging",
      prompt: "Implement RBAC middleware with permission checking and security event logging.",
      state: "PLANNING",
      createTime: new Date(now - 240 * 60 * 1000).toISOString(),
      updateTime: new Date(now - 110 * 60 * 1000).toISOString(),
      sourceContext: {
        source: "sources/github/acme/enterprise-core",
        githubRepoContext: { owner: "acme", repo: "enterprise-core", defaultBranch: "main" }
      }
    }
  ];

  const activitiesMap = {
    "demo-sess-1": [
      {
        id: "act-1-1",
        createTime: new Date(now - 40 * 60 * 1000).toISOString(),
        originator: "AGENT",
        description: "Analyzing repository architecture and authentication flows..."
      },
      {
        id: "act-1-2",
        createTime: new Date(now - 25 * 60 * 1000).toISOString(),
        originator: "AGENT",
        planGenerated: {
          plan: {
            steps: [
              { id: "step-1", title: "[Parallel] Audit token storage and cookie flags", description: "Review existing JWT token handling and verify SameSite/Secure cookie attributes." },
              { id: "step-2", title: "Implement PKCE challenge verification helper", description: "Add SHA-256 code challenge generation and verify code_verifier parameters against OAuth spec." },
              { id: "step-3", title: "Update authentication middleware handler", description: "Inject verified session claims into express request context." },
              { id: "step-4", title: "[Sequential:3] Add integration tests for PKCE flow", description: "Write automated tests validating successful authorization and replay prevention." }
            ]
          }
        }
      },
      {
        id: "act-1-3",
        createTime: new Date(now - 12 * 60 * 1000).toISOString(),
        originator: "AGENT",
        artifacts: [
          {
            changeSet: {
              gitPatch: {
                unidiffPatch: `--- a/src/services/auth.js\n+++ b/src/services/auth.js\n@@ -18,6 +18,18 @@\n export function verifyAuth(req, res, next) {\n-  const token = req.cookies.jwt;\n-  if (!token) return res.status(401).json({ error: "Unauthorized" });\n+  const authHeader = req.headers.authorization;\n+  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.cookies.session_jwt;\n+  if (!token) {\n+    return res.status(401).json({ error: "Authentication token missing or invalid." });\n+  }\n+  try {\n+    const payload = decodeVerifiedToken(token);\n+    req.user = payload;\n+    next();\n+  } catch (err) {\n+    return res.status(403).json({ error: "Session expired or signature mismatch." });\n+  }\n }`
              }
            }
          }
        ]
      }
    ],
    "demo-sess-2": [
      {
        id: "act-2-1",
        createTime: new Date(now - 80 * 60 * 1000).toISOString(),
        originator: "AGENT",
        description: "Connecting to websocket broker and establishing heartbeat baseline."
      },
      {
        id: "act-2-2",
        createTime: new Date(now - 30 * 60 * 1000).toISOString(),
        originator: "AGENT",
        description: "Running diagnostic tests: npm test -- --grep 'websocket'"
      },
      {
        id: "act-2-3",
        createTime: new Date(now - 4 * 60 * 1000).toISOString(),
        originator: "AGENT",
        description: "Implementing jittered exponential backoff algorithm in src/services/network.js"
      }
    ],
    "demo-sess-3": [
      {
        id: "act-3-1",
        createTime: new Date(now - 150 * 60 * 1000).toISOString(),
        originator: "AGENT",
        description: "Defined theme tokens for light, dark, and high-contrast modes."
      },
      {
        id: "act-3-2",
        createTime: new Date(now - 40 * 60 * 1000).toISOString(),
        originator: "AGENT",
        description: "Created pull request on GitHub: https://github.com/google/jules-agent-hub/pull/42"
      }
    ],
    "demo-sess-4": [
      {
        id: "act-4-1",
        createTime: new Date(now - 200 * 60 * 1000).toISOString(),
        originator: "AGENT",
        description: "Reading role definitions from configuration schema and drafting plan..."
      }
    ]
  };

  return { sessions, activitiesMap };
};

const SetupScreen = ({ onSave }) => {
  const [key,setKey]           = useState("");
  const [testing,setTesting]   = useState(false);
  const [err,setErr]           = useState(null);
  const [showKey,setShowKey]   = useState(false);
  const [showGuide,setShowGuide] = useState(false);

  const doConnect = async () => {
    const trimmedKey = key.trim();
    if (!trimmedKey) return;

    if (!isValidGoogleApiKey(trimmedKey)) {
      setErr("Invalid API key format. Ensure there are no spaces or special control characters.");
      return;
    }

    setTesting(true); setErr(null);
    try {
      await apiCall(trimmedKey, "/sources?pageSize=1", { _label:"Test auth" });
      onSave(trimmedKey);
    } catch (err) { setErr(err.message); }
    finally { setTesting(false); }
  };

  const startDemoMode = () => {
    const demoKey = "AIzaSyDemoKey_JulesAgentWorkspace_Preview";
    const { sessions, activitiesMap } = generateDemoSessions();
    SafeStorage.saveSessionsList(sessions);
    SafeStorage.saveActivitiesMap(activitiesMap);
    const reg = {};
    sessions.forEach(s => { reg[s.id] = parseDateMs(s.createTime); });
    SafeStorage.saveSessionRegistry(reg);
    SafeStorage.saveApiKey(demoKey);
    onSave(demoKey);
  };

  return (
    <div style={{
      flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:"40px 24px", minHeight:"100vh", boxSizing:"border-box",
      background:`radial-gradient(ellipse 650px 320px at 50% 12%, rgba(6,182,212,0.1), transparent 70%), ${T.bg}`
    }}>
      <div style={{width:"100%",maxWidth:440}}>
        {/* Brand Emblem & Header */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{
            width:64,height:64,borderRadius:16,
            background:"linear-gradient(135deg, #22d3ee, #0891b2)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontFamily:"'JetBrains Mono',monospace",fontSize:34,fontWeight:900,color:"#090d14",
            margin:"0 auto 18px",boxShadow:`0 10px 32px rgba(6,182,212,0.35)`,
            transition:"transform .2s ease"
          }}>J</div>
          <h1 style={{
            fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:22,fontWeight:800,
            color:T.textHi,letterSpacing:"-0.03em",margin:"0 0 6px"
          }}>
            Jules Agent Client
          </h1>
          <p style={{
            fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13.5,color:T.textDim,
            lineHeight:1.55,margin:0,maxWidth:380,marginLeft:"auto",marginRight:"auto"
          }}>
            Autonomous coding agent workspace companion for monitoring tasks, reviewing execution plans, and inspecting unified patches.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div style={{
          display:"flex",flexDirection:"column",gap:8,marginBottom:24,
          padding:"14px 16px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:10
        }}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:20,height:20,borderRadius:5,background:T.brandDim,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Ic n="tasks" s={12} c={T.brand}/>
            </div>
            <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12.5,color:T.text,fontWeight:600}}>Real-time task monitoring & live terminal activity</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:20,height:20,borderRadius:5,background:T.purpleDim,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Ic n="plan" s={12} c={T.purple}/>
            </div>
            <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12.5,color:T.text,fontWeight:600}}>Interactive plan approvals & unified patch review</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:20,height:20,borderRadius:5,background:T.blueDim,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Ic n="git_pull" s={12} c={T.blue}/>
            </div>
            <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12.5,color:T.text,fontWeight:600}}>Multi-repo GitHub PR sync & quota management</span>
          </div>
        </div>

        {/* Instant Exploration CTA */}
        <div style={{
          background:`linear-gradient(135deg, rgba(6,182,212,0.12), rgba(99,102,241,0.08))`,
          border:`1px solid ${T.brand}40`,borderRadius:10,padding:"14px 16px",
          marginBottom:22,display:"flex",flexDirection:"column",gap:10
        }}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,color:T.textHi}}>
                Explore Workspace
              </div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11.5,color:T.textDim}}>
                Test all client features with interactive demo sessions
              </div>
            </div>
            <Btn sm color={T.brand} onClick={startDemoMode} title="Load interactive demo workspace" aria-label="Load interactive demo workspace">
              <span>EXPLORE DEMO</span>
              <Ic n="chevron_right" s={12} c="#090d14"/>
            </Btn>
          </div>
        </div>

        {/* Live API Key Form */}
        <div style={{
          background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,
          padding:"18px 18px 16px",marginBottom:16
        }}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <label htmlFor="jules_api_key" style={{
              fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.textDim,
              fontWeight:700,letterSpacing:"0.06em",cursor:"pointer"
            }}>
              GOOGLE JULES API KEY *
            </label>
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              style={{
                background:"none",border:"none",color:T.brandLight,cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,fontWeight:700,
                display:"flex",alignItems:"center",gap:4,padding:0
              }}
            >
              <span>{showGuide ? "HIDE GUIDE" : "GET A KEY"}</span>
              <Ic n={showGuide ? "chevron_up" : "chevron_down"} s={11} c={T.brandLight}/>
            </button>
          </div>

          {showGuide && (
            <div style={{
              background:T.surfaceHi,border:`1px solid ${T.borderHi}`,borderRadius:8,
              padding:"12px 14px",marginBottom:14,fontSize:12,color:T.textDim,lineHeight:1.6,
              fontFamily:"'Plus Jakarta Sans',sans-serif"
            }}>
              <div style={{fontWeight:700,color:T.textHi,marginBottom:6}}>How to get your API Key:</div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                <span>1. Sign in to your account at <a href="https://jules.google.com" target="_blank" rel="noopener noreferrer" style={{color:T.brandLight,textDecoration:"underline"}}>jules.google.com</a></span>
                <span>2. Open <strong>Settings</strong> → <strong>API & Access</strong></span>
                <span>3. Generate an API Key and paste it below</span>
              </div>
            </div>
          )}

          <div style={{position:"relative",marginBottom:12}}>
            <input
              id="jules_api_key"
              type={showKey ? "text" : "password"} value={key}
              onChange={e=>setKey(e.target.value)}
              placeholder="Paste AIza... or API key"
              aria-label="Jules API Key"
              maxLength={200}
              aria-invalid={err ? "true" : "false"}
              aria-describedby={err ? "setup-error" : undefined}
              style={{
                ...inputSt,
                fontSize:14,
                fontFamily:"'JetBrains Mono',monospace",
                paddingRight:42,
                borderColor: err ? T.red : T.border
              }}
              onKeyDown={e=>e.key==="Enter"&&doConnect()}
            />
            {key && (
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? "Hide API Key" : "Show API Key"}
                aria-label={showKey ? "Hide API Key" : "Show API Key"}
                style={{
                  position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", cursor:"pointer", padding:4, display:"flex", alignItems:"center"
                }}
              >
                <Ic n={showKey ? "eye_closed" : "eye"} s={16} c={T.muted}/>
              </button>
            )}
          </div>

          {err && (
            <div id="setup-error" role="alert" style={{
              padding:"8px 12px",borderRadius:6,marginBottom:12,
              background:T.redDim,border:`1px solid ${T.red}40`,
              fontFamily:"'JetBrains Mono',monospace",fontSize:11.5,color:T.red
            }}>
              {err}
            </div>
          )}

          <Btn
            onClick={doConnect}
            disabled={!key.trim()||testing}
            title={!key.trim() ? "Please enter your API key first" : (testing ? "Connecting to server..." : "Connect using API key")}
            aria-label={!key.trim() ? "Please enter your API key first" : (testing ? "Connecting to server..." : "Connect using API key")}
            style={{width:"100%"}}
          >
            <Ic n="key" s={14} c="#090d14"/>
            <span>{testing ? "VERIFYING CREDENTIALS…" : "CONNECT WORKSPACE"}</span>
          </Btn>

          {testing && (
            <div style={{ marginTop: 12, animation: "fadeIn .2s ease" }}>
              <JulesThinkingIndicator
                inline
                label="Jules is thinking..."
                subtext="Validating key against Gemini server…"
              />
            </div>
          )}
        </div>

        {/* Maintenance / Data Controls */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10}}>
          <button
            onClick={clearDataOnly}
            title="Clear stored application data (drafts, personas, repo stats)"
            aria-label="Clear application data"
            style={{
              background:T.surface, border:`1px solid ${T.border}`, borderRadius:6,
              padding:"8px 10px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              transition:"all .15s ease", minHeight:36
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.surfaceHi}
            onMouseLeave={e => e.currentTarget.style.background = T.surface}
          >
            <Ic n="database" s={13} c={T.purple}/>
            <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.textDim, fontWeight:700}}>CLEAR DATA</span>
          </button>
          <button
            onClick={clearCacheOnly}
            title="Clear cached GitHub pull requests and session metadata"
            aria-label="Clear cache data"
            style={{
              background:T.surface, border:`1px solid ${T.border}`, borderRadius:6,
              padding:"8px 10px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              transition:"all .15s ease", minHeight:36
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.surfaceHi}
            onMouseLeave={e => e.currentTarget.style.background = T.surface}
          >
            <Ic n="layers" s={13} c={T.blue}/>
            <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.textDim, fontWeight:700}}>CLEAR CACHE</span>
          </button>
        </div>

        <button
          onClick={resetApp}
          title="Reset all settings, keys, and local data back to initial defaults"
          aria-label="Full system reset"
          style={{
            width:"100%", background:"none", border:`1px solid ${T.red}25`, borderRadius:6,
            padding:"8px", cursor:"pointer", color:T.red, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700,
            transition:"all .15s ease", minHeight:34
          }}
          onMouseEnter={e => e.currentTarget.style.background = `${T.red}12`}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          FULL SYSTEM RESET
        </button>
      </div>
    </div>
  );
};

// ─── Session Card ─────────────────────────────────────────────────────────────
