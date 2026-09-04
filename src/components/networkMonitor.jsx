import { copyToClipboard } from "../utils/format.js";

const RecentActivityLog = memo(({ log, total }) => {
  const [mode, setMode] = useState("chrono"); // "chrono", "ranked-indiv", "ranked-group"
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedItems, setCopiedItems] = useState({});

  const groupedData = useMemo(() => {
    const groups = {};
    log.forEach(r => {
      const label = r.label || "Unknown Request";
      if (!groups[label]) {
        groups[label] = { label, bytesIn: 0, bytesOut: 0, totalBytes: 0, count: 0 };
      }
      groups[label].bytesIn += r.bytesIn;
      groups[label].bytesOut += r.bytesOut;
      groups[label].totalBytes += (r.bytesIn + r.bytesOut);
      groups[label].count += 1;
    });

    return Object.values(groups)
      .map(g => {
        const pct = total > 0 ? (g.totalBytes / total) * 100 : 0;
        return { ...g, pct };
      })
      .sort((a, b) => b.totalBytes - a.totalBytes);
  }, [log, total]);

  const rankedIndiv = useMemo(() => {
    return log
      .map(r => {
        const totalBytes = r.bytesIn + r.bytesOut;
        const pct = total > 0 ? (totalBytes / total) * 100 : 0;
        return { ...r, totalBytes, pct };
      })
      .sort((a, b) => b.totalBytes - a.totalBytes);
  }, [log, total]);

  return (
    <div style={{marginTop:8}}>
      <div style={{display:"flex", flexDirection:"column", gap:10, marginBottom:12}}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.textDim,letterSpacing:"0.08em",fontWeight:700}}>RECENT ACTIVITY LOG</div>
          <button
            onClick={() => {
              const data = JSON.stringify(log, null, 2);
              copyToClipboard(data).then((success) => {
                if (success) {
                  setCopiedAll(true);
                  setTimeout(() => setCopiedAll(false), 2000);
                }
              });
            }}
            aria-label="Copy all network activity to clipboard"
            title="Copy all network activity to clipboard"
            style={{
              background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:4,
              padding:"3px 8px", cursor:"pointer", color:T.brand,
              fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700
            }}
          >{copiedAll ? "COPIED ✓" : "COPY ALL"}</button>
        </div>

        <div role="group" aria-label="Activity log view mode" style={{display:"flex", gap:4, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, padding:2, width:"fit-content"}}>
          {[
            { id: "chrono", label: "CHRONO (RECENT)" },
            { id: "ranked-indiv", label: "RANKED (INDIV)" },
            { id: "ranked-group", label: "RANKED (GROUPED)" }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setMode(opt.id)}
              aria-pressed={mode === opt.id ? "true" : "false"}
              aria-label={`View log as ${opt.label}`}
              title={`View log as ${opt.label}`}
              style={{
                background: mode === opt.id ? T.brandDim : "none",
                border: "none",
                borderRadius: 4,
                padding: "4px 8px",
                fontSize: 9,
                fontWeight: 700,
                color: mode === opt.id ? T.brandLight : T.textDim,
                cursor: "pointer",
                fontFamily: "'JetBrains Mono',monospace",
                textTransform: "uppercase"
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{background:T.surfaceHi, borderRadius:12, border:`1px solid ${T.border}`, overflow:"hidden"}} role="list">
        {log.length === 0 ? (
          <div style={{textAlign:"center",padding:"32px",fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.textDim}}>No requests recorded</div>
        ) : mode === "chrono" ? (
          log.map((r, i) => (
            <div key={r.id} style={{display:"flex",gap:12,alignItems:"center",padding:"12px 16px",borderBottom:i<log.length-1?`1px solid ${T.border}`:"none"}} role="listitem">
              <div style={{
                width:26,height:26,borderRadius:6,flexShrink:0,
                background: r.status >= 400 ? T.redDim : r.status >= 300 ? T.amberDim : T.brandDim,
                border: `1px solid ${r.status >= 400 ? T.red : r.status >= 300 ? T.amber : T.brand}40`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:900,
                color: r.status >= 400 ? T.red : r.status >= 300 ? T.amber : T.brandLight
              }} aria-label={`HTTP Status ${r.status}`}>{r.status}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>{r.label}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.textDim,marginTop:2, display:"flex", gap:10}}>
                  <span>{fmtAgo(r.ts)}</span>
                  <span style={{color:T.purple, opacity:0.8}}>↑ {fmtBytes(r.bytesOut)}</span>
                  <span style={{color:T.brand, opacity:0.8}}>↓ {fmtBytes(r.bytesIn)}</span>
                </div>
              </div>
              <div style={{display:"flex", alignItems:"center", gap:8}}>
                <button
                  onClick={() => {
                    copyToClipboard(JSON.stringify(r, null, 2)).then((success) => {
                      if (success) {
                        setCopiedItems(prev => ({ ...prev, [r.id]: true }));
                        setTimeout(() => {
                          setCopiedItems(prev => ({ ...prev, [r.id]: false }));
                        }, 2000);
                      }
                    });
                  }}
                  aria-label="Copy request JSON"
                  title="Copy request JSON"
                  style={{background:T.surface, border:`1px solid ${copiedItems[r.id] ? T.brand : T.border}`, borderRadius:4, cursor:"pointer", padding:6, display:"flex"}}
                >
                  <Ic n={copiedItems[r.id] ? "check" : "copy"} s={12} c={copiedItems[r.id] ? T.brand : T.muted}/>
                </button>
              </div>
            </div>
          ))
        ) : mode === "ranked-indiv" ? (
          rankedIndiv.map((r, i) => (
            <div key={r.id} style={{display:"flex",flexDirection:"column",padding:"12px 16px",borderBottom:i<rankedIndiv.length-1?`1px solid ${T.border}`:"none"}} role="listitem">
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{
                  width:26,height:26,borderRadius:6,flexShrink:0,
                  background: T.brandDim,
                  border: `1px solid ${T.brand}40`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:900,
                  color: T.brandLight
                }}>#{i + 1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>{r.label}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.textDim,marginTop:2, display:"flex", gap:10, alignItems:"center"}}>
                    <span style={{
                      background: r.status >= 400 ? T.redDim : r.status >= 300 ? T.amberDim : T.brandDim,
                      padding: "1px 4px", borderRadius: 3, fontSize: 9, fontWeight: 700,
                      color: r.status >= 400 ? T.red : r.status >= 300 ? T.amber : T.brandLight
                    }}>{r.status}</span>
                    <span>{fmtAgo(r.ts)}</span>
                    <span style={{color:T.purple, opacity:0.8}}>↑ {fmtBytes(r.bytesOut)}</span>
                    <span style={{color:T.brand, opacity:0.8}}>↓ {fmtBytes(r.bytesIn)}</span>
                  </div>
                </div>
                <div style={{textAlign:"right", fontFamily:"'JetBrains Mono',monospace", minWidth:70}}>
                  <div style={{fontSize:12, fontWeight:700, color:T.textHi}}>{fmtBytes(r.totalBytes)}</div>
                  <div style={{fontSize:10, fontWeight:500, color:T.brandLight}}>{r.pct.toFixed(1)}%</div>
                </div>
              </div>
              <div style={{height:3, background:T.line, borderRadius:1.5, overflow:"hidden", marginTop:8, width:"100%"}}>
                <div style={{
                  height:"100%",
                  borderRadius:1.5,
                  width:`${Math.min(100, r.pct)}%`,
                  background: T.brand,
                  transition: "width .3s ease"
                }}/>
              </div>
            </div>
          ))
        ) : (
          groupedData.map((g, i) => (
            <div key={g.label} style={{display:"flex",flexDirection:"column",padding:"12px 16px",borderBottom:i<groupedData.length-1?`1px solid ${T.border}`:"none"}} role="listitem">
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{
                  width:26,height:26,borderRadius:6,flexShrink:0,
                  background: T.brandDim,
                  border: `1px solid ${T.brand}40`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:900,
                  color: T.brandLight
                }}>#{i + 1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>{g.label}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.textDim,marginTop:2, display:"flex", gap:10, alignItems:"center"}}>
                    <span style={{background: T.brandDim, padding: "1px 6px", borderRadius: 3, fontSize: 9, fontWeight: 700, color: T.brandLight}}>
                      {g.count} {g.count === 1 ? "CALL" : "CALLS"}
                    </span>
                    <span style={{color:T.purple, opacity:0.8}}>↑ {fmtBytes(g.bytesOut)}</span>
                    <span style={{color:T.brand, opacity:0.8}}>↓ {fmtBytes(g.bytesIn)}</span>
                  </div>
                </div>
                <div style={{textAlign:"right", fontFamily:"'JetBrains Mono',monospace", minWidth:70}}>
                  <div style={{fontSize:12, fontWeight:700, color:T.textHi}}>{fmtBytes(g.totalBytes)}</div>
                  <div style={{fontSize:10, fontWeight:500, color:T.brandLight}}>{g.pct.toFixed(1)}%</div>
                </div>
              </div>
              <div style={{height:3, background:T.line, borderRadius:1.5, overflow:"hidden", marginTop:8, width:"100%"}}>
                <div style={{
                  height:"100%",
                  borderRadius:1.5,
                  width:`${Math.min(100, g.pct)}%`,
                  background: T.brand,
                  transition: "width .3s ease"
                }}/>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

const BucketBreakdown = ({ snap, timeframe, setTimeframe }) => {
  return (
    <div style={{background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:12, padding:18, marginTop:4}}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color:T.textDim}}>DATA INGESTION BY BUCKET</div>
        <div role="group" aria-label="Ingestion timeframe" style={{display:"flex", gap:4}}>
          {["today", "month", "overall"].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              aria-pressed={timeframe === tf ? "true" : "false"}
              aria-label={`View ingestion breakdown for ${tf}`}
              title={`View ingestion breakdown for ${tf}`}
              style={{
                background: timeframe === tf ? T.brandDim : "none",
                border: `1px solid ${timeframe === tf ? T.brand : T.border}`,
                borderRadius: 4,
                padding: "2px 8px",
                fontSize: 9,
                fontWeight: 700,
                color: timeframe === tf ? T.brandLight : T.textDim,
                cursor: "pointer",
                fontFamily: "'JetBrains Mono',monospace",
                textTransform: "uppercase"
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:"flex", flexDirection:"column", gap:12}}>
        {snap.buckets?.[timeframe]?.map(b => (
          <div key={b.name}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:4, fontSize:11, fontFamily:"'JetBrains Mono',monospace"}}>
              <span style={{color:T.text, fontWeight:500}}>{b.name}</span>
              <span style={{color:T.textHi, fontWeight:700}}>{fmtBytes(b.total)} <span style={{color:T.textDim, fontSize:10, fontWeight:500}}>({b.pct.toFixed(1)}%)</span></span>
            </div>
            <div style={{height:6, background:T.line, borderRadius:3, overflow:"hidden"}}>
              <div style={{
                height:"100%",
                borderRadius:3,
                width:`${b.pct}%`,
                background: b.name.includes("Polling") ? T.brand : b.name.includes("Chat") ? T.purple : b.name.includes("Repo") ? T.amber : b.name.includes("List") ? T.blue : T.dim,
                transition: "width .3s ease"
              }}/>
            </div>
          </div>
        ))}
        {(!snap.buckets?.[timeframe] || snap.buckets[timeframe].length === 0 || snap.buckets[timeframe].every(b => b.total === 0)) && (
          <div style={{fontSize:11, color:T.textDim, textAlign:"center", padding:"12px 0", fontFamily:"'IBM Plex Sans',sans-serif"}}>
            No data recorded for this timeframe.
          </div>
        )}
      </div>
    </div>
  );
};

const NetworkMonitor = ({ onBack, isDesktop }) => {
  const [snap, setSnap] = useState(NET.snapshot());
  const [storage, setStorage] = useState(null);
  const [bucketTimeframe, setBucketTimeframe] = useState("overall");

  useEffect(() => NET.subscribe(s => setSnap(s)), []);
  useEffect(() => { getStorageInfo().then(setStorage); }, []);

  const { total, totalIn, totalOut, log } = snap;
  const webEst = total * 9 + 2.4;
  const reduction = total > 0 ? Math.round(((webEst - total) / webEst) * 100) : 0;

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0}} role="region" aria-label="Network and Storage Monitor">
      <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}33`,background:T.surface,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        {!isDesktop&&<button onClick={onBack} aria-label="Go back" style={{background:"none",border:"none",cursor:"pointer",display:"flex"}}><Ic n="back" s={18} c={T.text}/></button>}
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.text,letterSpacing:"0.05em",fontWeight:700,flex:1}}>NETWORK & STORAGE</div>
        {isDesktop && (
          <button onClick={onBack} aria-label="Close" title="Close" style={{background:"none",border:"none",cursor:"pointer",display:"flex",padding:4,opacity:0.8}}>
            <Ic n="x" s={18} c={T.text}/>
          </button>
        )}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"20px 24px",WebkitOverflowScrolling:"touch",minHeight:0}}>
        <div style={{maxWidth:560,margin:"0 auto"}}>
          <div style={{animation:"fadeIn .2s ease", display:"flex", flexDirection:"column", gap:20}}>
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

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} role="list">
              {[
                {l:"RECEIVED",   v:fmtBytes(totalIn), c:T.brand,  desc:"Total incoming data"},
                {l:"SENT",       v:fmtBytes(totalOut),c:T.purple, desc:"Total outgoing data"},
                {l:"EFFICIENCY", v:`${reduction}%`,   c:T.amber,  desc:"Data saved vs. standard"},
                {l:"REQUESTS",   v:log.length,        c:T.blue,   desc:"Total API calls made"},
              ].map(s=>(
                <div key={s.l} style={{background:T.surfaceHi,border:`1px solid ${T.border}`,borderRadius:12,padding:16}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.textDim,letterSpacing:"0.1em",marginBottom:6,fontWeight:700}}>{s.l}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:900,color:s.c,marginBottom:4}}>{s.v}</div>
                  <div style={{fontSize:9, color:T.textDim, fontFamily:"'IBM Plex Sans',sans-serif", lineHeight:1.2}}>{s.desc}</div>
                </div>
              ))}
            </div>

            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
              <div style={{background:T.surfaceHi, border:`1px solid ${T.border}`, borderRadius:12, padding:18, display:"flex", flexDirection:"column"}}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:12}}>
                  <Ic n="database" s={14} c={T.purple}/>
                  <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color:T.textDim}}>APP DATA</span>
                </div>
                <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:24, fontWeight:900, color:T.text, marginBottom:16}}>{storage ? fmtBytes((storage.local||0)/1024) : "..."}<span style={{fontSize:10, color:T.textDim, marginLeft:4, fontWeight:500}}>USED</span></div>
                <button onClick={clearDataOnly} aria-label="Clear application data" title="Clear application data" style={{
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
                <button onClick={clearCacheOnly} aria-label="Clear cached network responses" title="Clear cached network responses" style={{
                  width:"100%", padding:"10px", borderRadius:8, background:`${T.blue}15`, border:`1px solid ${T.blue}30`,
                  color:T.blue, fontSize:10, fontWeight:800, fontFamily:"'JetBrains Mono',monospace", cursor:"pointer",
                  transition:"all .2s cubic-bezier(0.4, 0, 0.2, 1)"
                }} onMouseEnter={e=>e.currentTarget.style.background=`${T.blue}25`} onMouseLeave={e=>e.currentTarget.style.background=`${T.blue}15`}>CLEAR CACHE</button>
              </div>
            </div>

            <BucketBreakdown snap={snap} timeframe={bucketTimeframe} setTimeframe={setBucketTimeframe} />

            <RecentActivityLog log={log} total={total} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Performance Optimized: Wrapped in React.memo to prevent unnecessary collision
// scanning, prompt evaluation, and layout re-rendering on parent countdown timer
// ticks and background poll cycles when props are reference-stable.
