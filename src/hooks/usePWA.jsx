function usePWA() {
  const [canInstall, setCanInstall] = useState(() => !!window.__pwa?.installPrompt);
  const [installed,  setInstalled]  = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const onReady   = () => setCanInstall(true);
    const onInstall = () => { setInstalled(true); setCanInstall(false); };
    window.addEventListener("pwa-installable", onReady);
    window.addEventListener("pwa-installed",   onInstall);
    return () => { window.removeEventListener("pwa-installable",onReady); window.removeEventListener("pwa-installed",onInstall); };
  }, []);

  const install = useCallback(async () => {
    const prompt = window.__pwa?.installPrompt;
    if (!prompt) return;
    setInstalling(true);
    try {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") { window.__pwa.installPrompt = null; setCanInstall(false); }
    } finally { setInstalling(false); }
  }, []);

  return { canInstall, installed, installing, install, isFile: window.__pwa?.isFileProtocol };
}

// ─── PWA Banner ───────────────────────────────────────────────────────────────
const PWABanner = () => {
  const { canInstall, installed, installing, install, isFile } = usePWA();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem("pwa_dismissed")==="1");

  if (dismissed || installed) return null;

  // file:// — show how-to-serve instructions
  if (isFile) return (
    <div style={{
      background:"#0d1118", borderBottom:`1px solid #ffb40040`,
      padding:"10px 16px", display:"flex", gap:10, alignItems:"flex-start",
    }}>
      <span style={{fontSize:18,flexShrink:0}}>⚠️</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:"#ffb400",marginBottom:4}}>
          OPENED FROM FILE:// — PWA INSTALL UNAVAILABLE
        </div>
        <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:14,color:"#4a5e76",lineHeight:1.6}}>
          Chrome requires HTTP/HTTPS to install PWAs. Serve this file locally:
        </div>
        <div style={{marginTop:6,background:"#040507",border:"1px solid #182030",borderRadius:5,padding:"6px 10px",fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:"#00eaff",lineHeight:1.8}}>
          # Python (any machine)<br/>
          python3 -m http.server 8080<br/><br/>
          # Node / npx<br/>
          npx serve . -p 8080<br/><br/>
          # Termux<br/>
          pkg install python &amp;&amp; python3 -m http.server 8080
        </div>
        <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:14,color:"#4a5e76",marginTop:5}}>
          Then open <span style={{fontFamily:"'JetBrains Mono',monospace",color:"#4da6ff"}}>http://localhost:8080/{location.pathname.split("/").pop()}</span> in Chrome.
        </div>
      </div>
      <button onClick={()=>{sessionStorage.setItem("pwa_dismissed","1");setDismissed(true);}} title="Dismiss banner" aria-label="Dismiss banner" style={{background:"none",border:"none",cursor:"pointer",color:"#4a5e76",fontSize:18,flexShrink:0,padding:0,lineHeight:1}}>×</button>
    </div>
  );

  // HTTP origin + beforeinstallprompt fired — show install button
  if (canInstall) return (
    <div style={{
      background:"rgba(0,232,122,.07)", borderBottom:`1px solid rgba(0,232,122,.2)`,
      padding:"8px 16px", display:"flex", alignItems:"center", gap:10,
    }}>
      <span style={{fontSize:16,flexShrink:0}}>📲</span>
      <div style={{flex:1,fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"#00eaff"}}>
        Install Jules as an app for offline access
      </div>
      <button onClick={install} disabled={installing} style={{
        padding:"5px 13px",borderRadius:5,border:"none",cursor:"pointer",
        background:"#00eaff",color:"#000",fontFamily:"'JetBrains Mono',monospace",
        fontSize:12,fontWeight:700,letterSpacing:"0.07em",flexShrink:0,
      }}>{installing?"…":"INSTALL"}</button>
      <button onClick={()=>{sessionStorage.setItem("pwa_dismissed","1");setDismissed(true);}} title="Dismiss banner" aria-label="Dismiss banner" style={{background:"none",border:"none",cursor:"pointer",color:"#4a5e76",fontSize:18,padding:0,lineHeight:1,flexShrink:0}}>×</button>
    </div>
  );

  return null;
};

// ─── Responsive hook ──────────────────────────────────────────────────────────
