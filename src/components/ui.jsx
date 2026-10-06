const PATHS = {
  back:"M19 12H5m7-7l-7 7 7 7",
  send:"M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  plus:"M12 4v16m8-8H4",
  tasks:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  wifi:"M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0",
  check:"M20 6L9 17l-5-5",
  x:"M18 6L6 18M6 6l12 12",
  refresh:"M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  trash:"M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  key:"M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  code:"M9 9l-6 3 6 3M15 9l6 3-6 3M13 4l-2 16",
  terminal:"M4 17l6-6-6-6M12 19h8",
  plan:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 12h6M9 16h4",
  approve:"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  branch:"M6 3v12M18 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM18 9a9 9 0 01-9 9",
  download:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5 5-5m-5 5V3",
  pause:"M6 4h4v16H6zM14 4h4v16h-4z",
  layout_toggle:"M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm5 0v16",
  git_pull:"M18 18a3 3 0 100-6 3 3 0 000 6zM6 18a3 3 0 100-6 3 3 0 000 6zM6 6a3 3 0 100-6 3 3 0 000 6zM6 9v6M13 6h3a2 2 0 012 2v7",
  git_merge:"M18 18a3 3 0 100-6 3 3 0 000 6zM6 6a3 3 0 100-6 3 3 0 000 6zM6 21V9a9 9 0 009 9",
  copy: "M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3",
  expand: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
  chevron_down:"M6 9l6 6 6-6",
  chevron_up:"M18 15l-6-6-6 6",
  chevron_right:"M9 18l6-6-6-6",
  database:"M3 5V19C3 20.66 6.13 22 10 22C13.87 22 17 20.66 17 19V5M3 5C3 6.66 6.13 8 10 8C13.87 8 17 6.66 17 5M3 5C3 3.34 6.13 2 10 2C13.87 2 17 3.34 17 5M17 12C17 13.66 13.87 15 10 15C6.13 15 3 13.66 3 12",
  layers:"M12 2L2 7L12 12L22 7L12 2ZM2 17L12 22L22 17M2 12L12 17L22 12",
  search:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  archive:"M21 8v13H3V8M1 3h22v5H1V3m10 8h2",
  unarchive:"M21 8v13H3V8M1 3h22v5H1V3m7 11l4-4 4 4m-4-4v10",
  more: "M12 5h.01M12 12h.01M12 19h.01",
  settings:"M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H4a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V4a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H20a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z",
  reply: "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  play:"M5 3l14 9-14 9V3z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z",
  eye_closed: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22",
};
const Ic = ({n,s=16,c=T.muted,style, ...props}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={style} {...props}>
    <path d={PATHS[n]||""}/>
  </svg>
);

const inputSt = {
  width:"100%",background:T.surfaceHi,border:`1px solid ${T.border}`,borderRadius:6,
  padding:"10px 14px",color:T.text,fontFamily:"'Plus Jakarta Sans','IBM Plex Sans',sans-serif",fontSize:14,
  outline:"none",boxSizing:"border-box",transition:"all .15s cubic-bezier(0.16, 1, 0.3, 1)",
};

// ─── UI Primitives ────────────────────────────────────────────────────────────
const Pill = ({status,small=false,hideLabel=false}) => {
  const m = STATUS_META[status] || STATUS_META.QUEUED;
  const pulseColor = m.color === T.brand ? T.brandLight : m.color;
  return (
    <span
      title={m.label}
      aria-label={`Status: ${m.label}`}
      style={{
      display:"inline-flex",alignItems:"center",gap:5,
      padding:small?(hideLabel?"3px 5px":"2px 6px"):"3px 8px",borderRadius:4,
      background:m.bg,border:`1px solid ${m.color}25`,
      fontFamily:"'JetBrains Mono',monospace",
      fontSize:small?10:11,fontWeight:700,letterSpacing:"0.04em",color:m.color,flexShrink:0,
      lineHeight:1.2,
      boxShadow:"none",
    }}>
      {m.pulse && status !== "COMPLETED" && (
        <span style={{width:5,height:5,borderRadius:"50%",background:pulseColor,boxShadow:`0 0 6px ${pulseColor}`,animation:"dot 1.2s ease-in-out infinite",flexShrink:0}}/>
      )}
      {hideLabel ? (
        <div style={{ display: "flex", animation: status === "IN_PROGRESS" ? "spin 2s linear infinite" : "none" }}>
          <Ic n={m.icon} s={11} c={m.color}/>
        </div>
      ) : m.label}
    </span>
  );
};

const Bar = ({pct,status,syncing,secondaryPct=0}) => {
  const c = (STATUS_META[status]||STATUS_META.QUEUED).color;
  const isComplete = status === "COMPLETED";
  return (
    <div style={{height:3,background:T.line,borderRadius:2,overflow:"hidden",position:"relative"}}>
      {/* Secondary Progress (e.g. Sync/Download) */}
      {secondaryPct > 0 && (
        <div style={{
          position:"absolute", inset:0, width:`${secondaryPct}%`,
          background:`${T.brand}40`, transition:"width .3s ease", zIndex:1
        }}/>
      )}

      <div style={{
        height:"100%",width:`${pct}%`,borderRadius:2,background:c,
        boxShadow:`0 0 8px ${c}60`,transition:"width .5s cubic-bezier(0.4, 0, 0.2, 1)",transform:"translateZ(0)",
        position:"relative", zIndex: 2,
        overflow:"hidden"
      }}>
        {syncing && !isComplete && (
          <div style={{
            position:"absolute",top:0,left:0,right:0,bottom:0,
            background:"linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
            backgroundSize:"200% 100%",
            animation:"barShimmer 1.5s infinite linear"
          }}/>
        )}
      </div>
      {syncing && pct === 0 && (
        <div style={{
          position:"absolute",top:0,height:"100%",width:"30%",
          background:T.amber,borderRadius:2, zIndex: 3,
          animation:"barIndeterminate 1.5s infinite ease-in-out"
        }}/>
      )}
    </div>
  );
};

const Btn = ({children,onClick,color=T.brand,disabled=false,outline=false,sm=false,style:s={},...props}) => (
  <button onClick={onClick} disabled={disabled} {...props} style={{
    background:outline?"transparent":(disabled?T.dim:color),
    border:`1px solid ${disabled?T.border:(outline?`${color}60`:"transparent")}`,
    borderRadius:6,cursor:disabled?"not-allowed":"pointer",
    padding:sm?"7px 14px":"10px 20px",
    minHeight: sm ? 36 : 44,
    color:disabled?T.muted:(outline?color:"#07090e"),
    fontFamily:"'Plus Jakarta Sans','IBM Plex Sans',sans-serif",fontSize:sm?12:13.5,fontWeight:700,letterSpacing:"0.01em",
    transition:"all .15s cubic-bezier(0.16, 1, 0.3, 1)",opacity:disabled?.5:1,
    display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,
    boxShadow:outline?"none":(disabled?"none":`0 2px 10px ${color}25`),
    ...s,
  }}>{children}</button>
);

const Field = ({label,htmlFor,children,style:s={}}) => (
  <div style={{marginBottom:24,...s}}>
    {htmlFor ? (
      <label htmlFor={htmlFor} style={{display:"block",marginBottom:10,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.textDim,fontWeight:700,letterSpacing:"0.12em",cursor:"pointer"}}>{label}</label>
    ) : (
      <div style={{marginBottom:10,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.textDim,fontWeight:700,letterSpacing:"0.12em"}}>{label}</div>
    )}
    {children}
  </div>
);

const PickerBtn = ({ label, isAct, onClick, activeColor=T.brand, activeBg=null, title, style:s={}, ...props }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={isAct ? "true" : "false"}
    aria-label={typeof label === "string" ? label : undefined}
    title={title || (typeof label === "string" ? label : undefined)}
    {...props}
    style={{
      flexShrink:0, minHeight:34, padding:"0 12px", borderRadius:6,
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      background: isAct ? (activeBg || T.surfaceHi) : "transparent",
      border:`1px solid ${isAct ? `${activeColor}55` : T.border}`,
      color: isAct ? T.textHi : T.muted,
      boxShadow: isAct ? `0 1px 4px rgba(0,0,0,0.4), inset 0 0 0 1px ${activeColor}33` : "none",
      fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:isAct?700:500,
      letterSpacing:"0.04em", cursor:"pointer", transition:"all .15s cubic-bezier(0.16, 1, 0.3, 1)",
      ...s,
    }}
  >{label}</button>
);

const Backdrop = ({ onClick, zIndex=100 }) => (
  <div style={{ position:"fixed", inset:0, zIndex }} onClick={onClick}/>
);

// ─── Jules Thinking Indicator & Hook ───────────────────────────────────────────
const useJulesThinking = (localBusy = false, localLabel = "") => {
  const [globalState, setGlobalState] = useState(() => ({
    isThinking: false,
    count: 0,
    label: ""
  }));

  useEffect(() => {
    const handleEvent = (e) => {
      if (e?.detail) setGlobalState(e.detail);
    };
    window.addEventListener("jules-thinking-state", handleEvent);
    return () => window.removeEventListener("jules-thinking-state", handleEvent);
  }, []);

  const isThinking = Boolean(localBusy || globalState.isThinking);
  const label = localLabel || globalState.label || "Jules is thinking...";

  return { isThinking, count: globalState.count, label };
};

const JulesThinkingIndicator = ({
  inline = false,
  compact = false,
  label = "Jules is thinking...",
  subtext = "Consulting Gemini server…",
  style: customStyle = {}
}) => {
  const [elapsed, setElapsed] = useState("0.0");

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(((Date.now() - start) / 1000).toFixed(1));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <div
        role="status"
        aria-live="polite"
        title="Jules is processing request on Gemini server"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          padding: "3px 9px",
          borderRadius: 6,
          background: "rgba(6, 182, 212, 0.12)",
          border: `1px solid ${T.brand}40`,
          boxShadow: `0 0 14px rgba(6, 182, 212, 0.15)`,
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 10.5,
          fontWeight: 700,
          color: T.brandLight,
          animation: "fadeIn .2s ease",
          ...customStyle
        }}
      >
        <div style={{ position: "relative", width: 7, height: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", width: 7, height: 7, borderRadius: "50%", background: T.brand, animation: "thinkingWave 1.4s ease-in-out infinite" }} />
          <div style={{ width: 11, height: 11, borderRadius: "50%", border: `1px solid ${T.brand}`, animation: "dot 1.4s ease-in-out infinite", opacity: 0.6 }} />
        </div>
        <span>{label}</span>
        <div style={{ display: "inline-flex", gap: 2.5, alignItems: "center", marginLeft: 1 }}>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: T.brand, animation: "thinkingWave 1.2s infinite ease-in-out", animationDelay: "0ms" }} />
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: T.brand, animation: "thinkingWave 1.2s infinite ease-in-out", animationDelay: "200ms" }} />
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: T.brand, animation: "thinkingWave 1.2s infinite ease-in-out", animationDelay: "400ms" }} />
        </div>
      </div>
    );
  }

  if (inline) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          borderRadius: 8,
          background: "rgba(6, 182, 212, 0.08)",
          border: `1px solid ${T.brand}33`,
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          fontSize: 12.5,
          color: T.text,
          animation: "fadeIn .2s ease",
          ...customStyle
        }}
      >
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: "linear-gradient(135deg, #22d3ee, #0891b2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 900, color: "#090d14",
          boxShadow: `0 0 10px rgba(6, 182, 212, 0.4)`,
          animation: "pulseRepo 2s infinite ease-in-out",
          flexShrink: 0
        }}>
          J
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 700, color: T.brandLight }}>{label}</span>
          <div style={{ display: "inline-flex", gap: 2.5, alignItems: "center" }}>
            <span style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: T.brand, animation: "thinkingWave 1.2s infinite ease-in-out", animationDelay: "0ms" }} />
            <span style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: T.brand, animation: "thinkingWave 1.2s infinite ease-in-out", animationDelay: "200ms" }} />
            <span style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: T.brand, animation: "thinkingWave 1.2s infinite ease-in-out", animationDelay: "400ms" }} />
          </div>
          {subtext && <span style={{ color: T.muted, fontSize: 11 }}>· {subtext}</span>}
        </div>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, color: T.dim, fontVariantNumeric: "tabular-nums" }}>
          {elapsed}s
        </span>
      </div>
    );
  }

  // Full Card banner variant
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "14px 16px",
        borderRadius: 10,
        background: `linear-gradient(135deg, rgba(6,182,212,0.1), rgba(129,140,248,0.06)), ${T.surfaceHi}`,
        border: `1px solid ${T.brand}44`,
        boxShadow: `0 8px 24px rgba(0,0,0,0.3), 0 0 16px rgba(6,182,212,0.12)`,
        animation: "fadeIn .25s ease-out",
        ...customStyle
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #22d3ee, #0891b2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 900, color: "#090d14",
            boxShadow: `0 0 12px rgba(6, 182, 212, 0.45)`,
            animation: "pulseRepo 2.4s infinite ease-in-out",
            flexShrink: 0
          }}>
            J
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 700, color: T.textHi }}>
                {label}
              </span>
              <div style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
                <span style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: T.brandLight, animation: "thinkingWave 1.2s infinite ease-in-out", animationDelay: "0ms" }} />
                <span style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: T.brandLight, animation: "thinkingWave 1.2s infinite ease-in-out", animationDelay: "200ms" }} />
                <span style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: T.brandLight, animation: "thinkingWave 1.2s infinite ease-in-out", animationDelay: "400ms" }} />
              </div>
            </div>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 11.5, color: T.muted }}>
              {subtext}
            </div>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "3px 8px", borderRadius: 4, background: "rgba(0,0,0,0.3)", border: `1px solid ${T.border}`
        }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.brand, fontWeight: 700 }}>
            GEMINI SERVER
          </span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, color: T.textHi, fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
            {elapsed}s
          </span>
        </div>
      </div>
      {/* Animated shimmer track */}
      <div style={{ width: "100%", height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", position: "relative" }}>
        <div style={{
          position: "absolute", top: 0, bottom: 0, width: "40%",
          background: `linear-gradient(90deg, transparent, ${T.brand}, ${T.indigoLight}, transparent)`,
          animation: "barIndeterminate 1.8s infinite ease-in-out"
        }} />
      </div>
    </div>
  );
};

const GlobalThinkingBar = () => {
  const { isThinking, count, label } = useJulesThinking();
  const [elapsed, setElapsed] = useState("0.0");
  const startRef = useRef(null);

  useEffect(() => {
    if (isThinking) {
      startRef.current = Date.now();
      const interval = setInterval(() => {
        if (startRef.current) {
          setElapsed(((Date.now() - startRef.current) / 1000).toFixed(1));
        }
      }, 100);
      return () => clearInterval(interval);
    } else {
      startRef.current = null;
      setElapsed("0.0");
    }
  }, [isThinking]);

  if (!isThinking) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Jules is thinking and processing request on Gemini server"
      style={{
        position: "fixed",
        top: 14,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 16px",
        borderRadius: 24,
        background: "rgba(14, 20, 32, 0.94)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${T.brand}55`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.55), 0 0 24px rgba(6, 182, 212, 0.28)`,
        animation: "slideDownFade .25s cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: "auto",
        maxWidth: "92vw",
        overflow: "hidden"
      }}
    >
      {/* Pulsing indicator node */}
      <div style={{
        position: "relative",
        width: 18,
        height: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "rgba(6, 182, 212, 0.25)",
          animation: "thinkingGlow 1.8s infinite ease-in-out"
        }} />
        <div style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: T.brand,
          boxShadow: `0 0 10px ${T.brandLight}`,
          animation: "dot 1.2s infinite ease-in-out"
        }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
        <span style={{
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          fontSize: 12.5,
          fontWeight: 700,
          color: T.textHi,
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}>
          {label || "Jules is thinking..."}
        </span>
        {/* Animated wave dots */}
        <div style={{ display: "inline-flex", gap: 3, alignItems: "center", flexShrink: 0 }}>
          <span style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: T.brandLight, animation: "thinkingWave 1.2s infinite ease-in-out", animationDelay: "0ms" }} />
          <span style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: T.brandLight, animation: "thinkingWave 1.2s infinite ease-in-out", animationDelay: "200ms" }} />
          <span style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: T.brandLight, animation: "thinkingWave 1.2s infinite ease-in-out", animationDelay: "400ms" }} />
        </div>
      </div>

      <div style={{ width: 1, height: 12, background: T.borderHi, flexShrink: 0 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <span style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 9.5,
          color: T.brand,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase"
        }}>
          GEMINI SERVER
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 11,
          color: T.textHi,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums"
        }}>
          {elapsed}s
        </span>
      </div>

      {count > 1 && (
        <span style={{
          background: `${T.brand}22`,
          border: `1px solid ${T.brand}44`,
          color: T.brandLight,
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 9.5,
          fontWeight: 700,
          padding: "1px 6px",
          borderRadius: 10,
          flexShrink: 0
        }}>
          {count} active
        </span>
      )}
    </aside>
  );
};

const SearchPicker = ({ value, search, onSearch, onSelect, onHide, options, placeholder, icon, isOpen, getDisplay, getVal, renderExtra }) => {
  return (
    <div style={{position:"relative"}}>
      <input
        value={search}
        onChange={e=>onSearch(e.target.value)}
        onFocus={()=>onSearch(search, true)}
        placeholder={placeholder}
        aria-label={placeholder || "Search options"}
        role="combobox"
        aria-expanded={isOpen ? "true" : "false"}
        aria-autocomplete="list"
        onKeyDown={e => {
          if (e.key === "Escape") {
            onHide();
          }
        }}
        maxLength={200}
        style={{...inputSt, paddingRight:36}}
      />
      <div style={{position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", display:"flex", alignItems:"center", pointerEvents:"none"}}>
        <Ic n={icon} s={14} c={isOpen?T.brand:T.muted}/>
      </div>

      {isOpen && (
        <>
          <Backdrop onClick={onHide}/>
          <div
            role="listbox"
            style={{
              position:"absolute", top:"100%", left:0, right:0, zIndex:101,
              marginTop:4, background:T.surfaceHi, border:`1px solid ${T.borderHi}`,
              borderRadius:6, maxHeight:200, overflowY:"auto",
              boxShadow:"0 10px 25px rgba(0,0,0,0.5)",
            }}
          >
            {options.length === 0 && (
              <div style={{padding:"12px", textAlign:"center", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.textDim}}>
                NO RESULTS FOUND
              </div>
            )}
            {options.map((opt, idx) => {
              const val = getVal(opt);
              const isSelected = val === value;
              return (
                <button
                  key={idx}
                  role="option"
                  aria-selected={isSelected ? "true" : "false"}
                  onClick={()=>onSelect(opt)}
                  style={{
                    width:"100%", padding:"10px 12px", background:"none", border:"none",
                    textAlign:"left", cursor:"pointer", display:"flex", alignItems:"center", gap:8,
                    borderBottom:idx < options.length - 1 ? `1px solid ${T.border}` : "none",
                    transition:"background .1s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onMouseEnter={e=>e.currentTarget.style.background=T.dim}
                  onMouseLeave={e=>e.currentTarget.style.background="none"}
                >
                  <Ic n={icon} s={12} c={isSelected?T.brand:T.muted}/>
                  <span style={{
                    flex:1, fontFamily:"'IBM Plex Sans',sans-serif", fontSize:13,
                    color:isSelected?T.brand:T.text, fontWeight:isSelected?600:400,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  }}>{getDisplay(opt)}</span>
                  {renderExtra && renderExtra(opt)}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
