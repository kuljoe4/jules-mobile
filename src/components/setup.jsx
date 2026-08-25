const SetupScreen = ({ onSave }) => {
  const [key,setKey]       = useState("");
  const [testing,setTesting] = useState(false);
  const [err,setErr]       = useState(null);
  const [showKey,setShowKey] = useState(false);

  const doConnect = async () => {
    const trimmedKey = key.trim();
    if (!trimmedKey) return;

    if (!isValidGoogleApiKey(trimmedKey)) {
      setErr("Invalid API key.");
      return;
    }

    setTesting(true); setErr(null);
    try {
      await apiCall(trimmedKey, "/sources?pageSize=1", { _label:"Test auth" });
      onSave(trimmedKey);
    } catch (err) { setErr(err.message); }
    finally { setTesting(false); }
  };

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px"}}>
      <div style={{width:"100%",maxWidth:380}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{
            width:54,height:54,borderRadius:13,background:T.brand,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontFamily:"'JetBrains Mono',monospace",fontSize:30,fontWeight:900,color:"#000",
            margin:"0 auto 16px",boxShadow:`0 8px 32px ${T.brand}20`,
          }}>J</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,fontWeight:700,color:T.text,marginBottom:6}}>JULES AGENT CLIENT</div>
          <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:15,color:T.textDim,lineHeight:1.6}}>
            Enter your Jules API key from<br/>
            <a href="https://jules.google.com" target="_blank" rel="noopener noreferrer" style={{color:T.brandLight,fontFamily:"'JetBrains Mono',monospace",fontSize:13,textDecoration:"none",borderBottom:`1px solid ${T.brandDark}40`}}>jules.google.com → Settings → API</a>
          </div>
        </div>
        <div style={{marginBottom:10}}>
          <label htmlFor="jules_api_key" style={{display:"block",marginBottom:8,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.textDim,fontWeight:700,letterSpacing:"0.12em",cursor:"pointer"}}>API KEY *</label>
          <div style={{position:"relative"}}>
            <input
              id="jules_api_key"
              type={showKey ? "text" : "password"} value={key}
              onChange={e=>setKey(e.target.value)}
              placeholder="AIza..."
              aria-label="Jules API Key"
              maxLength={200}
              aria-invalid={err ? "true" : "false"}
              aria-describedby={err ? "setup-error" : undefined}
              style={{
                ...inputSt,
                fontSize:16,
                fontFamily:"'JetBrains Mono',monospace",
                paddingRight:42,
                borderColor: err ? T.red : T.border
              }}
              onKeyDown={e=>e.key==="Enter"&&doConnect()}
              autoFocus
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
        </div>
        {err&&<div id="setup-error" role="alert" style={{padding:"8px 12px",borderRadius:5,marginBottom:10,background:T.redDim,border:`1px solid ${T.red}40`,fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:T.red}}>{err}</div>}
        <div style={{display:"flex", gap:10, marginBottom:16}}>
          {(() => {
            const connectTitle = !key.trim() ? "Please enter your API key first" : (testing ? "Connecting to server..." : "Connect using API key");
            return (
              <Btn onClick={doConnect} disabled={!key.trim()||testing} title={connectTitle} aria-label={connectTitle} style={{flex:1}}>
                <Ic n="key" s={12} c="#000"/>
                {testing?"CONNECTING…":"CONNECT"}
              </Btn>
            );
          })()}
        </div>

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:8}}>
          <button onClick={clearDataOnly} style={{
            background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:6,
            padding:"10px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6,
          }}>
            <Ic n="database" s={16} c={T.purple}/>
            <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.textDim, fontWeight:700}}>CLEAR DATA</span>
          </button>
          <button onClick={clearCacheOnly} style={{
            background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:6,
            padding:"10px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6,
          }}>
            <Ic n="layers" s={16} c={T.blue}/>
            <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.textDim, fontWeight:700}}>CLEAR CACHE</span>
          </button>
        </div>

        <button onClick={resetApp} style={{
          width:"100%", background:"none", border:`1px solid ${T.red}30`, borderRadius:6,
          padding:"8px", cursor:"pointer", color:T.red, fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700,
        }}>FULL SYSTEM RESET</button>
          <div style={{marginTop:16,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.textDim,textAlign:"center",lineHeight:1.7}}>
          Key stored locally for persistence<br/>
          Install Jules GitHub app first via web UI
        </div>
      </div>
    </div>
  );
};

// ─── Session Card ─────────────────────────────────────────────────────────────
