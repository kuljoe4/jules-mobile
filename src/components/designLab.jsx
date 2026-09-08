/**
 * DesignLab component - Interactive Design System Lab
 *
 * Provides a side-by-side sandbox to audit current decorated UI treatments against
 * simplified (Dot + Tint) alternative aesthetics across session cards, chat bubbles,
 * progress updates, and status pills.
 */
const DesignLab = () => {
  const [comparisonMode, setComparisonMode] = useState("compare"); // "compare", "current", "simplified"

  return (
    <div style={{ animation: "fadeIn .3s cubic-bezier(0.4, 0, 0.2, 1)", display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Introduction header */}
      <div style={{ background: T.surfaceHi, padding: 20, borderRadius: 12, border: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Ic n="layout_toggle" s={18} c={T.brand} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 800, color: T.text, letterSpacing: "0.05em" }}>DESIGN SYSTEM LAB</span>
        </div>
        <p style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, color: T.textDim, lineHeight: 1.6, margin: 0 }}>
          Compare our existing highly-decorated visual treatments against modern, simplified alternative aesthetics built directly on Joe's design tokens and premium font stack.
        </p>
      </div>

      {/* Mode Toggle Pills */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: T.muted, fontWeight: 700, letterSpacing: "0.05em" }}>CHOOSE COMPARISON MODE</div>
        <div style={{ display: "flex", gap: 6, background: T.surfaceHi, padding: 4, borderRadius: 24, border: `1px solid ${T.border}`, alignSelf: "flex-start" }}>
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
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Ic n="layers" s={14} c={T.brandLight} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 800, color: T.text, letterSpacing: "0.05em" }}>SESSION CARD STATES</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: (comparisonMode === "compare") ? "1fr 1fr" : "1fr", gap: 20 }}>
          {/* Column 1: Current Treatment */}
          {(comparisonMode === "compare" || comparisonMode === "current") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T.muted, fontWeight: 800, letterSpacing: "0.05em", background: `${T.brand}15`, padding: "4px 8px", borderRadius: 4, alignSelf: "flex-start" }}>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>Idle Session</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.dim }}>2m ago</span>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.muted, opacity: 0.6 }}>2 ITEMS · 14.5 KB</div>
              </div>

              {/* UNREAD */}
              <div style={{
                background: `${T.indigo}0a`, border: `1px solid ${T.indigo}20`,
                borderLeft: `2px solid ${T.indigo}`, borderRadius: 6, padding: "10px 14px",
                fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, color: T.textDim,
                position: "relative"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: T.textHi }}>Unread Session</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.dim }}>1m ago</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.muted, opacity: 0.6 }}>5 ITEMS · 42.1 KB</div>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.indigo, animation: "dot 1s infinite" }} />
                </div>
              </div>

              {/* WORKING */}
              <div style={{
                background: `${T.blue}06`, border: `1px solid ${T.blue}20`,
                borderLeft: `2px solid ${T.blue}`, borderRadius: 6, padding: "10px 14px",
                fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, color: T.textDim
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", border: `1px solid ${T.brand}`, animation: "spin 3s linear infinite" }} />
                    <span style={{ fontWeight: 600 }}>Working Session</span>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.dim }}>just now</span>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.muted, opacity: 0.6 }}>12 ITEMS · 108 KB</div>
              </div>

              {/* SELECTED */}
              <div style={{
                background: `${T.brand}20`, border: `1px solid ${T.brand}30`,
                borderLeft: `2px solid ${T.brand}`, borderRadius: 6, padding: "10px 14px",
                fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, color: T.textHi,
                transform: "translateX(4px) scale(1.005)", transition: "all .2s ease"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontWeight: 700 }}>Selected Session</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.brandLight }}>selected</span>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.textDim, opacity: 0.8 }}>8 ITEMS · 92 KB</div>
              </div>
            </div>
          )}

          {/* Column 2: Dot + Tint Treatment */}
          {(comparisonMode === "compare" || comparisonMode === "simplified") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T.brandLight, fontWeight: 800, letterSpacing: "0.05em", background: `${T.brandDim}`, padding: "4px 8px", borderRadius: 4, alignSelf: "flex-start" }}>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>Idle Session</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.dim }}>2m ago</span>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.dim }}>2 ITEMS · 14.5 KB</div>
              </div>

              {/* UNREAD */}
              <div style={{
                background: "rgba(165,180,252,0.06)", border: `1px solid ${T.indigo}15`,
                borderRadius: 6, padding: "10px 14px",
                fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, color: T.textDim,
                transition: "all .2s ease"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.indigo, boxShadow: `0 0 6px ${T.indigo}` }} />
                    <span style={{ fontWeight: 600, color: T.textHi }}>Unread Session</span>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.dim }}>1m ago</span>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.indigoLight, opacity: 0.8 }}>5 ITEMS · 42.1 KB</div>
              </div>

              {/* WORKING */}
              <div style={{
                background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)",
                borderRadius: 6, padding: "10px 14px",
                fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, color: T.textDim,
                transition: "all .2s ease"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 6px #34d399" }} />
                    <span style={{ fontWeight: 600 }}>Working Session</span>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.dim }}>just now</span>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#34d399", opacity: 0.8 }}>12 ITEMS · 108 KB</div>
              </div>

              {/* SELECTED */}
              <div style={{
                background: "rgba(6,182,212,0.10)", border: `1px solid ${T.brand}25`,
                borderRadius: 6, padding: "10px 14px",
                fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, color: T.textHi,
                transition: "all .2s ease"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.brandLight, boxShadow: `0 0 6px ${T.brandLight}` }} />
                    <span style={{ fontWeight: 700 }}>Selected Session</span>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.brandLight }}>selected</span>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.brandLight, opacity: 0.9 }}>8 ITEMS · 92 KB</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Three Matched Pairs */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Ic n="tasks" s={14} c={T.brandLight} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 800, color: T.text, letterSpacing: "0.05em" }}>THREE MATCHED PAIRS COMPARISON</span>
        </div>

        {/* PAIR 1: CHAT MESSAGE */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: T.purple, fontWeight: 800, letterSpacing: "0.05em" }}>PAIR 1: CHAT MESSAGE TREATMENT</div>
          <div style={{ display: "grid", gridTemplateColumns: (comparisonMode === "compare") ? "1fr 1fr" : "1fr", gap: 20 }}>
            {(comparisonMode === "compare" || comparisonMode === "current") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.muted, opacity: 0.6 }}>CURRENT STYLE (OVER-DECORATED)</div>
                {/* Current Chat Bubble Mock */}
                <div style={{ border: `1px solid ${T.border}`, background: T.surface, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: T.brand, fontWeight: 800, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 5, background: T.brandDim, border: `1px solid ${T.brand}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: T.brandLight }}>J</div>
                    <span>JULES RESPONSE</span>
                    <div style={{ height: 1, flex: 1, background: `${T.brand}20` }} />
                    <span style={{ color: T.textDim, fontSize: 10, fontWeight: 500 }}>12:04 PM</span>
                  </div>
                  <div style={{ background: T.surfaceHi, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.brand}`, borderRadius: 6, padding: 12, fontSize: 13, color: T.text, lineHeight: 1.5 }}>
                    Let me search the codebase to identify where the timeline styles are located.
                  </div>
                </div>
              </div>
            )}

            {(comparisonMode === "compare" || comparisonMode === "simplified") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.brandLight, opacity: 0.8 }}>SIMPLIFIED STYLE (CLEAN & MINIMAL)</div>
                {/* Simplified Chat Bubble Mock */}
                <div style={{ border: "none", background: "transparent", padding: 4 }}>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: T.brand, fontWeight: 800, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 5, background: T.brandDim, border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: T.brandLight }}>J</div>
                    <span>JULES RESPONSE</span>
                    <div style={{ height: 1, flex: 1, background: `${T.brand}12` }} />
                    <span style={{ color: T.textDim, fontSize: 10, fontWeight: 500 }}>12:04 PM</span>
                  </div>
                  <div style={{ background: "transparent", border: "none", borderLeft: `3px solid ${T.brand}`, borderRadius: 0, padding: "10px 0 10px 16px", fontSize: 14, color: T.text, lineHeight: 1.6 }}>
                    Let me search the codebase to identify where the timeline styles are located.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PAIR 2: PROGRESS UPDATE */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: T.purple, fontWeight: 800, letterSpacing: "0.05em" }}>PAIR 2: "REVIEW" PROGRESS TREATMENT</div>
          <div style={{ display: "grid", gridTemplateColumns: (comparisonMode === "compare") ? "1fr 1fr" : "1fr", gap: 20 }}>
            {(comparisonMode === "compare" || comparisonMode === "current") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.muted, opacity: 0.6 }}>CURRENT STYLE (6 VISUAL EFFECTS)</div>
                {/* Current Review Mock */}
                <div style={{
                  fontSize: 13, color: T.text, lineHeight: 1.75, padding: "20px 24px",
                  background: `linear-gradient(165deg, ${T.brand}0d, ${T.surface}44)`,
                  border: `1px solid ${T.brand}35`, borderRadius: 12,
                  boxShadow: `0 16px 48px ${T.brandDark}15, inset 0 0 20px ${T.brand}05`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                    <span style={{ padding: "2px 6px", borderRadius: 3, background: T.brandDim, color: T.brandLight, fontSize: 10, fontWeight: 800, letterSpacing: "0.05em" }}>REVIEW</span>
                    <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, ${T.brandLight}30, transparent)` }} />
                  </div>
                  Code changes look fantastic. Ready to proceed to pull request creation and run CI checks.
                </div>
              </div>
            )}

            {(comparisonMode === "compare" || comparisonMode === "simplified") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.brandLight, opacity: 0.8 }}>SIMPLIFIED STYLE (1 SIGNAL)</div>
                {/* Simplified Review Mock */}
                <div style={{
                  fontSize: 14, color: T.text, lineHeight: 1.6, padding: 0,
                  background: "transparent", border: "none", borderRadius: 0,
                  boxShadow: "none", fontFamily: "'IBM Plex Sans',sans-serif"
                }}>
                  Code changes look fantastic. Ready to proceed to pull request creation and run CI checks.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PAIR 3: SESSION COMPLETED PILL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: T.purple, fontWeight: 800, letterSpacing: "0.05em" }}>PAIR 3: "SESSION COMPLETED" PILL</div>
          <div style={{ display: "grid", gridTemplateColumns: (comparisonMode === "compare") ? "1fr 1fr" : "1fr", gap: 20 }}>
            {(comparisonMode === "compare" || comparisonMode === "current") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.muted, opacity: 0.6 }}>CURRENT STYLE (OVER-DECORATED)</div>
                {/* Current Pill Mock */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px",
                  background: `linear-gradient(135deg, ${T.brand}20, ${T.surfaceHi})`,
                  border: `1px solid ${T.brand}50`, borderRadius: 10,
                  color: T.brandLight, fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 12, fontWeight: 900, textTransform: "uppercase",
                  boxShadow: `0 4px 15px ${T.brand}15, inset 0 0 10px ${T.brand}10`,
                }}>
                  <Ic n="check" s={16} c={T.brandLight} />
                  SESSION FINISHED
                </div>
              </div>
            )}

            {(comparisonMode === "compare" || comparisonMode === "simplified") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.brandLight, opacity: 0.8 }}>SIMPLIFIED STYLE (CLEAN & DIRECT)</div>
                {/* Simplified Pill Mock */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
                  background: T.brandDim, border: `1px solid ${T.brand}40`, borderRadius: 4,
                  color: T.brandLight, fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 11, fontWeight: 800, letterSpacing: "0.08em",
                }}>
                  <Ic n="check" s={13} c={T.brandLight} />
                  SESSION FINISHED
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { DesignLab };
export default DesignLab;
