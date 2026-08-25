// ─── Shell ────────────────────────────────────────────────────────────────────
function Shell({ children, desktop=false }) {
  // Dismiss the pre-React splash screen on first paint
  useEffect(() => {
    const splash = document.getElementById("splash");
    if (!splash) return;
    // Fast-complete the progress bar then fade out
    const bar = document.getElementById("splash-bar");
    if (bar) { bar.style.animation = "none"; bar.style.width = "100%"; bar.style.transition = "width .18s ease"; }
    const hint = document.getElementById("splash-hint");
    if (hint) hint.textContent = "READY";
    const t = setTimeout(() => { splash.classList.add("hidden"); }, 180);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      width:"100%",background:T.bg,display:"flex",isolation:"isolate",
      fontFamily:"'IBM Plex Sans',sans-serif",overflow:"hidden",
      ...(desktop
        ? { minHeight:"100vh", flexDirection:"row" }
        : { width:"100%", height:"100dvh", flexDirection:"column" }
      ),
    }}>
      <style>{`
        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-thumb{background:${T.dim};border-radius:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        select,input,textarea{color-scheme:dark;}
        option{background:${T.surface};color:${T.text};}
        @keyframes dot{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(.7);}}
        @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        @keyframes zoomIn{from{transform:scale(0.95);opacity:0;}to{transform:scale(1);opacity:1;}}
        @keyframes slideUp{from{transform:translateY(20px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes shimmerPulse {
          0% { opacity: 0.7; transform: translateY(4px); }
          50% { opacity: 1; transform: translateY(-2px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes barShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes barIndeterminate {
          0% { left: -35%; }
          100% { left: 100%; }
        }
        @keyframes pulseRepo {
          0% { border-color: ${T.brand}40; box-shadow: 0 0 0 ${T.brand}00; }
          50% { border-color: ${T.brand}; box-shadow: 0 0 25px ${T.brand}80; transform: scale(1.02); }
          100% { border-color: ${T.brand}40; box-shadow: 0 0 0 ${T.brand}00; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, ::before, ::after {
            animation-delay: -1ms !important;
            animation-duration: 1ms !important;
            animation-iteration-count: 1 !important;
            background-attachment: initial !important;
            scroll-behavior: auto !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        }
        ::selection{background:${T.brandDim};color:${T.brand};}
        textarea::placeholder,input::placeholder{color:${T.muted};}
        button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible, a:focus-visible, [role="button"]:focus-visible, [tabindex="0"]:focus-visible {
          outline: 2px solid ${T.brand} !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 4px ${T.brandDim} !important;
        }

        @media screen and (max-width: 767px) and (orientation: landscape) {
          body { display: flex; align-items: center; justify-content: center; text-align: center; }
          body > #root { display: none; }
          body::after {
            content: "PLEASE ROTATE YOUR PHONE TO PORTRAIT MODE";
            font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; color: ${T.brand};
            padding: 40px; letter-spacing: 0.1em; line-height: 1.6;
          }
        }
      `}</style>
      <PWABanner/>
      {children}
    </div>
  );
}
