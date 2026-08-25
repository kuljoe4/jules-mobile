const Modal = ({ children, actions, onClose, title, subtitle, icon: IconN, maxWidth = 420 }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:2000,
      background:"rgba(4,5,7,0.85)", backdropFilter:"blur(12px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:20, animation:"fadeIn .2s ease"
    }} onClick={onClose}>
      <div style={{
        width:"100%", maxWidth, maxHeight:"90vh", background:T.surface, border:`1px solid ${T.borderHi}`,
        borderRadius:16, boxShadow:"0 20px 50px rgba(0,0,0,0.6)",
        animation:"zoomIn .3s cubic-bezier(0.2, 0, 0.2, 1)",
        position:"relative", display:"flex", flexDirection:"column"
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:3,
          background:`linear-gradient(90deg, ${T.brand}, ${T.purple})`
        }}/>
        {onClose && (
          <button
            onClick={onClose}
            title="Close modal"
            aria-label="Close modal"
            style={{
              position:"absolute", top:12, right:12, zIndex:2001,
              background:"transparent", border:"none", cursor:"pointer",
              padding:6, display:"flex", alignItems:"center", justifyContent:"center",
              borderRadius:"50%", transition:"all .15s cubic-bezier(0.4, 0, 0.2, 1)",
              color: T.muted
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = T.text;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = T.muted;
            }}
          >
            <Ic n="x" s={14} c="currentColor"/>
          </button>
        )}
      <div style={{ padding: "28px 28px 12px", overflowY: "auto", flex: 1, WebkitOverflowScrolling: "touch" }}>
        {(IconN || title) && (
          <div style={{textAlign:"center", marginBottom:24}}>
            {IconN && (
              <div style={{
                width:48, height:48, borderRadius:12, background:T.brandDim,
                display:"flex", alignItems:"center", justifyContent:"center",
                margin:"0 auto 16px", border:`1px solid ${T.brand}30`
              }}>
                <Ic n={IconN} s={22} c={T.brand}/>
              </div>
            )}
            {title && <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:900, color:T.text, letterSpacing:"0.05em"}}>{title}</div>}
            {subtitle && <div style={{fontFamily:"'IBM Plex Sans',sans-serif", fontSize:14, color:T.muted, marginTop:4}}>{subtitle}</div>}
          </div>
        )}
        {children}
      </div>
      {actions && <div style={{display:"flex", gap:12, padding: "0 28px 28px"}}>{actions}</div>}
    </div>
  </div>
  );
};
