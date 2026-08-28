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
  layout_toggle:"M12 4V2m0 20v-2m8-8h2M2 12h2m13.657-5.657l1.414-1.414m-14.142 14.142l1.414-1.414m0-14.142l-1.414-1.414m14.142 14.142l-1.414-1.414",
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
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z",
  eye_closed: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22",
};
const Ic = ({n,s=16,c=T.muted}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={PATHS[n]||""}/>
  </svg>
);

// ─── UI Primitives ────────────────────────────────────────────────────────────
const Pill = ({status,small=false,hideLabel=false}) => {
  const m = STATUS_META[status] || STATUS_META.QUEUED;
  const pulseColor = m.color === T.brand ? T.brandLight : m.color;
  return (
    <span
      title={m.label}
      style={{
      display:"inline-flex",alignItems:"center",gap:4,
      padding:small?(hideLabel?"4px":"2px 8px"):"4px 10px",borderRadius:4,
      background:m.bg,border:`1px solid ${m.color}40`,
      fontFamily:"'JetBrains Mono',monospace",
      fontSize:small?10:11,fontWeight:800,letterSpacing:"0.08em",color:m.color,flexShrink:0,
      boxShadow:"none",
    }}>
      {m.pulse && status !== "COMPLETED" && <span style={{width:4,height:4,borderRadius:"50%",background:pulseColor,animation:"dot 1.2s ease-in-out infinite",flexShrink:0}}/>}
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
    border:`1px solid ${disabled?T.border:color+(outline?"77":"00")}`,
    borderRadius:6,cursor:disabled?"default":"pointer",
    padding:sm?"8px 14px":"12px 18px",
    color:disabled?T.muted:(outline?color:"#000"),
    fontFamily:"'JetBrains Mono',monospace",fontSize:sm?11:12,fontWeight:800,letterSpacing:"0.08em",
    transition:"all .15s cubic-bezier(0.4, 0, 0.2, 1)",opacity:disabled?.5:1,
    display:"flex",alignItems:"center",justifyContent:"center",gap:8,
    boxShadow:outline?"none":(disabled?"none":`0 4px 12px ${color}30`),
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
      flexShrink:0, minHeight:36, padding:"0 14px", borderRadius:20, border:"none",
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      background:isAct ? (activeBg || `${activeColor}15`) : "transparent",
      border:`1px solid ${isAct ? `${activeColor}60` : T.border}`,
      color:isAct ? activeColor : T.muted,
      fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:isAct?700:400,
      letterSpacing:"0.05em", cursor:"pointer", transition:"all .12s cubic-bezier(0.4, 0, 0.2, 1)",
      ...s,
    }}
  >{label}</button>
);

const Backdrop = ({ onClick, zIndex=100 }) => (
  <div style={{ position:"fixed", inset:0, zIndex }} onClick={onClick}/>
);

const SearchPicker = ({ value, search, onSearch, onSelect, onHide, options, placeholder, icon, isOpen, getDisplay, getVal, renderExtra }) => {
  return (
    <div style={{position:"relative"}}>
      <input
        value={search}
        onChange={e=>onSearch(e.target.value)}
        onFocus={()=>onSearch(search, true)}
        placeholder={placeholder}
        aria-label={placeholder || "Search options"}
        maxLength={200}
        style={{...inputSt, paddingRight:36}}
      />
      <div style={{position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", display:"flex", alignItems:"center", pointerEvents:"none"}}>
        <Ic n={icon} s={14} c={isOpen?T.brand:T.muted}/>
      </div>

      {isOpen && (
        <>
          <Backdrop onClick={onHide}/>
          <div style={{
            position:"absolute", top:"100%", left:0, right:0, zIndex:101,
            marginTop:4, background:T.surfaceHi, border:`1px solid ${T.borderHi}`,
            borderRadius:6, maxHeight:200, overflowY:"auto",
            boxShadow:"0 10px 25px rgba(0,0,0,0.5)",
          }}>
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
